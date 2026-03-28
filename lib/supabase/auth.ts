import { createSupabaseBrowserClient } from '@lib/supabase/client';

export async function getCurrentUserId() {
	const supabase = createSupabaseBrowserClient();
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();
	if (error) throw new Error(error.message);
	if (!user) throw new Error('Not authenticated');
	return user.id;
}
