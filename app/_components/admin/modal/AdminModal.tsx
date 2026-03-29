'use client';

import {
	AdminModalOverlay,
	AdminProps,
	AdminModalHeader,
	AdminModalGrid,
	AdminModalSectionAbout,
	AdminModalSectionSpotifyPlayerTracks,
    AdminModalSectionTheme,
    AdminModalSectionEvents,
} from '@components/admin';

import styles from './AdminModal.module.scss';

interface AdminModalProps {
  onClose: () => void;
  adminProps: AdminProps;
}
export const AdminModal = (props: AdminModalProps) => {
    const { 
        adminProps: {
            initialDescription,
            initialCoverImagePath,
            initialTheme,
            initialEvents,
            initialSpotifyTrackIds,
        },
        onClose 
    } = props;

    return (
        <AdminModalOverlay onClose={onClose}>
            <div
                className={styles.modal}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <AdminModalHeader onClose={onClose} />

                <AdminModalGrid>
                    <AdminModalSectionAbout
                        initialDescription={initialDescription}
                        initialCoverImagePath={initialCoverImagePath}
                    />

                    <AdminModalSectionSpotifyPlayerTracks
                        initialSpotifyTrackIds={initialSpotifyTrackIds}
                    />

                    <AdminModalSectionTheme
                        initialTheme={initialTheme}
                    />

                    <AdminModalSectionEvents
                        initialEvents={initialEvents}
                    />
                </AdminModalGrid>
            </div>
        </AdminModalOverlay>
    );
}