import { AdminModalSection, AdminModalCoverImage, AdminModalArtistDescription } from '@components/admin';

interface AdminModalSectionAboutProps {
    initialDescription: string;
    initialCoverImagePath: string | null;
}
export const AdminModalSectionAbout = (props: AdminModalSectionAboutProps) => {
    const {
        initialDescription,
        initialCoverImagePath,
    } = props;

    return (
        <AdminModalSection title='About'>
            <AdminModalCoverImage 
                initialCoverImagePath={initialCoverImagePath}
            />

            <AdminModalArtistDescription 
                initialDescription={initialDescription} 
            />
        </AdminModalSection>
    );
}