import { SpotifyTrackId } from "@actions/artist";
import { RemoveTrackForm, List, ListItem } from "@components/admin";

interface TrackListProps {
    initialSpotifyTrackIds: SpotifyTrackId[];
}
export const TrackList = (props: TrackListProps) => {
    const { initialSpotifyTrackIds } = props;
    return (
		<List>
			{initialSpotifyTrackIds.map((track) => (
				<ListItem key={track.id}>
					<span>
						{track.id} (Weight: {track.weight})
					</span>
					<RemoveTrackForm trackId={track.id} />
				</ListItem>
			))}
		</List>
	);
}
