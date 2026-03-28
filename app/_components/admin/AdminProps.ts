import { Prisma } from '@prismagen/client';
import type { ArtistEventPayload } from '@actions/artist';

export type Theme = {
    themePrimaryColor: string;
    themeSecondaryColor: string;
    themeTertiaryColor: string;
    themePrimaryFontCssLink: string;
    themeSecondaryFontCssLink: string;
}

export interface AdminProps {
    initialDescription: string;
    initialCoverImagePath: string | null;
    initialTheme: Theme;
    initialEvents: ArtistEventPayload[];
    initialSpotifyTrackIds: Prisma.JsonArray;
}