/**
 * Notification endpoints.
 *
 * GET /api/notify/unsubscribe?token=… — one-click opt-out of reply mails.
 * The token is an HMAC-signed email address, so no login is required.
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
  <meta name="robots" content="noindex" />
  <title>${escapeHtml(heading)} · ${escapeHtml(siteName)}</title>
  <style>
    :root { color-scheme: light dark; }
    body {
      margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
      padding: 24px; background: #f5f6f8; color: #1f2328;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    }
    main {
      width: min(420px, 100%); background: #fff; border: 1px solid #e5e7eb; border-radius: 14px;
      padding: 28px 26px; box-shadow: 0 12px 32px rgba(15, 23, 42, .06);
    }
    small { display: block; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: #8b949e; margin-bottom: 6px; }
    h1 { margin: 0 0 10px; font-size: 20px; line-height: 1.4; }
    p { margin: 0; font-size: 14px; line-height: 1.75; color: #57606a; }
    @media (prefers-color-scheme: dark) {
      body { background: #0d1117; color: #e6edf3; }
      main { background: #161b22; border-color: #30363d; box-shadow: none; }
      p { color: #9198a1; }
    }
  </style>
</head>
<body>
  <main>
    <small>${escapeHtml(siteName)}</small>
    <h1>${escapeHtml(heading)}</h1>
    <p>${escapeHtml(message)}</p>
  </main>
</body>
</html>`;
}
