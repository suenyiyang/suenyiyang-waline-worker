/**
 * Minimal Markdown → HTML renderer for Workers
 * Handles common constructs + XSS sanitization
 */

const SAFE_HREF = /^(https?:|mailto:|#|\/)/i;

/* --- Emoji -------------------------------------------------------------
 * The Waline client inserts `:weibo_smile:` shortcodes into the editor and
 * expects the server to expand them into <img class="wl-emoji"> tags. It also
 * ships emoji as that same <img> markup in older clients / pasted text. Both
 * are normalised here, before HTML escaping, because escaping first turned the
 * tag into visible text (and the `_` inside emoji names into <em>).
 *
 * Packs mirror @waline/client's default emoji config (one pinned CDN folder per
 * pack), so shortcodes resolve to exactly the image the picker showed. */
const EMOJI_PACKS: Record<string, { url: string; names: string[] }> = {
	weibo: {
		url: "https://unpkg.com/@waline/emojis@1.1.0/weibo",
		names: `smile lovely blush grin laugh joy angry bye hammer kiss love mask
			money quiet rage sad shy sick slient smirk slap antic desire longing
			no_idea look_down clap yum sleep dizzy_face chuckle disappointed flushed
			heart_eyes no shuai suprised think vomit scream sleepy sob sunglasses
			greddy pick_nose annoyed awkward confused grievance poor wink
			rolling_eyes watermalon annoyed_left annoyed_right yawn hufen doge husky
			dog_annoyed dog_bye dog_consider dog_cry dog_joy dog_laugh dog_sweat
			dog_think dog_yum cat cat_annoyed cat_bye cat_cry cat_think girl_annoyed
			boy girl panda pig rabbit ultraman wool_group yan xi soap meng jiong
			geili shenma alpaca`
			.split(/\s+/)
			.filter(Boolean),
	},
};

const EMOJI_MAP = new Map<string, string>(
	Object.entries(EMOJI_PACKS).flatMap(([pack, { url, names }]) =>
		names.map(
			(name) => [`${pack}_${name}`, `${url}/${pack}_${name}.png`] as const,
		),
	),
);

/** Only emoji images from the pinned Waline CDNs may pass through as HTML. */
const EMOJI_IMG_SRC =
	/^(?:https?:)?\/\/(?:unpkg\.com|cdn\.jsdelivr\.net)\/@waline\/emojis(?:@[\w.-]+)?\/[\w./-]+\.(?:png|gif|jpe?g|webp|svg)$/i;

const EMOJI_SHORTCODE = /:([a-z0-9_]+):/gi;
const EMOJI_IMG_TAG = /<img\b[^>]*>/gi;
/** Code spans are left alone so `\`:weibo_smile:\`` stays literal. */
const CODE_SPAN = /(```[\s\S]*?```|`[^`\n]+`)/;
/** Private-use sentinel: never in real comments, stripped from input. */
const STASH = /\uE000(\d+)\uE000/g;

function readAttr(tag: string, name: string): string | null {
	const match = new RegExp(
		`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`,
		"i",
	).exec(tag);
	if (!match) return null;
	return match[1] ?? match[2] ?? "";
}

function emojiImage(src: string, alt: string): string {
	return `<img class="wl-emoji" src="${escapeAttr(src)}" alt="${escapeAttr(alt)}">`;
}

/** Rebuilds a legacy/pasted <img> tag as a canonical emoji image, or null. */
function normalizeEmojiTag(tag: string): string | null {
	const src = readAttr(tag, "src");
	if (!src || !EMOJI_IMG_SRC.test(src.trim())) return null;
	return emojiImage(
		src.trim().replace(/^\/\//, "https://"),
		readAttr(tag, "alt") ?? "",
	);
}

export function renderMarkdown(text: string): string {
	if (!text) return "";

	// Emitted emoji markup is stashed behind placeholders so escaping and the
	// emphasis passes below cannot touch it.
	const stashed: string[] = [];
	const stash = (html: string) => `\uE000${stashed.push(html) - 1}\uE000`;

	const expandEmoji = (segment: string) =>
		segment
			.replace(EMOJI_IMG_TAG, (tag) => {
				const image = normalizeEmojiTag(tag);
				return image ? stash(image) : tag;
			})
			.replace(EMOJI_SHORTCODE, (match, name: string) => {
				const key = name.toLowerCase();
				const url = EMOJI_MAP.get(key);
				return url ? stash(emojiImage(url, key)) : match;
			});

	let html = text
		// Drop our sentinel so submitted text cannot forge placeholders.
		.replace(/\uE000/g, "")
		.split(CODE_SPAN)
		.map((segment, index) => (index % 2 ? segment : expandEmoji(segment)))
		.join("");

	// Escape HTML entities first (XSS prevention)
	html = escapeHtml(html);

	// Code blocks (``` ... ```)
	html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
		return `<pre><code class="language-${lang || ""}">${code.trim()}</code></pre>`;
	});

	// Inline code
	html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

	// Images ![alt](url)
	html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, src) => {
		if (!SAFE_HREF.test(src.trim())) return "";
		return `<img src="${src}" alt="${alt}" loading="lazy" />`;
	});

	// Links [text](url)
	html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, url) => {
		if (!SAFE_HREF.test(url.trim())) return text;
		return `<a href="${url}" target="_blank" rel="ugc nofollow noreferrer noopener">${text}</a>`;
	});

	// Bold **text** or __text__
	html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
	html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");

	// Italic *text* or _text_. Underscores only count at word edges, so
	// identifiers like `weibo_look_down` or `snake_case` stay literal.
	html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");
	html = html.replace(/(?<![\w])_(?!_)(.+?)(?<!_)_(?![\w])/g, "<em>$1</em>");

	// Strikethrough ~~text~~
	html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");

	// Blockquote (> text)
	html = html.replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>");
	// Merge consecutive blockquotes, keeping their line structure
	html = html.replace(/<\/blockquote>\n<blockquote>/g, "<br />\n");

	// Headings (# to ######)
	html = html.replace(/^######\s+(.+)$/gm, "<h6>$1</h6>");
	html = html.replace(/^#####\s+(.+)$/gm, "<h5>$1</h5>");
	html = html.replace(/^####\s+(.+)$/gm, "<h4>$1</h4>");
	html = html.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
	html = html.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
	html = html.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");

	// Horizontal rule
	html = html.replace(/^(-{3,}|\*{3,}|_{3,})$/gm, "<hr />");

	// Unordered lists
	html = html.replace(/^[*\-+]\s+(.+)$/gm, "<li>$1</li>");
	// Only newlines that separate items belong to the list. The old pattern
	// swallowed a trailing newline too, which ate the blank line before a
	// following paragraph and left that text bare instead of wrapped in <p>.
	html = html.replace(
		/(?:<li>[^\n]*<\/li>(?:\n(?=<li>))?)+/g,
		(list) => `<ul>${list}</ul>`,
	);

	// Auto-link URLs (not already in href or src)
	html = html.replace(
		/(?<!="|'|>)(https?:\/\/[^\s<)"']+)/g,
		'<a href="$1" target="_blank" rel="ugc nofollow noreferrer noopener">$1</a>',
	);

	// Paragraphs: split by double newlines
	html = html
		.split(/\n{2,}/)
		.map((block) => {
			block = block.trim();
			if (!block) return "";
			// Don't wrap block-level elements
			if (/^<(h[1-6]|ul|ol|li|blockquote|pre|hr|p|div|table)/.test(block)) {
				return block;
			}
			// A single newline is a soft break, and this is the only place a
			// newline still means one: list items, block boundaries and code
			// blocks are all already block-level here, and turning their
			// newlines into <br /> painted stray empty lines inside lists and
			// inside <pre><code>.
			return `<p>${block.replace(/\n/g, "<br />\n")}</p>`;
		})
		.join("\n");

	// Restore the emoji markup stashed before escaping.
	html = html.replace(
		STASH,
		(_match, index: string) => stashed[Number(index)] ?? "",
	);

	return html.trim();
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function escapeAttr(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}
