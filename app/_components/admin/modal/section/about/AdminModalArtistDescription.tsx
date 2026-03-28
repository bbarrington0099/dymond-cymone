import { AdminModalForm, Button, Guide, TextArea } from '@components/admin';
import { updateArtistDescriptionFromFormData } from '@actions/artist';

interface AdminModalArtistDescriptionProps {
    initialDescription: string;
}
export const AdminModalArtistDescription = (props: AdminModalArtistDescriptionProps) => {
    const { initialDescription } = props;

    return (
        <AdminModalForm action={updateArtistDescriptionFromFormData}>
            <TextArea
                name='description'
                defaultValue={initialDescription}
                rows={6}
            />
            <Guide
                content='Using \n will create a line break, using \n\n will indent the new line.' 
            />
            <Button
                content='Save description'
                type='submit'
            />
        </AdminModalForm>
    )
}
