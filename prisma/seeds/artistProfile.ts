import { Prisma } from '@prismagen/client';
import { prisma } from '@lib/prisma';
import * as db from '@lib/db-seed';

type ArtistProfilePayload = Prisma.ArtistProfileGetPayload<{}>;
export interface ArtistProfiles {
    defaultAdmin: ArtistProfilePayload;
}

export async function seedArtistProfiles(): Promise<ArtistProfiles> {
    const DEFAULT_ARTIST_EMAIL = process.env.DEFAULT_ARTIST_EMAIL;
    if (!DEFAULT_ARTIST_EMAIL) {
        throw new Error("DEFAULT_ADMIN_EMAIL environment variable is not set.");
    }
    const DEFAULT_ARTIST_PASSWORD = process.env.DEFAULT_ARTIST_PASSWORD;
    if (!DEFAULT_ARTIST_PASSWORD) {
        throw new Error("DEFAULT_ARTIST_PASSWORD environment variable is not set.");
    }
    const DEFAULT_ARTIST_NAME = process.env.DEFAULT_ARTIST_NAME;
    if (!DEFAULT_ARTIST_NAME) {
        throw new Error("DEFAULT_ARTIST_NAME environment variable is not set.");
    }
    try {
        return {
            defaultAdmin: await db.createArtistProfile({
                ownerUserId: DEFAULT_ARTIST_EMAIL,
                name: DEFAULT_ARTIST_NAME,
                plainPassword: DEFAULT_ARTIST_PASSWORD,
                description: "Default artist profile",
                coverImagePath: "default-cover.jpg",
                themePrimaryColor: "#b603fc",
                themeSecondaryColor: "#6603fc",
                themeTertiaryColor: "#f0ed3a",
                themePrimaryFontCssLink: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap",
                themeSecondaryFontCssLink: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap",
                themeFavPath: "default-favicon.ico",
                spotifyArtistId: "4ElZsNwNPTrVPUWwM6KZb9",
                spotifyPlaylistId: "5FG7UyhX6cLrGfb15Bl8y9",
            }) ,
        }
    } catch (error) {
        const existingArtistProfile = await prisma.artistProfile.findUnique({
            where: { ownerUserId: DEFAULT_ARTIST_EMAIL },
        });
        if (existingArtistProfile) {
            return {
                defaultAdmin: existingArtistProfile!,
            };
        }
        throw error;
    }
}