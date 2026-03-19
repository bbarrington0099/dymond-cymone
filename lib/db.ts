import { Prisma } from '@prismagen/client';
import { prisma } from '@lib/prisma';
import { createSupabaseAdmin } from '@lib/supabase/admin';

export async function createArtistProfile(
	data: Prisma.ArtistProfileCreateInput & { plainPassword?: string },
): Promise<Prisma.ArtistProfileGetPayload<{}>> {
	const { plainPassword, ...userData } = data;

	if (!userData.ownerUserId) {
		throw new Error('Owner user ID is required to create an artist profile.');
	}

	// Register user in Supabase Auth so credentials login works
	const supabase = createSupabaseAdmin();

	let supabaseUserId: string | undefined;

	if (plainPassword) {
		// Check if auth user already exists
		const { data: existingUsers } = await supabase.auth.admin.listUsers();
		const existingAuth = existingUsers?.users?.find(
			(u) => u.id === userData.ownerUserId
		);

		if (existingAuth) {
			supabaseUserId = existingAuth.id;
		} else {
			const { data: authData, error: authError } =
				await supabase.auth.admin.createUser({
					email: userData.ownerUserId as string,
					password: plainPassword,
					email_confirm: true,
					user_metadata: { full_name: userData.name ?? undefined },
				});

			if (authError) {
				throw new Error(
					`Failed to create Supabase auth user: ${authError.message}`
				);
			}
			supabaseUserId = authData.user.id;
		}
	} else {
		// No plainPassword (e.g. OAuth user being synced) — look up auth user by email
		// so we always use Supabase auth ID for new users
		const { data: existingUsers } = await supabase.auth.admin.listUsers();
		const existingAuth = existingUsers?.users?.find(
			(u) => u.id === userData.ownerUserId
		);
		if (existingAuth) {
			supabaseUserId = existingAuth.id;
		}
	}
    
    try {
        return await prisma.artistProfile.create({
            data: {
                ownerUserId: supabaseUserId as string,
                name: userData.name,
                description: userData.description,
                coverImagePath: userData.coverImagePath,
                themePrimaryColor: userData.themePrimaryColor,
                themeSecondaryColor: userData.themeSecondaryColor,
                themeTertiaryColor: userData.themeTertiaryColor,
                themePrimaryFontCssLink: userData.themePrimaryFontCssLink,
                themeSecondaryFontCssLink: userData.themeSecondaryFontCssLink,
                themeFavPath: userData.themeFavPath,
                spotifyArtistId: userData.spotifyArtistId,
                spotifyPlaylistId: userData.spotifyPlaylistId,
            }
        });
    } catch (error: unknown) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                throw new Error(`Artist profile with name ${userData.name} already exists.`);
            }
        }
        throw error as Error;
    }
}