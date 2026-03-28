import { createSupabaseBrowserClient } from '@lib/supabase/client';
import { getCurrentUserId } from '@lib/supabase/auth';
import { safeFileName } from '@lib/utils';

export async function uploadToBucket(bucket: string, file: File) {
	const userId = await getCurrentUserId();
	const stamp = Date.now().toString(16);
	const objectPath = `${userId}/${stamp}_${safeFileName(file.name)}`;

	const supabase = createSupabaseBrowserClient();
	const { error } = await supabase.storage
		.from(bucket)
		.upload(objectPath, file, { upsert: true, cacheControl: '3600' });

	if (error) throw new Error(error.message);
	return objectPath;
}

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