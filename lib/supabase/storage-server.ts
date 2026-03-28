import { createSupabaseServiceClient } from '@lib/supabase/server';
import { getCurrentUserId } from '@lib/supabase/auth';
import { safeFileName } from '@lib/utils';

/**
 * Delete an object from Supabase Storage (service role).
 * `objectPath` must be the exact path stored in DB (e.g. `${userId}/${fileName}`).
 */
export async function deleteStorageObject(
	bucket: string,
	objectPath: string,
): Promise<boolean> {
	const path = objectPath?.trim();
	if (!bucket || !path) return false;

	try {
		const supabase = await createSupabaseServiceClient();
		const { error } = await supabase.storage.from(bucket).remove([path]);
		return !error;
	} catch {
		return false;
	}
}

export async function uploadToBucket(bucket: string, file: File) {
	const userId = await getCurrentUserId();
	const stamp = Date.now().toString(16);
	const objectPath = `${userId}/${stamp}_${safeFileName(file.name)}`;

	const supabase = await createSupabaseServiceClient();
	const { error } = await supabase.storage
		.from(bucket)
		.upload(objectPath, file, { upsert: true, cacheControl: '3600' });

	if (error) throw new Error(error.message);
	return objectPath;
}
