import { afterEach, describe, expect, it, vi } from "vitest";
import type { Env } from "@/env.js";
import {
	escapeHtml,
	escapeMultiline,
	getMailTransport,
	renderEmailLayout,
	resolveSender,
	sendMail,
	supportsAnyRecipient,
	truncate,
} from "@/utils/mail.js";

function env(overrides: Partial<Env> = {}): Env {
	return overrides as Env;
}

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe("resolveSender", () => {
	it("prefers MAIL_FROM", () => {
		expect(
			resolveSender(
				env({
					MAIL_FROM: "Blog <notify@blog.test>",
					SENDER_NAME: "Ignored",
					SENDER_EMAIL: "ignored@blog.test",
				}),
			),
		).toBe("Blog <notify@blog.test>");
	});

	it("falls back to SENDER_NAME + SENDER_EMAIL", () => {
		expect(
			resolveSender(env({ SENDER_NAME: "Blog", SENDER_EMAIL: "n@blog.test" })),
		).toBe("Blog <n@blog.test>");
		expect(resolveSender(env({ SENDER_EMAIL: "n@blog.test" }))).toBe(
			"n@blog.test",
		);
	});

	it("returns an empty string when nothing is configured", () => {
		expect(resolveSender(env())).toBe("");
	});
});

describe("transport selection", () => {
	it("prefers Resend when a key is present", () => {
		const mail = { send: vi.fn() } as unknown as Env["MAIL"];
		const e = env({ RESEND_API_KEY: "re_test", MAIL: mail });
		expect(getMailTransport(e)).toBe("resend");
		expect(supportsAnyRecipient(e)).toBe(true);
	});

	it("falls back to the Email Routing binding", () => {
		const e = env({ MAIL: { send: vi.fn() } as unknown as Env["MAIL"] });
		expect(getMailTransport(e)).toBe("cloudflare");
		expect(supportsAnyRecipient(e)).toBe(false);
	});

	it("returns null when no provider is configured", () => {
		expect(getMailTransport(env())).toBeNull();
	});
});

describe("sendMail", () => {
	it("posts to the Resend API with List-Unsubscribe metadata", async () => {
		const requests: { url: string; init: RequestInit }[] = [];
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: string, init: RequestInit) => {
				requests.push({ url, init });
				return new Response(JSON.stringify({ id: "msg_1" }), { status: 200 });
			}),
		);

		const ok = await sendMail(
			env({
				RESEND_API_KEY: "re_test",
				MAIL_FROM: "Blog <notify@blog.test>",
				MAIL_REPLY_TO: "owner@blog.test",
			}),
			{
				to: "reader@example.com",
				subject: "hi",
				html: "<p>hello</p>",
				text: "hello",
				unsubscribeUrl: "https://waline.test/api/notify/unsubscribe?token=x",
			},
		);

		expect(ok).toBe(true);
		expect(requests).toHaveLength(1);
		expect(requests[0].url).toBe("https://api.resend.com/emails");
		const headers = requests[0].init.headers as Record<string, string>;
		expect(headers.Authorization).toBe("Bearer re_test");
		const body = JSON.parse(String(requests[0].init.body));
		expect(body).toMatchObject({
			from: "Blog <notify@blog.test>",
			to: ["reader@example.com"],
			subject: "hi",
			reply_to: "owner@blog.test",
			headers: {
				"List-Unsubscribe":
					"<https://waline.test/api/notify/unsubscribe?token=x>",
			},
		});
	});

	it("returns false when the provider rejects the message", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => new Response("invalid api key", { status: 401 })),
		);

		await expect(
			sendMail(env({ RESEND_API_KEY: "re_bad", MAIL_FROM: "n@blog.test" }), {
				to: "a@b.test",
				subject: "s",
				html: "",
				text: "",
			}),
		).resolves.toBe(false);
	});

	it("uses the Email Routing binding when Resend is not configured", async () => {
		const send = vi.fn(async () => ({}));
		const ok = await sendMail(
			env({
				MAIL: { send } as unknown as Env["MAIL"],
				SENDER_EMAIL: "n@blog.test",
			}),
			{ to: "admin@blog.test", subject: "s", html: "<p>x</p>", text: "x" },
		);

		expect(ok).toBe(true);
		expect(send).toHaveBeenCalledWith(
			expect.objectContaining({
				to: "admin@blog.test",
				from: "n@blog.test",
				subject: "s",
			}),
		);
	});

	it("does nothing without a transport or a sender", async () => {
		const fetchStub = vi.fn();
		vi.stubGlobal("fetch", fetchStub);

		await expect(
			sendMail(env(), { to: "a@b.test", subject: "s", html: "", text: "" }),
		).resolves.toBe(false);
		await expect(
			sendMail(env({ RESEND_API_KEY: "re_test" }), {
				to: "a@b.test",
				subject: "s",
				html: "",
				text: "",
			}),
		).resolves.toBe(false);
		expect(fetchStub).not.toHaveBeenCalled();
	});
});

describe("rendering helpers", () => {
	it("escapes HTML and keeps line breaks in multiline mode", () => {
		expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
			"&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;",
		);
		expect(escapeMultiline("a\nb")).toBe("a<br />b");
	});

	it("truncates long values", () => {
		expect(truncate("  short  ", 10)).toBe("short");
		expect(truncate("abcdefghij", 5)).toBe("abcde…");
	});

	it("escapes interpolated values but keeps trusted body HTML", () => {
		const html = renderEmailLayout({
			kicker: "<site>",
			heading: "<h1>",
			meta: `"meta"`,
			bodyHtml: "<strong>ok</strong>",
			badge: "<tag>",
			action: { url: "https://blog.test/?a=1&b=2", label: "查看" },
			footerHtml: "<b>footer</b>",
		});

		expect(html).toContain("&lt;site&gt;");
		expect(html).toContain("&lt;h1&gt;");
		expect(html).toContain("&quot;meta&quot;");
		expect(html).toContain("&lt;tag&gt;");
		expect(html).toContain("https://blog.test/?a=1&amp;b=2");
		// Trusted layout fragments are injected as HTML.
		expect(html).toContain("<strong>ok</strong>");
	});

	it("uses the blog paper/ink tokens and a dark-mode override", () => {
		const html = renderEmailLayout({
			kicker: "suenyiyang.com",
			heading: "收到新评论",
			bodyHtml: "hi",
			footerHtml: "bye",
		});

		expect(html).toContain("#FFFCF0");
		expect(html).toContain("#100F0F");
		expect(html).toContain("#E6E4D9");
		expect(html).toContain("prefers-color-scheme: dark");
		expect(html).toContain("LXGW WenKai");
	});
});
