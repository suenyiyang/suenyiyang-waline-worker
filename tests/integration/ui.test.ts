import { env, SELF } from "cloudflare:test";
import { resetDB } from "@tests/helpers/setup.js";
import { beforeEach, describe, expect, it } from "vitest";

type TestEnv = { DB: D1Database };

let db: D1Database;

beforeEach(async () => {
	db = (env as unknown as TestEnv).DB;
	await resetDB(db);
});

async function getHtml(
	path: string,
): Promise<{ status: number; html: string }> {
	const res = await SELF.fetch(`http://localhost${path}`);
	return { status: res.status, html: await res.text() };
}

describe("admin UI theme", () => {
	it("serves the admin shell with a mobile viewport and the reading theme", async () => {
		const { status, html } = await getHtml("/ui");

		expect(status).toBe(200);
		expect(html).toContain('name="viewport"');
		expect(html).toContain("--wa-paper:#fffcf0");
		expect(html).toContain("--wa-font-serif");
		expect(html).toContain("wk-theme-toggle");
		expect(html).toContain("prefers-color-scheme");
		// The CDN bundle must still be loaded after our scripts.
		expect(html).toContain("unpkg.com/@waline/admin");
	});

	it("serves the worker settings page with the shared theme and tabs", async () => {
		const { status, html } = await getHtml("/ui/worker-setting");

		expect(status).toBe(200);
		expect(html).toContain("--wa-paper:#fffcf0");
		expect(html).toContain('id="save-btn"');
		expect(html).toContain('data-tab="comment"');
		expect(html).toContain("@media (max-width:720px)");
	});
});
