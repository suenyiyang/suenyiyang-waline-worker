import { describe, expect, it } from "vitest";
import {
	buildAdminEmail,
	buildApprovedEmail,
	buildReplyEmail,
	formatDate,
} from "@/utils/notify.js";

const ctx = {
	siteName: "suenyiyang.com",
	siteUrl: "https://suenyiyang.com",
	path: "/posts/agent-stack",
	commentUrl: "https://suenyiyang.com/posts/agent-stack#12",
	date: "2026.11.19 09:04",
};

const excerpt =
	"这篇文章把 agent 的上下文管理讲得很清楚，尤其是「把工具调用折叠成一行」那一段。\n\n想问下 relay 断线重连是怎么处理的？";

describe("formatDate", () => {
	it("formats D1 timestamps for Asia/Shanghai", () => {
		expect(formatDate("2026-11-19 01:04:04")).toBe("2026.11.19 09:04");
		expect(formatDate("2026-11-19T01:04:04Z")).toBe("2026.11.19 09:04");
	});

	it("returns an empty string for missing or invalid values", () => {
		expect(formatDate(null)).toBe("");
		expect(formatDate("")).toBe("");
		expect(formatDate("not-a-date")).toBe("");
	});
});

describe("email templates", () => {
	it("builds the admin alert with kicker, meta and comment link", () => {
		const email = buildAdminEmail(ctx, {
			nick: "Yiyang Suen",
			excerpt,
			pending: false,
		});

		expect(email.subject).toBe("[suenyiyang.com] 新评论 · Yiyang Suen");
		expect(email.html).toContain("suenyiyang.com");
		expect(email.html).toContain("收到新评论");
		expect(email.html).toContain(
			"Yiyang Suen · /posts/agent-stack · 2026.11.19 09:04",
		);
		expect(email.html).toContain("https://suenyiyang.com/posts/agent-stack#12");
		expect(email.text).toContain(
			"查看：https://suenyiyang.com/posts/agent-stack#12",
		);
	});

	it("marks comments that are still waiting for moderation", () => {
		const email = buildAdminEmail(
			{ ...ctx, adminUrl: "https://waline.suenyiyang.com" },
			{
				nick: "Spammer",
				excerpt: "hello",
				pending: true,
			},
		);

		expect(email.subject).toBe("[suenyiyang.com] 待审核 · Spammer");
		expect(email.html).toContain("新评论待审核");
		expect(email.html).toContain("等待审核");
		expect(email.html).toContain("https://waline.suenyiyang.com/ui");
	});

	it("quotes the earlier comment in reply notifications", () => {
		const email = buildReplyEmail(ctx, {
			nick: "Reader",
			excerpt: "relay 用的是 Paseo 自己的重连逻辑。",
			parentExcerpt: excerpt,
			unsubscribeUrl:
				"https://waline.suenyiyang.com/api/notify/unsubscribe?token=ab.cd",
		});

		expect(email.subject).toBe("[suenyiyang.com] Reader 回复了你的评论");
		expect(email.html).toContain("你之前的评论");
		expect(email.html).toContain("relay 用的是 Paseo 自己的重连逻辑。");
		expect(email.html).toContain("退订");
		expect(email.text).toContain("不想再收到回复提醒？");
	});

	it("keeps the approval mail to one comment block", () => {
		const email = buildApprovedEmail(ctx, { excerpt });

		expect(email.subject).toBe("[suenyiyang.com] 你的评论已发布");
		expect(email.html).toContain("你的评论已发布");
		expect(email.html).not.toContain("你之前的评论");
	});

	it("escapes comment text instead of rendering markup", () => {
		const email = buildReplyEmail(ctx, {
			nick: "<script>alert(1)</script>",
			excerpt: '<img src=x onerror="alert(1)">',
			parentExcerpt: "& <b>bold</b>",
		});

		expect(email.html).not.toContain("<script>");
		expect(email.html).not.toContain("<img src=x");
		expect(email.html).toContain(
			"&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
		);
	});

	it("does not invent a link when the comment has no page url", () => {
		const email = buildAdminEmail(
			{ ...ctx, path: "", commentUrl: undefined },
			{ nick: "Anon", excerpt: "hi", pending: false },
		);

		expect(email.html).not.toContain("查看评论 →");
		expect(email.text).not.toContain("查看：");
	});
});
