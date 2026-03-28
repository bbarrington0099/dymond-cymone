import { AdminModalForm, Input, Button } from '@components/admin';
import { removeSpotifyTrackId } from '@actions/artist';

interface RemoveTrackProps {
    trackId: string;
}
export const RemoveTrackForm = (props: RemoveTrackProps) => {
    const { trackId } = props;
    return (
		<AdminModalForm action={removeSpotifyTrackId}>
			<Input type='hidden' name='trackId' value={trackId} />
			<Button 
                type='submit'
                content='Remove'
            />
		</AdminModalForm>
	);
}
