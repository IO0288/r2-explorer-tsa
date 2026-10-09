import assert from "node:assert/strict";
import test from "node:test";
import { tsaDirectLink } from "../dashboard/direct-links.mjs";

test("download links preserve UTF-8 keys and URL-sensitive characters", () => {
	for (const key of ["file.txt", "文件夹/你好 #?%+.txt", "folder/😀.txt", "/leading-slash.txt", "ÿÿÿ.txt"]) {
		const link = new URL(tsaDirectLink("https://files.example.com/", key));
		assert.equal(link.origin, "https://files.example.com");
		assert.equal(link.search, "");
		assert.equal(link.hash, "");
		assert.equal(decodeURIComponent(link.pathname.slice(1)), key);
	}
});

test("missing public URL or key produces an explicit error", () => {
	assert.throws(() => tsaDirectLink("", "file"));
	assert.throws(() => tsaDirectLink("https://example.com", ""));
});
