'use server';

import { unstable_cache } from 'next/cache';
import { CACHE_LIFE, CACHE_TAGS } from '@lib/constants';
import type { SpotifyTrackId } from '@lib/spotify';

type SpotifyTrack = {
  id: string;
  name: string;
  spotifyUrl: string;
};

export type SpotifyRelease = {
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

export type SpotifyArtist = {
  id: string;
  name: string;
  spotifyUrl: string;
  followers: number;
  imageUrl: string | null;
};

/**
 * Fetches artist data from Spotify GET /artists/{id}.
 */
export async function getSpotifyArtist(
  spotifyArtistId: string
): Promise<SpotifyArtist | null> {
  const cacheKey = ['spotify-artist', spotifyArtistId];
  const tags = [`${CACHE_TAGS.SPOTIFY_DISCOGRAPHY}:${spotifyArtistId}`, 'spotify-artist'];

  return unstable_cache(
    async () => {
      try {
        const accessToken = await getSpotifyAccessToken();
        const url = `https://api.spotify.com/v1/artists/${encodeURIComponent(spotifyArtistId)}`;
        const res = await fetchJson<{
          id: string;
          name: string;
          external_urls: { spotify: string };
          followers: { total: number };
          images: Array<{ url: string }>;
        }>(url, accessToken);
        return {
          id: res.id,
          name: res.name,
          spotifyUrl: res.external_urls?.spotify ?? `https://open.spotify.com/artist/${res.id}`,
          followers: res.followers?.total ?? 0,
          imageUrl: res.images?.[0]?.url ?? null,
        };
      } catch {
        return null;
      }
    },
    cacheKey as string[],
    { tags, revalidate: CACHE_LIFE.SPOTIFY.revalidate }
  )();
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

/**
 * Fetches a random track ID from the artist's discography (albums/EPs/singles).
 * Used as fallback when spotifyTrackIds is empty. Uses albums endpoint instead of
 * top-tracks to avoid 403 with client credentials.
 */
export async function getRandomTopTrackId(
  spotifyArtistId: string
): Promise<SpotifyTrackId | null> {
  if (!spotifyArtistId?.trim()) return null;
  try {
    const accessToken = await getSpotifyAccessToken();
    const albumsUrl = `https://api.spotify.com/v1/artists/${encodeURIComponent(
      spotifyArtistId
    )}/albums?include_groups=album,ep,single&limit=10`;
    const albumsRes = await fetchJson<{
      items: Array<{ id: string }>;
    }>(albumsUrl, accessToken);
    const albums = albumsRes?.items ?? [];
    if (albums.length === 0) return null;
    const album = albums[Math.floor(Math.random() * albums.length)];
    const tracksUrl = `https://api.spotify.com/v1/albums/${encodeURIComponent(
      album.id
    )}/tracks?limit=20`;
    const tracksRes = await fetchJson<{
      items: Array<{ id: string }>;
    }>(tracksUrl, accessToken);
    const tracks = tracksRes?.items ?? [];
    if (tracks.length === 0) return null;
    const track = tracks[Math.floor(Math.random() * tracks.length)];
    return { id: track?.id ?? null, weight: 1 };
  } catch {
    return null;
  }
}

