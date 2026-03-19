'use server';

import { unstable_cache } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@lib/prisma';
import { requireAuth } from '@lib/auth';
import { CACHE_LIFE, CACHE_TAGS } from '@lib/constants';

type SpotifyTrack = {
  id: string;
  name: string;
  spotifyUrl: string;
};

type SpotifyRelease = {
  id: string;
  name: string;
  releaseType: string;
  spotifyUrl: string;
  albumArtUrl?: string | null;
  tracks: SpotifyTrack[];
};

export type DiscographyPage = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  releases: SpotifyRelease[];
};

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

function getBasicAuthHeader(): string {
  const clientId = requireEnv('SPOTIFY_CLIENT_ID');
  const clientSecret = requireEnv('SPOTIFY_CLIENT_SECRET');
  const token = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  return `Basic ${token}`;
}

async function fetchJson<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    // Ensure we always use server-side fetching (no caching at fetch layer).
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Spotify API error ${res.status}: ${text}`);
  }

  return (await res.json()) as T;
}

async function getSpotifyAccessToken(): Promise<string> {
  const basicAuth = getBasicAuthHeader();

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: basicAuth,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Spotify token error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  return data.access_token;
}

export async function getDiscographyPage(params: {
  spotifyArtistId: string;
  page: number;
  pageSize?: number;
  tracksPerRelease?: number;
}): Promise<DiscographyPage> {
  const spotifyArtistId = params.spotifyArtistId;
  const pageSize = params.pageSize ?? 5;
  const tracksPerRelease = params.tracksPerRelease ?? 3;

  const page = Math.max(1, Number.isFinite(params.page) ? params.page : 1);

  const cacheKey = ['spotify-discography', spotifyArtistId, page, pageSize, tracksPerRelease];
  const tags = [`${CACHE_TAGS.SPOTIFY_DISCOGRAPHY}:${spotifyArtistId}`, `spotify-discography-page:${page}`];

  return unstable_cache(
    async () => {
      try {
        const accessToken = await getSpotifyAccessToken();

        const offset = (page - 1) * pageSize;
        const includeGroups = 'album,ep,single';

        const albumsUrl = `https://api.spotify.com/v1/artists/${encodeURIComponent(
          spotifyArtistId
        )}/albums?include_groups=${encodeURIComponent(includeGroups)}&limit=${pageSize}&offset=${offset}`;

        const albumsRes = await fetchJson<{
          items: Array<{
            id: string;
            name: string;
            album_type: string;
            external_urls: { spotify: string };
            images: Array<{ url: string }>;
          }>;
          total: number;
        }>(albumsUrl, accessToken);

        const safeTotal =
          typeof albumsRes.total === 'number'
            ? albumsRes.total
            : albumsRes.items.length;
        const totalPages = safeTotal > 0 ? Math.ceil(safeTotal / pageSize) : page;

        const releases: SpotifyRelease[] = await Promise.all(
          albumsRes.items.map(async (album) => {
            const albumId = album.id;
            const tracksUrl = `https://api.spotify.com/v1/albums/${encodeURIComponent(
              albumId
            )}/tracks?limit=${tracksPerRelease}`;

            const tracksRes = await fetchJson<{
              items: Array<{
                id: string;
                name: string;
                external_urls: { spotify: string };
              }>;
            }>(tracksUrl, accessToken);

            const albumArtUrl = album.images?.[0]?.url ?? null;

            return {
              id: albumId,
              name: album.name,
              releaseType: album.album_type,
              spotifyUrl: album.external_urls.spotify,
              albumArtUrl,
              tracks: (tracksRes.items ?? []).map((t) => ({
                id: t.id,
                name: t.name,
                spotifyUrl: t.external_urls.spotify,
              })),
            };
          })
        );

        return {
          page,
          pageSize,
          total: safeTotal,
          totalPages,
          releases,
        };
      } catch {
        // Fail closed: keep the page usable even if Spotify is temporarily unavailable.
        return {
          page,
          pageSize,
          total: 0,
          totalPages: 1,
          releases: [],
        };
      }
    },
    cacheKey as string[],
    {
      tags,
      revalidate: CACHE_LIFE.SPOTIFY.revalidate,
    }
  )();
}

// --- Playback (OAuth user token) ---

const SPOTIFY_OAUTH_SCOPES =
  'streaming user-modify-playback-state user-read-playback-state';

async function getOwnedProfileOrThrow() {
  const session = await requireAuth();
  const profile = await prisma.artistProfile.findUnique({
    where: { ownerUserId: session.user.id },
  });
  if (!profile) throw new Error('Artist profile not found for this user.');
  return profile;
}

/**
 * Redirects the authenticated artist to Spotify OAuth to connect their account.
 * Call from a form action or from client after user click.
 */
export async function redirectToSpotifyConnect() {
  const profile = await getOwnedProfileOrThrow();
  const clientId = requireEnv('SPOTIFY_CLIENT_ID');
  const appUrl = requireEnv('NEXT_PUBLIC_APP_URL');
  const redirectUri = `${appUrl.replace(/\/$/, '')}/api/spotify/callback`;
  const state = profile.id;
  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', SPOTIFY_OAUTH_SCOPES);
  authUrl.searchParams.set('state', state);
  redirect(authUrl.toString());
}

/**
 * Returns a valid Spotify user access token for the Web Playback SDK.
 * Only for authenticated artist who has connected Spotify. Returns null otherwise.
 */
export async function getSpotifyPlaybackToken(): Promise<{ accessToken: string } | null> {
  try {
    const profile = await getOwnedProfileOrThrow();
    const tokenRow = await prisma.spotifyToken.findFirst({
      where: { artistProfileId: profile.id },
    });
    if (!tokenRow) return null;

    const now = new Date();
    const bufferMs = 60_000; // refresh 1 min before expiry
    let accessToken = tokenRow.accessToken;
    if (tokenRow.expiresAt.getTime() - bufferMs <= now.getTime()) {
      const clientId = requireEnv('SPOTIFY_CLIENT_ID');
      const clientSecret = requireEnv('SPOTIFY_CLIENT_SECRET');
      const appUrl = requireEnv('NEXT_PUBLIC_APP_URL');
      const redirectUri = `${appUrl.replace(/\/$/, '')}/api/spotify/callback`;

      const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: tokenRow.refreshToken,
          redirect_uri: redirectUri,
        }),
        cache: 'no-store',
      });

      if (!res.ok) return null;
      const data = (await res.json()) as { access_token: string; expires_in: number };
      accessToken = data.access_token;
      const expiresAt = new Date(Date.now() + data.expires_in * 1000);
      await prisma.spotifyToken.update({
        where: { id: tokenRow.id },
        data: { accessToken, expiresAt },
      });
    }
    return { accessToken };
  } catch {
    return null;
  }
}

