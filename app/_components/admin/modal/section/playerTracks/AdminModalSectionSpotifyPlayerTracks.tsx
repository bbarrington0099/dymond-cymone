import { Prisma } from '@prismagen/client';
import { AdminModalSection, Guide, AddTrackForm, TrackList } from '@components/admin';
import { isSpotifyTrackIdArray, SpotifyTrackId } from '@lib/spotify';

import styles from './AdminModalSectionSpotifyPlayerTracks.module.scss';

interface AdminModalSectionSpotifyPlayerTracksProps {
    initialSpotifyTrackIds: Prisma.JsonArray;
}
export const AdminModalSectionSpotifyPlayerTracks = (props: AdminModalSectionSpotifyPlayerTracksProps) => {
    const { initialSpotifyTrackIds } = props;
    return (
		<AdminModalSection title='Spotify Player Tracks'>
			<Guide 
				content="Add Spotify track IDs or paste track URLs. One track is shown at
				random in the embed.\nTracks added here will be weighted in the random selection based on the assigned weight.\nIf there are no tracks listed here then a random track from the artist's Spotify catalog will be shown instead."
			/>
			<AddTrackForm />
			{!isSpotifyTrackIdArray(initialSpotifyTrackIds) ||
			initialSpotifyTrackIds.length === 0 ? (
				<p className={styles.muted}>No tracks yet.</p>
			) : (
				<TrackList
                    initialSpotifyTrackIds={initialSpotifyTrackIds as SpotifyTrackId[]}
                />
			)}
		</AdminModalSection>
	);
}
