import { describe, expect, it } from "vitest";

import { renderMarkdown } from "@/utils/markdown.js";

describe("renderMarkdown — inline formatting", () => {
	it("renders **bold**", () => {
		expect(renderMarkdown("**bold text**")).toContain(
			"<strong>bold text</strong>",
		);
	});

	it("renders *italic*", () => {
		expect(renderMarkdown("*italic text*")).toContain("<em>italic text</em>");
	});

	it("renders [link](url)", () => {
		const out = renderMarkdown("[click here](https://example.com)");
		expect(out).toContain('<a href="https://example.com"');
		expect(out).toContain("click here");
		expect(out).toContain('rel="ugc nofollow noreferrer noopener"');
	});

	it("renders `inline code`", () => {
		expect(renderMarkdown("use `console.log` here")).toContain(
			"<code>console.log</code>",
		);
	});

	it("renders fenced code blocks", () => {
		const out = renderMarkdown('```js\nconsole.log("hi")\n```');
		expect(out).toContain("<pre><code");
		expect(out).toContain("console.log");
	});
});

describe("renderMarkdown — block elements", () => {
	it("renders blockquotes", () => {
		expect(renderMarkdown("> quoted text")).toContain(
			"<blockquote>quoted text</blockquote>",
		);
	});

	it("renders unordered lists", () => {
		const out = renderMarkdown("- item one\n- item two");
		expect(out).toContain("<ul>");
		expect(out).toContain("<li>item one</li>");
	});
});

describe("renderMarkdown — line breaks", () => {
	it("turns a single newline inside a paragraph into a <br />", () => {
		expect(renderMarkdown("line one\nline two")).toBe(
			"<p>line one<br />\nline two</p>",
		);
	});

	it("treats a blank line as a paragraph break, not a <br />", () => {
		const out = renderMarkdown("first\n\nsecond");
		expect(out).toBe("<p>first</p>\n<p>second</p>");
		expect(out).not.toContain("<br");
	});

	it("keeps <br /> out of the newlines between list items", () => {
		const out = renderMarkdown("- one\n- two\n- three");
		expect(out).toBe("<ul><li>one</li>\n<li>two</li>\n<li>three</li></ul>");
		expect(out).not.toContain("<br");
	});

	it("puts no <br /> between a paragraph and the list after it", () => {
		const out = renderMarkdown("intro\n\n- one\n- two");
		expect(out).toBe("<p>intro</p>\n<ul><li>one</li>\n<li>two</li></ul>");
	});

	it("wraps text that follows a list in its own paragraph", () => {
		expect(renderMarkdown("- one\n- two\n\nafter")).toContain(
			"</ul>\n<p>after</p>",
		);
	});

	it("leaves code block newlines alone", () => {
		const out = renderMarkdown("```js\nconst a = 1;\nconst b = 2;\n```");
		expect(out).toContain("const a = 1;\nconst b = 2;");
		expect(out).not.toContain("<br");
	});

	it("keeps the <br /> inside a multi-line blockquote", () => {
		expect(renderMarkdown("> one\n> two")).toBe(
			"<blockquote>one<br />\ntwo</blockquote>",
		);
	});
});

describe("renderMarkdown — XSS sanitization", () => {
	it("escapes <script> tags", () => {
		const out = renderMarkdown("<script>alert(1)</script>");
		expect(out).not.toContain("<script>");
		expect(out).toContain("&lt;script&gt;");
	});

	it("escapes <img onerror> attributes", () => {
		const out = renderMarkdown('<img onerror="evil()">');
		expect(out).not.toContain("<img");
		expect(out).toContain("&lt;img");
	});

	it("strips javascript: href links", () => {
		const out = renderMarkdown("[click](javascript:alert(1))");
		expect(out).not.toContain("javascript:");
		expect(out).not.toContain("<a ");
	});

	it("returns empty string for empty input", () => {
		expect(renderMarkdown("")).toBe("");
	});

	it("safely wraps plain text in a paragraph", () => {
		const out = renderMarkdown("Hello, world!");
		expect(out).toContain("Hello, world!");
		expect(out).not.toContain("<script");
	});
});

describe("renderMarkdown — Waline emoji", () => {
	const SMILE =
		'<img class="wl-emoji" src="https://unpkg.com/@waline/emojis@1.1.0/weibo/weibo_smile.png" alt="weibo_smile">';

	it("expands :weibo_xxx: shortcodes from the editor", () => {
		const out = renderMarkdown("忠实粉丝:weibo_smile:");
		expect(out).toContain(SMILE);
		expect(out).not.toContain(":weibo_smile:");
	});

	it("keeps underscores in emoji names out of emphasis", () => {
		const out = renderMarkdown(":weibo_look_down:");
		expect(out).not.toContain("<em>");
		expect(out).toContain("weibo_look_down.png");
	});

	it("keeps a legacy <img class=wl-emoji> tag instead of escaping it", () => {
		const out = renderMarkdown(
			'粉丝<img class="wl-emoji" src="//unpkg.com/@waline/emojis@1.1.0/weibo/weibo_geili.png" alt="weibo_geili">',
		);
		expect(out).toContain(
			'<img class="wl-emoji" src="https://unpkg.com/@waline/emojis@1.1.0/weibo/weibo_geili.png" alt="weibo_geili">',
		);
		expect(out).not.toContain("&lt;img");
	});

	it("leaves unknown shortcodes as plain text", () => {
		expect(renderMarkdown(":not_an_emoji:")).toContain(":not_an_emoji:");
		expect(renderMarkdown(":not_an_emoji:")).not.toContain("<img");
	});

	it("does not expand shortcodes inside code spans", () => {
		const out = renderMarkdown("`:weibo_smile:`");
		expect(out).toContain("<code>:weibo_smile:</code>");
	});

	it("rejects emoji images from other hosts", () => {
		const out = renderMarkdown(
			'<img class="wl-emoji" src="https://evil.example/weibo_smile.png" alt="x">',
		);
		expect(out).not.toContain("<img");
	});

	it("ignores submitted placeholder sentinels", () => {
		expect(renderMarkdown("\uE0000\uE000")).not.toContain("\uE000");
	});
});

describe("renderMarkdown — underscore emphasis", () => {
	it("renders _italic_ at word edges", () => {
		expect(renderMarkdown("say _hi_ now")).toContain("<em>hi</em>");
	});

	it("leaves snake_case identifiers alone", () => {
		expect(renderMarkdown("use snake_case_name here")).not.toContain("<em>");
	});
});
