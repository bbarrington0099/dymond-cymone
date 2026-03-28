'use client';

import { useMemo } from 'react';
import type { SpotifyTrackId } from '@lib/spotify';
import { pickRandomTrack } from '@lib/utils';

import styles from './SpotifyPlayer.module.scss';

export function SpotifyPlayer({
  spotifyTrackIds,
}: {
  spotifyTrackIds: SpotifyTrackId[];
}) {
  const trackId = useMemo(() => pickRandomTrack(spotifyTrackIds), [spotifyTrackIds]);

  if (!trackId) return null;

  return (
    <section className={styles.player} aria-label="Listen">
      <h2 className={styles.title}>Listen</h2>
      <div className={styles.embedWrap}>
        <iframe
          title="Spotify track"
          src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator`}
          style={{ borderRadius: 12 }}
          width="100%"
          height={152}
          frameBorder={0}
          allowFullScreen
          allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className={styles.embed}
        />
      </div>
    </section>
  );
}
