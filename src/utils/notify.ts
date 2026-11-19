/**
 * Comment email notifications.
 *
 * Three notification kinds are sent, each deduplicated per (comment, kind,
 * recipient) through `wl_Notify`:
 *
 *   - `admin`   : a new comment (or one awaiting moderation) reached the site.
 *   - `reply`   : a published reply targets an earlier comment's author.
 *   - `approved`: a comment that was waiting for moderation is now published.
 *
 * Reply/approval mail carries a signed unsubscribe link backed by
 * `wl_NotifyMute`. Delivery is best-effort: failures are logged and never
 * change the API response.
 */
import type { Env } from "../env.js";
import {
	escapeHtml,
	escapeMultiline,
	getMailTransport,
	isNotifyDisabled,
	renderEmailLayout,
	resolveSender,
	sendMail,
	supportsAnyRecipient,
	truncate,
} from "./mail.js";

const MAX_NOTIFY_PER_HOUR = 8;
const EXCERPT_LIMIT = 600;
const warned = new Set<string>();

function warnOnce(key: string, message: string): void {
	if (warned.has(key)) return;
	warned.add(key);
	console.warn(message);
}

type NotifyKind = "admin" | "reply" | "approved";
export type NotifyPhase = "created" | "approved";

interface CommentRow {
	id: number;
	nick: string | null;
	mail: string | null;
	url: string | null;
	comment: string | null;
	orig: string | null;
	pid: number | null;
	status: string | null;
	user_id: number | null;
}

export interface NotifyOptions {
	/** `created` runs right after a comment is stored, `approved` after moderation. */
	phase?: NotifyPhase;
	/** Request URL, used to build absolute unsubscribe links. */
	requestUrl?: string;
}

/**
 * Send every notification a comment is entitled to. Safe to call more than
 * once for the same comment: `wl_Notify` prevents duplicate mails.
 */
export async function dispatchCommentNotifications(
	db: D1Database,
	env: Env,
	commentId: number,
	options: NotifyOptions = {},
): Promise<void> {
	if (isNotifyDisabled(env)) return;
	if (!getMailTransport(env)) return;
	if (!resolveSender(env)) {
		warnOnce(
			"sender",
			"[Notify] MAIL_FROM (or SENDER_EMAIL) is not configured; comment notifications are skipped",
		);
		return;
	}

	const phase = options.phase || "created";

	try {
		const row = await db
			.prepare(
				`SELECT id, nick, mail, url, comment, orig, pid, status, user_id
         FROM wl_Comment WHERE id = ?`,
			)
			.bind(commentId)
			.first<CommentRow>();
		if (!row) return;
		if (row.status === "spam") return;

		const ctx: NotifyContext = {
			db,
			env,
			comment: row,
			phase,
			siteName: env.SITE_NAME?.trim() || "Waline",
			siteUrl: (env.SITE_URL || "").replace(/\/+$/, ""),
			baseUrl: originOf(options.requestUrl),
			authorMail: (row.mail || "").trim(),
			nick: (row.nick || "").trim() || "匿名访客",
		};
		ctx.commentUrl = commentLink(ctx, row);
		ctx.excerpt = excerptOf(row);

		await notifyAdmins(ctx);
		if (row.status === "approved") {
			await notifyReply(ctx);
			if (phase === "approved") await notifyAuthorApproved(ctx);
		}
	} catch (err: any) {
		console.error(
			"[Notify] skipped:",
			err?.message || err,
			"— if the error mentions wl_Notify, re-apply schema.sql",
		);
	}
}

interface NotifyContext {
	db: D1Database;
	env: Env;
	comment: CommentRow;
	phase: NotifyPhase;
	siteName: string;
	siteUrl: string;
	baseUrl: string;
	authorMail: string;
	nick: string;
	commentUrl?: string;
	excerpt?: string;
}

// ─── Admin notification ──────────────────────────────────────────────────────

