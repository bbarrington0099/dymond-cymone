'use client';

import { useMemo } from 'react';
import { SpotifyPlayerEmbed } from './SpotifyPlayerEmbed';
import { pickRandomTrack } from '@lib/utils';

import type { SpotifyTrackId } from '@lib/spotify';

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
        <SpotifyPlayerEmbed
          trackId={trackId}
        />
      </div>
    </section>
  );
}
