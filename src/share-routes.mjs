// Disable every upstream sharing route, including URLs saved before removal.
export function isShareRoute(url) {
	const parts = new URL(url).pathname.split("/").filter(Boolean).map((part) => {
		try { return decodeURIComponent(part); } catch { return part; }
	});
	if (parts[0] === "share") return true;
	if (parts[0] !== "api" || parts[1] !== "buckets") return false;
	return (parts.length === 4 && parts[3] === "shares")
		|| (parts.length === 5 && (parts[3] === "share" || parts[4] === "share"));
}