async function notifyAdmins(ctx: NotifyContext): Promise<void> {
	const pending = ctx.comment.status !== "approved";
	const recipients = await getAdminRecipients(ctx.db, ctx.env);
	// Admins already receive their own comments in the panel.
	if (await isAdministratorEmail(ctx.db, ctx.authorMail)) return;

	for (const to of recipients) {
		if (to.toLowerCase() === ctx.authorMail.toLowerCase()) continue;
		if (!(await canNotify(ctx.db, to))) continue;
		if (!(await claim(ctx.db, ctx.comment.id, "admin", to))) continue;

		const heading = pending ? "有新的评论等待审核" : "收到新的评论";
		const intro = pending
			? `${ctx.nick} 在 ${pagePath(ctx)} 留言了，通过审核后才会公开显示。`
			: `${ctx.nick} 在 ${pagePath(ctx)} 留言了。`;
		const subject = pending
			? `[${ctx.siteName}] 待审核 · ${ctx.nick} 在 ${pagePath(ctx)} 留言`
			: `[${ctx.siteName}] 新评论 · ${ctx.nick}`;

		const sent = await sendMail(ctx.env, {
			to,
			subject,
			html: renderEmailLayout({
				siteName: ctx.siteName,
				heading,
				intro,
				cardHtml: `<strong>${escapeHtml(ctx.nick)}</strong><br />${escapeMultiline(ctx.excerpt || "")}`,
				actionUrl: ctx.commentUrl,
				actionLabel: "查看评论",
				footerHtml: pending
					? `回复此邮件不会通知留言者。请在管理面板中审核：${escapeHtml(ctx.baseUrl || ctx.siteUrl)}/ui`
					: "你收到这封邮件是因为你是本站管理员。",
			}),
			text: buildText(ctx, heading, intro, ctx.commentUrl),
		});
		if (!sent) await release(ctx.db, ctx.comment.id, "admin", to);
	}
}

// ─── Reply notification ──────────────────────────────────────────────────────

async function notifyReply(ctx: NotifyContext): Promise<void> {
	const pid = ctx.comment.pid;
	if (!pid || pid === ctx.comment.id) return;
	// Reply recipients are arbitrary commenters, which the Email Routing
	// binding cannot reach (verified destinations only).
	if (!supportsAnyRecipient(ctx.env)) return;

	const parent = await ctx.db
		.prepare(
			`SELECT id, nick, mail, url, comment, orig, pid, status, user_id
       FROM wl_Comment WHERE id = ?`,
		)
		.bind(pid)
		.first<CommentRow>();
	if (!parent || parent.status === "spam") return;

	let to = (parent.mail || "").trim();
	if (!to && parent.user_id) {
		const user = await ctx.db
			.prepare("SELECT email FROM wl_Users WHERE id = ?")
			.bind(parent.user_id)
			.first<{ email: string }>();
		to = (user?.email || "").trim();
	}
	if (!to) return;
	if (to.toLowerCase() === ctx.authorMail.toLowerCase()) return;
	if (!(await canNotify(ctx.db, to))) return;

	const parentExcerpt = excerptOf(parent);

	const unsubscribeUrl = await buildUnsubscribeUrl(ctx, to);
	if (!(await claim(ctx.db, ctx.comment.id, "reply", to))) return;

	const heading = `${ctx.nick} 回复了你的评论`;
	const intro = `${ctx.nick} 在 ${pagePath(ctx)} 回复了你。`;
	const sent = await sendMail(ctx.env, {
		to,
		subject: `[${ctx.siteName}] ${ctx.nick} 回复了你的评论`,
		html: renderEmailLayout({
			siteName: ctx.siteName,
			heading,
			intro,
			cardHtml: `<strong>${escapeHtml(ctx.nick)}</strong><br />${escapeMultiline(ctx.excerpt || "")}${
				parentExcerpt
					? `<div style="margin-top:12px;padding-top:12px;border-top:1px dashed #d0d7de;color:#57606a"><em>你的评论：</em><br />${escapeMultiline(parentExcerpt)}</div>`
					: ""
			}`,
			actionUrl: ctx.commentUrl,
			actionLabel: "查看并回复",
			footerHtml: unsubscribeFooter(unsubscribeUrl),
		}),
		text: buildText(ctx, heading, intro, ctx.commentUrl, unsubscribeUrl),
		unsubscribeUrl: unsubscribeUrl || undefined,
	});
	if (!sent) await release(ctx.db, ctx.comment.id, "reply", to);
}

