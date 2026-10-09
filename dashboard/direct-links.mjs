// Public bucket domains serve objects by their URL path.
export function tsaDirectLink(publicUrl, key) {
	if (typeof publicUrl !== "string" || !publicUrl.trim() || typeof key !== "string" || !key) {
		throw new Error("缺少公开访问域名或文件路径，无法生成直链。");
	}
	const encodedKey = key.split("/").map(encodeURIComponent).join("/");
	return `${publicUrl.replace(/\/+$/, "")}/${encodedKey}`;
}
