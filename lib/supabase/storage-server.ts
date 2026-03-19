import { createSupabaseServiceClient } from './server';

/**
 * Delete an object from Supabase Storage (service role).
 * `objectPath` must be the exact path stored in DB (e.g. `${userId}/${fileName}`).
 */
export async function deleteStorageObject(
  bucket: string,
  objectPath: string
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

