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
 *
 * Templates mirror https://suenyiyang.com (Flexoki paper + ink, LXGW WenKai
 * body, IBM Plex Mono metadata, hairline rules, a single blue accent and no
 * cards). Tokens are copied from the blog's `src/index.css`.
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

/** Design tokens of https://suenyiyang.com (light and dark reading surfaces). */
export const BLOG_TOKENS = {
	paper: "#FFFCF0",
	ink: "#100F0F",
	body: "#343331",
	secondary: "#575653",
	muted: "#6F6E69",
	rule: "#E6E4D9",
	accent: "#027AFF",
	darkPaper: "#100F0F",
	darkInk: "#E6E4D9",
	darkBody: "#CECDC3",
	darkSecondary: "#9F9D96",
	darkMuted: "#878580",
	darkRule: "#343331",
} as const;

const SERIF =
	"'LXGW WenKai', 'Kaiti SC', 'STKaiti', 'KaiTi', 'Songti SC', Georgia, serif";
const MONO =
	"'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const T = BLOG_TOKENS;

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

/** Render plain text as paragraphs, keeping single line breaks. */
export function renderParagraphs(value: string): string {
	return value
		.split(/\r?\n{2,}/)
		.map((part) => part.trim())
		.filter(Boolean)
		.map((part) => `<p style="margin:0 0 .85em">${escapeMultiline(part)}</p>`)
		.join("");
}

export function truncate(value: string, limit: number): string {
	const trimmed = value.trim();
	if (trimmed.length <= limit) return trimmed;
	return `${trimmed.slice(0, limit).trimEnd()}…`;
}

export interface EmailLayoutOptions {
	/** Mono eyebrow, e.g. `SUENYIYANG.COM`. */
	kicker: string;
	heading: string;
	/** Small chip next to the heading, e.g. `待审核`. */
	badge?: string;
	/** Mono metadata line, e.g. `NICK · 2026.11.19 09:04`. */
	meta?: string;
	/** Pre-escaped comment body. */
	bodyHtml: string;
	/** Optional quote in the reading column's blockquote style. */
	quote?: { label: string; html: string };
	action?: { url: string; label: string };
	footerHtml: string;
}

export function renderEmailLayout(opts: EmailLayoutOptions): string {
	const badge = opts.badge
		? `<span class="em-badge" style="display:inline-block;margin-left:8px;padding:1px 6px;border:1px solid ${T.rule};border-radius:3px;font-family:${MONO};font-size:10px;font-weight:500;letter-spacing:.08em;color:${T.muted};vertical-align:3px">${escapeHtml(opts.badge)}</span>`
		: "";

	return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light dark" />
<meta name="supported-color-schemes" content="light dark" />
<title>${escapeHtml(opts.heading)}</title>
<style>
  @media (prefers-color-scheme: dark) {
    .em-surface { background: ${T.darkPaper} !important; }
    .em-ink { color: ${T.darkInk} !important; }
    .em-body { color: ${T.darkBody} !important; }
    .em-quote { color: ${T.darkSecondary} !important; border-color: ${T.darkRule} !important; }
    .em-muted { color: ${T.darkMuted} !important; }
    .em-rule { border-color: ${T.darkRule} !important; }
    .em-badge { color: ${T.darkMuted} !important; border-color: ${T.darkRule} !important; }
  }
</style>
</head>
<body class="em-surface" style="margin:0;padding:0;background:${T.paper}">
  <div class="em-surface" style="background:${T.paper};padding:44px 22px 38px">
    <div style="max-width:540px;margin:0 auto;font-family:${SERIF}">
      <div class="em-muted" style="font-family:${MONO};font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:${T.muted}">${escapeHtml(opts.kicker)}</div>

      <h1 class="em-ink" style="margin:14px 0 0;font-family:${SERIF};font-size:22px;line-height:1.45;font-weight:700;color:${T.ink}">${escapeHtml(opts.heading)}${badge}</h1>
      ${
				opts.meta
					? `<div class="em-muted" style="margin:10px 0 0;font-family:${MONO};font-size:11px;font-weight:500;letter-spacing:.04em;color:${T.muted}">${escapeHtml(opts.meta)}</div>`
					: ""
			}

      <div class="em-rule" style="margin:24px 0 0;border-top:1px solid ${T.rule};font-size:0;line-height:0">&nbsp;</div>

      <div class="em-body" style="margin:24px 0 0;font-family:${SERIF};font-size:17px;line-height:1.9;color:${T.body}">${opts.bodyHtml}</div>

      ${
				opts.quote
					? `<div class="em-quote" style="margin:24px 0 0;padding-left:14px;border-left:1px solid ${T.rule};font-family:${SERIF};font-size:16px;line-height:1.8;color:${T.secondary}">
        <div class="em-muted" style="margin:0 0 6px;font-family:${MONO};font-size:10px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:${T.muted}">${escapeHtml(opts.quote.label)}</div>
        ${opts.quote.html}
      </div>`
					: ""
			}

      ${
				opts.action
					? `<div style="margin:28px 0 0"><a href="${escapeHtml(opts.action.url)}" style="font-family:${MONO};font-size:12px;font-weight:500;letter-spacing:.05em;color:${T.accent};text-decoration:none;border-bottom:1px solid rgba(2,122,255,.35)">${escapeHtml(opts.action.label)}</a></div>`
					: ""
			}

      <div class="em-rule" style="margin:32px 0 0;border-top:1px solid ${T.rule};font-size:0;line-height:0">&nbsp;</div>

      <div class="em-muted" style="margin:16px 0 0;font-family:${MONO};font-size:10px;font-weight:400;line-height:1.9;letter-spacing:.04em;color:${T.muted}">${opts.footerHtml}</div>
    </div>
  </div>
</body>
</html>`;
}
