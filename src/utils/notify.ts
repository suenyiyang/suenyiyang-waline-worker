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
 *
 * The three builders below are pure so the templates can be previewed and
 * tested without a database.
 */
import type { Env } from "../env.js";
import {
	escapeHtml,
	escapeMultiline,
	getMailTransport,
	isNotifyDisabled,
	type MailMessage,
	renderEmailLayout,
	renderParagraphs,
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
	insertedAt: string | null;
	user_id: number | null;
}

export interface NotifyOptions {
	/** `created` runs right after a comment is stored, `approved` after moderation. */
	phase?: NotifyPhase;
	/** Request URL, used to build absolute unsubscribe links. */
	requestUrl?: string;
}

// ─── Templates ───────────────────────────────────────────────────────────────

export interface TemplateContext {
	siteName: string;
	siteUrl: string;
	/** Page path of the comment, e.g. `/posts/agent-stack`. */
	path: string;
	/** Absolute link to the comment anchor, when known. */
	commentUrl?: string;
	/** `2026.11.19 09:04` in the site's timezone. */
	date: string;
	/** Origin of the Worker that serves the admin panel, e.g. the request origin. */
	adminUrl?: string;
}

export interface RenderedEmail {
	subject: string;
	html: string;
	text: string;
}

function kickerOf(ctx: TemplateContext): string {
	try {
		return new URL(ctx.siteUrl).hostname.replace(/^www\./, "");
	} catch {
		return ctx.siteName;
	}
}

function footer(text: string): string {
	return escapeHtml(text);
}

export function buildAdminEmail(
	ctx: TemplateContext,
	input: { nick: string; excerpt: string; pending: boolean },
): RenderedEmail {
	const heading = input.pending ? "新评论待审核" : "收到新评论";
	const meta = [input.nick, ctx.path, ctx.date].filter(Boolean).join(" · ");

	return {
		subject: input.pending
			? `[${ctx.siteName}] 待审核 · ${input.nick}`
			: `[${ctx.siteName}] 新评论 · ${input.nick}`,
		html: renderEmailLayout({
			kicker: kickerOf(ctx),
			heading,
			badge: input.pending ? "等待审核" : undefined,
			meta,
			bodyHtml: renderParagraphs(input.excerpt),
			action: ctx.commentUrl
				? { url: ctx.commentUrl, label: "查看评论 →" }
				: undefined,
			footerHtml: footer(
				input.pending
					? `回复此邮件不会通知留言者。审核入口：${ctx.adminUrl || ctx.siteUrl}/ui`
					: `你收到这封邮件是因为你是 ${ctx.siteName} 的管理员。`,
			),
		}),
		text: [
			heading,
			meta,
			"",
			input.excerpt,
			"",
			...(ctx.commentUrl ? [`查看：${ctx.commentUrl}`, ""] : []),
			`— ${ctx.siteName}`,
		].join("\n"),
	};
}

export function buildReplyEmail(
	ctx: TemplateContext,
	input: {
		nick: string;
		excerpt: string;
		parentExcerpt: string;
		unsubscribeUrl?: string | null;
	},
): RenderedEmail {
	const heading = `${input.nick} 回复了你的评论`;
	const meta = [ctx.path, ctx.date].filter(Boolean).join(" · ");

	return {
		subject: `[${ctx.siteName}] ${input.nick} 回复了你的评论`,
		html: renderEmailLayout({
			kicker: kickerOf(ctx),
			heading,
			meta,
			bodyHtml: renderParagraphs(input.excerpt),
			quote: input.parentExcerpt
				? { label: "你之前的评论", html: renderParagraphs(input.parentExcerpt) }
				: undefined,
			action: ctx.commentUrl
				? { url: ctx.commentUrl, label: "查看并回复 →" }
				: undefined,
			footerHtml: unsubscribeFooter(
				"有人回复了你在此前留下的评论。",
				input.unsubscribeUrl,
			),
		}),
		text: [
			heading,
			meta,
			"",
			input.excerpt,
			"",
			...(input.parentExcerpt
				? [`你之前的评论：`, input.parentExcerpt, ""]
				: []),
			...(ctx.commentUrl ? [`查看：${ctx.commentUrl}`, ""] : []),
			...(input.unsubscribeUrl
				? [`不想再收到回复提醒？${input.unsubscribeUrl}`, ""]
				: []),
			`— ${ctx.siteName}`,
		].join("\n"),
	};
}

