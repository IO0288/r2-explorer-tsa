import assert from "node:assert/strict";
import test from "node:test";
import { isShareRoute } from "../src/share-routes.mjs";

test("blocks share creation, management, and saved public links", () => {
	for (const path of [
		"/api/buckets/bucket/key/share", "/api/buckets/bucket/shares",
		"/api/buckets/bucket/share/id", "/share/id", "/share/id/",
		"/api/buckets/bucket/key/%73hare", "/%73hare/id?password=test",
	]) assert.equal(isShareRoute(`https://example.com${path}`), true, path);
});

test("retains file downloads, uploads, folders, and site authentication", () => {
	for (const path of [
		"/api/buckets/bucket", "/api/buckets/bucket/upload", "/api/buckets/bucket/folder",
		"/api/buckets/bucket/copy", "/api/buckets/bucket/delete", "/api/buckets/bucket/a2V5",
		"/api/server/config", "/auth/login", "/bucket/files", "/assets/index.js",
	]) assert.equal(isShareRoute(`https://example.com${path}`), false, path);
});
