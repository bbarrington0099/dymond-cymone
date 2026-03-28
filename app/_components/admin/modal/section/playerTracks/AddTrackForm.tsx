import { AdminModalForm, Input, Button } from '@components/admin';
import { addSpotifyTrackId } from '@actions/artist';

export const AddTrackForm = () => {
    return (
		<AdminModalForm action={addSpotifyTrackId} type='row'>
			<Input
				name='trackId'
				type='text'
				placeholder='Paste track URL or 22-char ID'
			/>
			<Input
				name='trackWeight'
				type='number'
				placeholder='Weight'
			/>
			<Button 
                type='submit'
				content='Add'
			/>
		</AdminModalForm>
	);
}