import {
	createExecutionContext,
	env,
	waitOnExecutionContext,
} from "cloudflare:test";
import { loginAs } from "@tests/helpers/auth.js";
import { createComment, createUser } from "@tests/helpers/factories.js";
import { api } from "@tests/helpers/request.js";
import { resetDB } from "@tests/helpers/setup.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Env } from "@/env.js";
import app from "@/index.js";
import {
	dispatchCommentNotifications,
	issueUnsubscribeToken,
} from "@/utils/notify.js";

type TestEnv = { DB: D1Database };

let db: D1Database;

beforeEach(async () => {
	db = (env as unknown as TestEnv).DB;
	await resetDB(db);
	await createUser(db, {
		email: "admin@test.com",
		password: "pass",
		type: "administrator",
	});
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

interface SentMail {
	to: string[];
	subject: string;
	html: string;
	text: string;
	headers?: Record<string, string>;
}

/** Stub the outbound Resend call and collect what the worker tried to send. */
function mockTransport(overrides: Partial<Env> = {}) {
	const sent: SentMail[] = [];
	vi.stubGlobal(
		"fetch",
		vi.fn(async (_url: string, init: RequestInit) => {
			sent.push(JSON.parse(String(init.body)) as SentMail);
			return new Response(JSON.stringify({ id: `msg_${sent.length}` }), {
				status: 200,
			});
		}),
	);

	const mailEnv = {
		DB: db,
		JWT_SECRET: "test-secret",
		SITE_NAME: "Test Blog",
		SITE_URL: "https://blog.test",
		RESEND_API_KEY: "re_test",
		MAIL_FROM: "Test Blog <notify@blog.test>",
		...overrides,
	} as unknown as Env;

	return { sent, mailEnv };
}

function recipients(sent: SentMail[]): string[] {
	return sent.map((mail) => mail.to[0]).sort();
}

async function dispatch(
	mailEnv: Env,
	commentId: number,
	phase: "created" | "approved" = "created",
): Promise<void> {
	await dispatchCommentNotifications(db, mailEnv, commentId, {
		phase,
		requestUrl: "https://waline.test/api/comment",
	});
}

describe("dispatchCommentNotifications — replies", () => {
	it("notifies the parent author and the administrator", async () => {
		const { sent, mailEnv } = mockTransport();
		const parent = await createComment(db, {
			mail: "parent@example.com",
			nick: "Parent",
			url: "/post",
		});
		const reply = await createComment(db, {
			mail: "replier@example.com",
			nick: "Replier",
			url: "/post",
			pid: parent.id,
			rid: parent.id,
		});

		await dispatch(mailEnv, reply.id);

		expect(recipients(sent)).toEqual(["admin@test.com", "parent@example.com"]);

		const replyMail = sent.find((mail) => mail.to[0] === "parent@example.com");
		expect(replyMail?.subject).toContain("Replier 回复了你的评论");
		expect(replyMail?.html).toContain(`https://blog.test/post#${reply.id}`);
		expect(replyMail?.html).toContain("你的评论");
		expect(replyMail?.headers?.["List-Unsubscribe"]).toContain(
			"https://waline.test/api/notify/unsubscribe?token=",
		);
		expect(replyMail?.text).toContain("不想再收到回复提醒");
	});

	it("does not notify the author of their own reply", async () => {
		const { sent, mailEnv } = mockTransport();
		const parent = await createComment(db, {
			mail: "same@example.com",
			url: "/post",
		});
		const reply = await createComment(db, {
			mail: "same@example.com",
			url: "/post",
			pid: parent.id,
			rid: parent.id,
		});

		await dispatch(mailEnv, reply.id);

		expect(recipients(sent)).toEqual(["admin@test.com"]);
	});

	it("skips a muted recipient", async () => {
		const { sent, mailEnv } = mockTransport();
		const parent = await createComment(db, {
			mail: "muted@example.com",
			url: "/post",
		});
		const reply = await createComment(db, {
			mail: "other@example.com",
			url: "/post",
			pid: parent.id,
		});
		await db
			.prepare("INSERT INTO wl_NotifyMute (email) VALUES ('muted@example.com')")
			.run();

		await dispatch(mailEnv, reply.id);

		expect(recipients(sent)).toEqual(["admin@test.com"]);
	});

	it("stops after the hourly per-recipient budget", async () => {
		const { sent, mailEnv } = mockTransport();
		const parent = await createComment(db, {
			mail: "busy@example.com",
			url: "/post",
		});
		const reply = await createComment(db, {
			mail: "other@example.com",
			url: "/post",
			pid: parent.id,
		});
		for (let i = 0; i < 8; i += 1) {
			await db
				.prepare(
					"INSERT INTO wl_Notify (comment_id, kind, recipient) VALUES (?, 'reply', 'busy@example.com')",
				)
				.bind(1000 + i)
				.run();
		}

		await dispatch(mailEnv, reply.id);

		expect(recipients(sent)).toEqual(["admin@test.com"]);
	});

	it("sends each notification once even if dispatched repeatedly", async () => {
		const { sent, mailEnv } = mockTransport();
		const parent = await createComment(db, {
			mail: "parent@example.com",
			url: "/post",
		});
		const reply = await createComment(db, {
			mail: "replier@example.com",
			url: "/post",
			pid: parent.id,
		});

		await dispatch(mailEnv, reply.id);
		expect(sent).toHaveLength(2);

		await dispatch(mailEnv, reply.id);
		expect(sent).toHaveLength(2);
	});
});

describe("dispatchCommentNotifications — moderation", () => {
	it("only mails the administrator for a waiting comment", async () => {
		const { sent, mailEnv } = mockTransport();
		const parent = await createComment(db, {
			mail: "parent@example.com",
			url: "/post",
		});
		const pending = await createComment(db, {
			mail: "pending@example.com",
			nick: "Pending",
			url: "/post",
			status: "waiting",
			pid: parent.id,
		});

		await dispatch(mailEnv, pending.id, "created");

		expect(recipients(sent)).toEqual(["admin@test.com"]);
		expect(sent[0].subject).toContain("待审核");
	});

	it("notifies the author and the parent when a pending comment is approved", async () => {
		const { sent, mailEnv } = mockTransport();
		const parent = await createComment(db, {
			mail: "parent@example.com",
			url: "/post",
		});
		const pending = await createComment(db, {
			mail: "pending@example.com",
			nick: "Pending",
			url: "/post",
			pid: parent.id,
		});

		await dispatch(mailEnv, pending.id, "approved");

		expect(recipients(sent)).toEqual([
			"admin@test.com",
			"parent@example.com",
			"pending@example.com",
		]);
		const authorMail = sent.find(
			(mail) => mail.to[0] === "pending@example.com",
		);
		expect(authorMail?.subject).toContain("你的评论已发布");
		expect(authorMail?.html).toContain("取消订阅");
	});

	it("never announces spam", async () => {
		const { sent, mailEnv } = mockTransport();
		const comment = await createComment(db, {
			mail: "spam@example.com",
			status: "spam",
		});

		await dispatch(mailEnv, comment.id);

		expect(sent).toHaveLength(0);
	});

	it("does not mail the administrator about their own comment", async () => {
		const { sent, mailEnv } = mockTransport();
		const parent = await createComment(db, {
			mail: "parent@example.com",
			url: "/post",
		});
		const adminReply = await createComment(db, {
			mail: "admin@test.com",
			nick: "Admin",
			url: "/post",
			pid: parent.id,
		});

		await dispatch(mailEnv, adminReply.id);

		expect(recipients(sent)).toEqual(["parent@example.com"]);
	});
});

describe("dispatchCommentNotifications — transports", () => {
	it("does nothing when no provider is configured", async () => {
		const { sent, mailEnv } = mockTransport({
			RESEND_API_KEY: undefined,
			MAIL_FROM: undefined,
		});
		const reply = await createComment(db, { url: "/post" });

		await expect(dispatch(mailEnv, reply.id)).resolves.toBeUndefined();
		expect(sent).toHaveLength(0);
	});

	it("respects DISABLE_EMAIL_NOTIFY", async () => {
		const { sent, mailEnv } = mockTransport({ DISABLE_EMAIL_NOTIFY: "true" });
		const comment = await createComment(db, { url: "/post" });

		await dispatch(mailEnv, comment.id);

		expect(sent).toHaveLength(0);
	});

	it("uses the Email Routing binding for the administrator only", async () => {
		const sent: SentMail[] = [];
		const send = vi.fn(async (message: SentMail) => {
			sent.push(message);
			return {};
		});
		const mailEnv = {
			DB: db,
			SITE_NAME: "Test Blog",
			MAIL: { send } as unknown as Env["MAIL"],
			SENDER_EMAIL: "notify@blog.test",
		} as unknown as Env;

		const parent = await createComment(db, {
			mail: "parent@example.com",
			url: "/post",
		});
		const reply = await createComment(db, {
			mail: "replier@example.com",
			url: "/post",
			pid: parent.id,
		});

		await dispatch(mailEnv, reply.id);

		// Email Routing can only reach verified destinations, so commenters are
		// not mailed; the administrator still is.
		expect(sent).toHaveLength(1);
		expect(sent[0].to).toBe("admin@test.com");
	});
});

describe("unsubscribe", () => {
	it("mutes the address behind a signed token", async () => {
		const parent = await createComment(db, {
			mail: "parent@example.com",
			url: "/post",
		});
		const token = await issueUnsubscribeToken(
			"test-secret",
			"parent@example.com",
		);

		const res = await api.get("/api/notify/unsubscribe", {
			params: { token },
		});
		expect(res.status).toBe(200);
		expect(await res.text()).toContain("已取消订阅");
		expect(
			await db
				.prepare(
					"SELECT email FROM wl_NotifyMute WHERE email = 'parent@example.com'",
				)
				.first(),
		).not.toBeNull();

		const { sent, mailEnv } = mockTransport();
		const reply = await createComment(db, {
			mail: "replier@example.com",
			url: "/post",
			pid: parent.id,
		});
		await dispatch(mailEnv, reply.id);

		expect(recipients(sent)).not.toContain("parent@example.com");
	});

	it("rejects a tampered token", async () => {
		const res = await api.get("/api/notify/unsubscribe", {
			params: { token: "706172656e74406578616d706c652e636f6d.deadbeef" },
		});
		expect(res.status).toBe(400);
		expect(await res.text()).toContain("链接无效");
	});
});

/** Exercise the real route with an injected mail environment. */
async function callApp(e: Env, request: Request): Promise<Response> {
	const ctx = createExecutionContext();
	const res = await app.fetch(request, e, ctx);
	await waitOnExecutionContext(ctx);
	return res;
}

function jsonRequest(
	url: string,
	method: string,
	body: unknown,
	token?: string,
): Request {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};
	if (token) headers.Authorization = `Bearer ${token}`;
	return new Request(url, { method, headers, body: JSON.stringify(body) });
}

describe("API wiring", () => {
	it("dispatches notifications after POST /api/comment", async () => {
		const { sent, mailEnv } = mockTransport();
		const parent = await createComment(db, {
			mail: "parent@example.com",
			url: "/post",
		});

		const res = await callApp(
			mailEnv,
			jsonRequest("https://waline.test/api/comment", "POST", {
				comment: "nice post",
				nick: "Replier",
				mail: "replier@example.com",
				url: "/post",
				pid: parent.id,
				rid: parent.id,
			}),
		);

		expect(res.status).toBe(201);
		expect(recipients(sent)).toEqual(["admin@test.com", "parent@example.com"]);
	});

	it("notifies the author when an admin approves a waiting comment", async () => {
		const { sent, mailEnv } = mockTransport();
		const pending = await createComment(db, {
			mail: "pending@example.com",
			nick: "Pending",
			url: "/post",
			status: "waiting",
		});
		const adminToken = await loginAs("admin@test.com", "pass");

		const res = await callApp(
			mailEnv,
			jsonRequest(
				`https://waline.test/api/comment/${pending.id}`,
				"PUT",
				{ status: "approved" },
				adminToken,
			),
		);

		expect(res.status).toBe(200);
		const authorMail = sent.find(
			(mail) => mail.to[0] === "pending@example.com",
		);
		expect(authorMail?.subject).toContain("你的评论已发布");
		expect(recipients(sent)).toContain("admin@test.com");
	});

	it("does not notify again when an approved comment is re-saved", async () => {
		const { sent, mailEnv } = mockTransport();
		const comment = await createComment(db, {
			mail: "author@example.com",
			url: "/post",
		});
		const adminToken = await loginAs("admin@test.com", "pass");

		const res = await callApp(
			mailEnv,
			jsonRequest(
				`https://waline.test/api/comment/${comment.id}`,
				"PUT",
				{ status: "approved" },
				adminToken,
			),
		);

		expect(res.status).toBe(200);
		expect(sent).toHaveLength(0);
	});
});
