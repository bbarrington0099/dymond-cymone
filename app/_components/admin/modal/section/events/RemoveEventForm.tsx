import { AdminModalForm, Input, Button } from "@components/admin";
import { deleteArtistEvent } from "@actions/artist";

interface RemoveEventFormProps {
    eventId: string;
}
export const RemoveEventForm = (props: RemoveEventFormProps) => {
    const { eventId } = props;

    return (
		<AdminModalForm action={deleteArtistEvent}>
			<Input 
                type='hidden' 
                name='eventId' 
                value={eventId} />
			<Button 
                type='submit'
				content='Delete'
			/>
		</AdminModalForm>
	);
}
