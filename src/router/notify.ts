/**
 * Notification endpoints.
 *
 * GET /api/notify/unsubscribe?token=… — one-click opt-out of reply mails.
 * The token is an HMAC-signed email address, so no login is required.
 *
 * The page reuses the blog's paper/ink reading surface (Flexoki tokens from
 * https://suenyiyang.com/src/index.css) and stays a single quiet paragraph.
 */
import { Hono } from "hono";
import type { Env } from "../env.js";
import { escapeHtml } from "../utils/mail.js";
import { verifyUnsubscribeToken } from "../utils/notify.js";

export const notifyRoutes = new Hono<{ Bindings: Env }>();

notifyRoutes.get("/unsubscribe", async (c) => {
	const siteName = c.env.SITE_NAME?.trim() || "Waline";
	const token = c.req.query("token") || "";
	const secret = c.env.JWT_SECRET?.trim();

	if (!secret || !token) {
		return c.html(
			unsubscribePage(siteName, "链接无效", "这个退订链接不完整。"),
			400,
		);
	}

	const email = await verifyUnsubscribeToken(secret, token);
	if (!email) {
		return c.html(
			unsubscribePage(siteName, "链接无效", "这个退订链接已失效或签名不正确。"),
			400,
		);
	}

	try {
		await c.env.DB.prepare(
			"INSERT INTO wl_NotifyMute (email) VALUES (?) ON CONFLICT DO NOTHING",
		)
			.bind(email)
			.run();
	} catch (err: any) {
		console.error("[Notify] mute failed:", err?.message || err);
		return c.html(
			unsubscribePage(
				siteName,
				"操作失败",
				"暂时无法保存退订状态，请稍后再试。",
			),
			500,
		);
	}

	return c.html(
		unsubscribePage(
			siteName,
			"已取消订阅",
			"之后不会再向这个邮箱发送回复提醒。你的评论和已收到的邮件不受影响。",
		),
	);
});

function unsubscribePage(
	siteName: string,
	heading: string,
	message: string,
): string {
	return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light dark" />
  <meta name="robots" content="noindex" />
  <title>${escapeHtml(heading)} · ${escapeHtml(siteName)}</title>
  <style>
    :root {
      --paper: #FFFCF0;
      --ink: #100F0F;
      --body: #343331;
      --muted: #6F6E69;
      --rule: #E6E4D9;
      color-scheme: light dark;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --paper: #100F0F;
        --ink: #E6E4D9;
        --body: #CECDC3;
        --muted: #878580;
        --rule: #343331;
      }
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 22px;
      background: var(--paper);
      color: var(--body);
      font-family: "LXGW WenKai", "Kaiti SC", "STKaiti", "KaiTi", "Songti SC", Georgia, serif;
      -webkit-font-smoothing: antialiased;
    }
    main { width: min(34rem, 100%); }
    .kicker {
      margin: 0;
      font-family: "IBM Plex Mono", ui-monospace, "SFMono-Regular", Menlo, monospace;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .16em;
      text-transform: uppercase;
      color: var(--muted);
    }
    h1 {
      margin: 14px 0 0;
      font-size: 22px;
      line-height: 1.45;
      font-weight: 700;
      color: var(--ink);
    }
    .rule {
      margin: 24px 0 0;
      border-top: 1px solid var(--rule);
      font-size: 0;
      line-height: 0;
    }
    p.message {
      margin: 24px 0 0;
      font-size: 17px;
      line-height: 1.9;
      color: var(--body);
    }
  </style>
</head>
<body>
  <main>
    <p class="kicker">${escapeHtml(siteName)}</p>
    <h1>${escapeHtml(heading)}</h1>
    <div class="rule">&nbsp;</div>
    <p class="message">${escapeHtml(message)}</p>
  </main>
</body>
</html>`;
}
