export function resolveSupabasePublicObjectUrl(
	bucket: string,
	pathOrUrl: string | null | undefined,
) {
	if (!pathOrUrl) return null;
	const trimmed = pathOrUrl.trim();
	if (!trimmed) return null;
	if (trimmed.startsWith('http://') || trimmed.startsWith('https://'))
		return trimmed;
	const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
	if (!base) return null;
	return `${base}/storage/v1/object/public/${bucket}/${trimmed}`;
}