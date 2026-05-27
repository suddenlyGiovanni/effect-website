// Utility to get the correct asset path with base URL prefix
export function getAssetPath(path: string): string {
	// In production (GitHub Pages), use /landing prefix
	// In development, use root
	const base = import.meta.env.PROD ? "/landing" : "";
	return `${base}${path}`;
}