// ─── Approval notification for the comment author ────────────────────────────

async function notifyAuthorApproved(ctx: NotifyContext): Promise<void> {
	const to = ctx.authorMail;
	if (!to) return;
	// See notifyReply: Email Routing bindings only reach verified addresses.
	if (!supportsAnyRecipient(ctx.env)) return;
	if (!(await canNotify(ctx.db, to))) return;

	const unsubscribeUrl = await buildUnsubscribeUrl(ctx, to);
	if (!(await claim(ctx.db, ctx.comment.id, "approved", to))) return;

	const heading = "你的评论已发布";
	const intro = `你在 ${pagePath(ctx)} 的评论已通过审核，现在可以公开看到了。`;
	const sent = await sendMail(ctx.env, {
		to,
		subject: `[${ctx.siteName}] 你的评论已发布`,
		html: renderEmailLayout({
			siteName: ctx.siteName,
			heading,
			intro,
			cardHtml: escapeMultiline(ctx.excerpt || ""),
			actionUrl: ctx.commentUrl,
			actionLabel: "查看评论",
			footerHtml: unsubscribeFooter(unsubscribeUrl),
		}),
		text: buildText(ctx, heading, intro, ctx.commentUrl, unsubscribeUrl),
		unsubscribeUrl: unsubscribeUrl || undefined,
	});
	if (!sent) await release(ctx.db, ctx.comment.id, "approved", to);
}

// ─── Recipients, dedupe and rate limiting ────────────────────────────────────

async function getAdminRecipients(db: D1Database, env: Env): Promise<string[]> {
	const fromEnv = (env.NOTIFY_EMAILS || "")
		.split(/[,;\s]+/)
		.map((value) => value.trim())
		.filter((value) => value.includes("@"));
	if (fromEnv.length > 0) return dedupe(fromEnv);

	const result = await db
		.prepare(
			"SELECT email FROM wl_Users WHERE type = 'administrator' AND email <> '' LIMIT 5",
		)
		.all<{ email: string }>();
	return dedupe(result.results.map((row) => String(row.email).trim()));
}

async function isAdministratorEmail(
	db: D1Database,
	email: string,
): Promise<boolean> {
	if (!email) return false;
	const row = await db
		.prepare(
			"SELECT 1 AS hit FROM wl_Users WHERE type = 'administrator' AND lower(email) = lower(?) LIMIT 1",
		)
		.bind(email)
		.first<{ hit: number }>();
	return Boolean(row);
}

/** Muted recipients and per-hour rate limits are checked before sending. */
async function canNotify(db: D1Database, email: string): Promise<boolean> {
	const muted = await db
		.prepare("SELECT 1 AS hit FROM wl_NotifyMute WHERE lower(email) = lower(?)")
		.bind(email)
		.first<{ hit: number }>();
	if (muted) return false;

	const recent = await db
		.prepare(
			`SELECT COUNT(*) AS count FROM wl_Notify
       WHERE lower(recipient) = lower(?) AND createdAt > datetime('now', '-1 hour')`,
		)
		.bind(email)
		.first<{ count: number }>();
	return (recent?.count || 0) < MAX_NOTIFY_PER_HOUR;
}

async function claim(
	db: D1Database,
	commentId: number,
	kind: NotifyKind,
	recipient: string,
): Promise<boolean> {
	const result = await db
		.prepare(
			`INSERT INTO wl_Notify (comment_id, kind, recipient) VALUES (?, ?, ?)
       ON CONFLICT DO NOTHING`,
		)
		.bind(commentId, kind, recipient)
		.run();
	return (result.meta?.changes ?? 0) > 0;
}

