/**
 * Email delivery for comment notifications.
 *
 * Cloudflare Workers cannot depend on outbound SMTP (TCP/25 is blocked and
 * there is no SMTP client in the runtime), so this module only supports
 * HTTPS-based transports:
 *
 *   - `resend`      : Resend HTTP API, works for any recipient address.
 *   - `cloudflare`  : the `send_email` binding from Email Routing, which can
 *                     only deliver to verified destinations on the account.
 *
 * Configure `RESEND_API_KEY` (preferred) or bind `MAIL` to use Email Routing.
 */
import type { Env } from "../env.js";
import { isEnabled } from "./display.js";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type MailTransport = "resend" | "cloudflare";

export interface MailMessage {
	to: string;
	subject: string;
	text: string;
	html: string;
	/** Optional unsubscribe URL, exported as List-Unsubscribe for Resend. */
	unsubscribeUrl?: string;
}

/** Notifications are disabled when `DISABLE_EMAIL_NOTIFY` is truthy. */
export function isNotifyDisabled(env: Env): boolean {
	return isEnabled(env.DISABLE_EMAIL_NOTIFY);
}

export function getMailTransport(env: Env): MailTransport | null {
	if (env.RESEND_API_KEY?.trim()) return "resend";
	if (env.MAIL && typeof env.MAIL.send === "function") return "cloudflare";
	return null;
}

/** The Email Routing binding only delivers to verified destinations. */
export function supportsAnyRecipient(env: Env): boolean {
	return getMailTransport(env) === "resend";
}

/**
 * Sender address: `MAIL_FROM` wins, then `SENDER_NAME` + `SENDER_EMAIL`
 * (upstream Waline variables), then a bare `SENDER_EMAIL`.
 */
export function resolveSender(env: Env): string {
	const explicit = env.MAIL_FROM?.trim();
	if (explicit) return explicit;

	const name = env.SENDER_NAME?.trim();
	const email = env.SENDER_EMAIL?.trim();
	if (!email) return "";
	return name ? `${name} <${email}>` : email;
}

export async function sendMail(
	env: Env,
	message: MailMessage,
): Promise<boolean> {
	const transport = getMailTransport(env);
	const from = resolveSender(env);

	if (!transport) return false;
	if (!from) {
		console.error("[Mail] MAIL_FROM (or SENDER_EMAIL) is not configured");
		return false;
	}

	try {
		if (transport === "resend") {
			const headers: Record<string, string> = {};
			if (message.unsubscribeUrl) {
				headers["List-Unsubscribe"] = `<${message.unsubscribeUrl}>`;
			}
			const resp = await fetch(RESEND_ENDPOINT, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${env.RESEND_API_KEY?.trim()}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					from,
					to: [message.to],
					subject: message.subject,
					html: message.html,
					text: message.text,
					...(env.MAIL_REPLY_TO?.trim()
						? { reply_to: env.MAIL_REPLY_TO.trim() }
						: {}),
					...(Object.keys(headers).length > 0 ? { headers } : {}),
				}),
			});
			if (!resp.ok) {
				const detail = await resp.text().catch(() => "");
				console.error(
					`[Mail] Resend rejected the message (${resp.status}): ${detail.slice(0, 300)}`,
				);
				return false;
			}
			return true;
		}

		await env.MAIL?.send({
			to: message.to,
			from,
			subject: message.subject,
			html: message.html,
			text: message.text,
		});
		return true;
	} catch (err: any) {
		console.error("[Mail] send failed:", err?.message || err);
		return false;
	}
}

export function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

/** Escape + preserve line breaks for quoted comment text inside email HTML. */
export function escapeMultiline(value: string): string {
	return escapeHtml(value).replace(/\r?\n/g, "<br />");
}

export function truncate(value: string, limit: number): string {
	const trimmed = value.trim();
	if (trimmed.length <= limit) return trimmed;
	return `${trimmed.slice(0, limit).trimEnd()}…`;
}

export function renderEmailLayout(opts: {
	siteName: string;
	heading: string;
	intro: string;
	cardHtml: string;
	actionUrl?: string;
	actionLabel?: string;
	footerHtml?: string;
}): string {
	const action = opts.actionUrl
		? `<p style="margin:20px 0 4px"><a href="${escapeHtml(opts.actionUrl)}" style="display:inline-block;padding:10px 18px;border-radius:999px;background:#2f6feb;color:#ffffff;text-decoration:none;font-size:14px">${escapeHtml(opts.actionLabel || "查看")}</a></p>`
		: "";

	return `<!doctype html>
<html lang="zh-CN">
<body style="margin:0;padding:24px 12px;background:#f5f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;color:#1f2328">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:24px">
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#8b949e">${escapeHtml(opts.siteName)}</p>
    <h1 style="margin:0 0 12px;font-size:19px;line-height:1.4">${escapeHtml(opts.heading)}</h1>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#57606a">${escapeHtml(opts.intro)}</p>
    <div style="border-left:3px solid #d0d7de;background:#f6f8fa;border-radius:6px;padding:12px 14px;font-size:14px;line-height:1.75;color:#24292f">${opts.cardHtml}</div>
    ${action}
    <hr style="border:none;border-top:1px solid #eaeef2;margin:20px 0 12px" />
    <p style="margin:0;font-size:12px;line-height:1.7;color:#8b949e">${opts.footerHtml || ""}</p>
  </div>
</body>
</html>`;
}
