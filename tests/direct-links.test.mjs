import assert from "node:assert/strict";
import test from "node:test";
import { tsaDirectLink } from "../dashboard/direct-links.mjs";

test("download links preserve UTF-8 keys and URL-sensitive characters", () => {
	for (const key of ["file.txt", "文件夹/你好 #?%+.txt", "folder/😀.txt", "/leading-slash.txt", "ÿÿÿ.txt"]) {
		const link = new URL(tsaDirectLink("https://files.example.com/", "bucket", key));
		assert.equal(link.origin, "https://files.example.com");
		assert.equal(link.search, "");
		assert.equal(link.hash, "");
		const parts = link.pathname.split("/");
		assert.equal(parts.length, 5, "the key must stay within one URL segment");
		assert.equal(Buffer.from(decodeURIComponent(parts[4]), "base64").toString("utf8"), key);
	}
});

test("missing bucket or key produces an explicit error", () => {
	assert.throws(() => tsaDirectLink("https://example.com", "", "file"));
	assert.throws(() => tsaDirectLink("https://example.com", "bucket", ""));
});
