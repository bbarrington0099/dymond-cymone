'use server';

import { JSX } from 'react'
import { getRandomTopTrackId } from '@actions/spotify';
import { SpotifyPlayer } from './SpotifyPlayer';

import type { SpotifyTrackId } from '@lib/spotify';

interface SpotifyPlayerSectionProps {
  spotifyTrackIds: SpotifyTrackId[];
  spotifyArtistId: string;
}
export const SpotifyPlayerSection = async (props: SpotifyPlayerSectionProps): Promise<JSX.Element | null> => {
  const { spotifyTrackIds, spotifyArtistId } = props;

  let trackIds = spotifyTrackIds;
    if (trackIds.length === 0) {
      const topTrackId = await getRandomTopTrackId(spotifyArtistId);
      trackIds = topTrackId ? [topTrackId] : [];
    }
    if (trackIds.length > 0) {
      return <SpotifyPlayer spotifyTrackIds={trackIds} />;
    }
    return null;
}