/**
 * Cache tags for revalidateTag(). Use with unstable_cache().
 */
export const CACHE_TAGS = {
  ARTIST_PROFILE: 'artist-profile',
  ARTIST_EVENTS: 'artist-events',
  SPOTIFY_DISCOGRAPHY: 'spotify-discography',
} as const;

export const CACHE_LIFE = {
  /** Public profile/events — revalidate after admin edits */
  USER: {
    stale: 60,
    revalidate: 300,
    expire: 3600,
  },
  /** Spotify API — avoid hammering */
  SPOTIFY: {
    stale: 300,
    revalidate: 3600,
    expire: 86400,
  },
} as const;
