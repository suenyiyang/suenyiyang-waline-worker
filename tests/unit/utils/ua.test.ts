import { describe, expect, it } from "vitest";
import { parseUA, stripVersion } from "@/utils/ua.js";

describe("parseUA", () => {
	it("parses Chrome on Windows 10", () => {
		const ua =
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
		const result = parseUA(ua);
		expect(result.browser).toBe("Chrome 120.0.0.0");
		expect(result.os).toBe("Windows 10");
	});

	it("parses Edge (Chromium) on Windows 10", () => {
		const ua =
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0";
		const result = parseUA(ua);
		expect(result.browser).toBe("Edge 120.0.0.0");
		expect(result.os).toBe("Windows 10");
	});

	it("parses Firefox on Linux", () => {
		const ua =
			"Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0";
		const result = parseUA(ua);
		expect(result.browser).toBe("Firefox 121.0");
		expect(result.os).toBe("Linux");
	});

	it("parses Safari on macOS", () => {
		const ua =
			"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15";
		const result = parseUA(ua);
		expect(result.browser).toBe("Safari 17.2");
		expect(result.os).toBe("macOS 10.15");
	});

	it("parses Chrome on Android", () => {
		const ua =
			"Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.43 Mobile Safari/537.36";
		const result = parseUA(ua);
		expect(result.browser).toBe("Chrome 120.0.6099.43");
		expect(result.os).toBe("Android 13");
	});

	it("parses Safari on iOS", () => {
		const ua =
			"Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1";
		const result = parseUA(ua);
		expect(result.browser).toBe("Safari 17.1");
		expect(result.os).toBe("iOS 17.1.2");
	});

	it("returns empty strings for empty UA", () => {
		expect(parseUA("")).toEqual({ browser: "", os: "" });
	});
});

describe("stripVersion", () => {
	it("keeps the browser name and drops the version", () => {
		expect(stripVersion("Chrome 156.0.0.0")).toBe("Chrome");
		expect(stripVersion("Firefox 121.0")).toBe("Firefox");
		expect(stripVersion("Safari 17.2")).toBe("Safari");
	});

	it("keeps the OS name and drops the version", () => {
		expect(stripVersion("macOS 10.15")).toBe("macOS");
		expect(stripVersion("Windows 10")).toBe("Windows");
		expect(stripVersion("Windows 8.1")).toBe("Windows");
		expect(stripVersion("Android 13")).toBe("Android");
		expect(stripVersion("iOS 17.3")).toBe("iOS");
	});

	it("leaves version-less (and empty) agents alone", () => {
		expect(stripVersion("macOS")).toBe("macOS");
		expect(stripVersion("iPadOS")).toBe("iPadOS");
		expect(stripVersion("")).toBe("");
	});
});