async function release(
	db: D1Database,
	commentId: number,
	kind: NotifyKind,
	recipient: string,
): Promise<void> {
	await db
		.prepare(
			"DELETE FROM wl_Notify WHERE comment_id = ? AND kind = ? AND recipient = ?",
		)
		.bind(commentId, kind, recipient)
		.run();
}

// ─── Unsubscribe tokens ──────────────────────────────────────────────────────

export async function issueUnsubscribeToken(
	secret: string,
	email: string,
): Promise<string> {
	const hex = toHex(new TextEncoder().encode(email.trim().toLowerCase()));
	return `${hex}.${await hmacHex(secret, hex)}`;
}

export async function verifyUnsubscribeToken(
	secret: string,
	token: string,
): Promise<string | null> {
	const [hex, signature] = token.split(".");
	if (!hex || !signature) return null;
	if (!/^[0-9a-f]+$/.test(hex) || hex.length % 2 !== 0) return null;

	const expected = await hmacHex(secret, hex);
	if (!timingSafeEqual(signature.toLowerCase(), expected)) return null;

	try {
		const bytes = new Uint8Array(hex.length / 2);
		for (let i = 0; i < bytes.length; i += 1) {
			bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
		}
		const email = new TextDecoder().decode(bytes).trim();
		return email.includes("@") ? email : null;
	} catch {
		return null;
	}
}

async function buildUnsubscribeUrl(
	ctx: NotifyContext,
	email: string,
): Promise<string | null> {
	const secret = ctx.env.JWT_SECRET?.trim();
	if (!secret || !ctx.baseUrl) return null;
	const token = await issueUnsubscribeToken(secret, email);
	return `${ctx.baseUrl}/api/notify/unsubscribe?token=${encodeURIComponent(token)}`;
}

// ─── Small helpers ──────────────────────────────────────────────────────────

function pagePath(ctx: NotifyContext): string {
	return ctx.comment.url || ctx.siteUrl || "本站";
}

function excerptOf(row: CommentRow): string {
	return truncate(row.orig || row.comment || "", EXCERPT_LIMIT);
}

function commentLink(ctx: NotifyContext, row: CommentRow): string | undefined {
	const path = row.url || "";
	let page: string;
	if (/^https?:\/\//i.test(path)) {
		page = path;
	} else if (!ctx.siteUrl) {
		return undefined;
	} else {
		page = `${ctx.siteUrl}${path.startsWith("/") ? "" : "/"}${path}`;
	}
	return `${page}#${row.id}`;
}

function originOf(requestUrl?: string): string {
	if (!requestUrl) return "";
	try {
		return new URL(requestUrl).origin;
	} catch {
		return "";
	}
}

function buildText(
	ctx: NotifyContext,
	heading: string,
	intro: string,
	commentUrl?: string,
	unsubscribeUrl?: string | null,
): string {
	const lines = [heading, "", intro, ""];
	if (ctx.excerpt) lines.push(ctx.excerpt, "");
	if (commentUrl) lines.push(`查看：${commentUrl}`, "");
	if (unsubscribeUrl) lines.push(`不想再收到回复提醒？${unsubscribeUrl}`, "");
	lines.push(`— ${ctx.siteName}`);
	return lines.join("\n");
}

function unsubscribeFooter(unsubscribeUrl: string | null): string {
	if (!unsubscribeUrl)
		return "你收到这封邮件是因为有人回复了你在此前留下的评论。";
	return `不想再收到这类提醒？<a href="${escapeHtml(unsubscribeUrl)}" style="color:#57606a">取消订阅</a>`;
}

function dedupe(values: string[]): string[] {
	const seen = new Set<string>();
	return values.filter((value) => {
		const key = value.toLowerCase();
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

function toHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

async function hmacHex(secret: string, payload: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const signature = await crypto.subtle.sign(
		"HMAC",
		key,
		new TextEncoder().encode(payload),
	);
	return toHex(new Uint8Array(signature));
}

function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i += 1) {
		diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return diff === 0;
}
