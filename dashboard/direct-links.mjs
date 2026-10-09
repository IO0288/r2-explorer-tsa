// R2 Explorer's download endpoint accepts a UTF-8 base64 object key.
export function tsaDirectLink(serverUrl, bucket, key) {
	if (typeof key !== "string" || !key || typeof bucket !== "string" || !bucket) {
		throw new Error("缺少存储桶或文件路径，无法生成直链。");
	}
	const bytes = new TextEncoder().encode(key);
	const encodedKey = btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""));
	return `${serverUrl.replace(/\/+$/, "")}/api/buckets/${encodeURIComponent(bucket)}/${encodeURIComponent(encodedKey)}`;
}