export function buildApprovedEmail(
	ctx: TemplateContext,
	input: { excerpt: string; unsubscribeUrl?: string | null },
): RenderedEmail {
	const heading = "你的评论已发布";
	const meta = [ctx.path, ctx.date].filter(Boolean).join(" · ");

	return {
		subject: `[${ctx.siteName}] 你的评论已发布`,
		html: renderEmailLayout({
			kicker: kickerOf(ctx),
			heading,
			meta,
			bodyHtml: renderParagraphs(input.excerpt),
			action: ctx.commentUrl
				? { url: ctx.commentUrl, label: "查看评论 →" }
				: undefined,
			footerHtml: unsubscribeFooter(
				"有人回复了你在此前留下的评论。",
				input.unsubscribeUrl,
			),
		}),
		text: [
			heading,
			meta,
			"",
			input.excerpt,
			"",
			...(ctx.commentUrl ? [`查看：${ctx.commentUrl}`, ""] : []),
			...(input.unsubscribeUrl
				? [`不想再收到这类提醒？${input.unsubscribeUrl}`, ""]
				: []),
			`— ${ctx.siteName}`,
		].join("\n"),
	};
}

function unsubscribeFooter(
	reason: string,
	unsubscribeUrl?: string | null,
): string {
	if (!unsubscribeUrl) return footer(reason);
	return `${footer(reason)}<br />不想再收到这类提醒？<a href="${escapeHtml(unsubscribeUrl)}" style="color:inherit;text-decoration:underline">退订</a>`;
}

// ─── Dispatch ────────────────────────────────────────────────────────────────

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
				`SELECT id, nick, mail, url, comment, orig, pid, status, insertedAt, user_id
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
			template: {
				siteName: env.SITE_NAME?.trim() || "Waline",
				siteUrl: (env.SITE_URL || "").replace(/\/+$/, ""),
				path: row.url || "/",
				date: formatDate(row.insertedAt),
				adminUrl: originOf(options.requestUrl),
			},
		};
		ctx.template.commentUrl = commentLink(ctx, row);
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
	template: TemplateContext;
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

		const email = buildAdminEmail(ctx.template, {
			nick: ctx.nick,
			excerpt: ctx.excerpt || "",
			pending,
		});
		const sent = await sendMail(ctx.env, { to, ...email });
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
			`SELECT id, nick, mail, url, comment, orig, pid, status, insertedAt, user_id
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

	const unsubscribeUrl = await buildUnsubscribeUrl(ctx, to);
	if (!(await claim(ctx.db, ctx.comment.id, "reply", to))) return;

	const email = buildReplyEmail(ctx.template, {
		nick: ctx.nick,
		excerpt: ctx.excerpt || "",
		parentExcerpt: excerptOf(parent),
		unsubscribeUrl,
	});
	const sent = await sendMail(ctx.env, {
		to,
		...email,
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

	const email = buildApprovedEmail(ctx.template, {
		excerpt: ctx.excerpt || "",
		unsubscribeUrl,
	});
	const sent = await sendMail(ctx.env, {
		to,
		...email,
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

/** Blog-style date stamp: `2026.11.19 09:04` in Asia/Shanghai. */
export function formatDate(value: string | null | undefined): string {
	const raw = String(value || "").trim();
	if (!raw) return "";
	const iso =
		/\dT/.test(raw) || raw.endsWith("Z") ? raw : `${raw.replace(" ", "T")}Z`;
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "";

	const parts = new Intl.DateTimeFormat("zh-CN", {
		timeZone: "Asia/Shanghai",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).formatToParts(date);

	const pick = (type: string) =>
		parts.find((part) => part.type === type)?.value || "";
	return `${pick("year")}.${pick("month")}.${pick("day")} ${pick("hour")}:${pick("minute")}`;
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
