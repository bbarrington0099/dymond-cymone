'use client';

import { useEffect, useMemo, useState } from "react";
import { ArtistEventPayload } from "@actions/artist";
import { EditEventForm, AdminModalSection, EventList, AddEventForm } from "@components/admin";
import { uploadToBucket } from "@lib/supabase/storage-client";

import styles from './AdminModalSectionEvents.module.scss';

interface AdminModalSectionEventsProps {
	initialEvents: ArtistEventPayload[];
}
export const AdminModalSectionEvents = (props: AdminModalSectionEventsProps) => {
    const { initialEvents } = props;
    
    const [createImagePath, setCreateImagePath] = useState<string>('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [editImagePath, setEditImagePath] = useState<string>('');

    const selectedEvent = useMemo(() => {
        return initialEvents.find((e) => e.id === selectedId) ?? null;
    }, [initialEvents, selectedId]);
    
    useEffect(() => {
        setEditImagePath(selectedEvent?.imagePath ?? '');
    }, [selectedEvent?.id, selectedEvent?.imagePath]);
    
    async function handleEventThumbUpload(kind: 'create' | 'edit', file: File) {
		try {
			const objectPath = await uploadToBucket(
				'artist-event-thumbs',
				file,
			);
			if (kind === 'create') setCreateImagePath(objectPath);
			else setEditImagePath(objectPath);
		} catch (e) {
			alert(
				e instanceof Error
					? e.message
					: 'Failed to upload event thumbnail.',
			);
		}
	}

    return (
		<AdminModalSection title='Upcoming events'>
			<div className={styles.eventList}>
				{initialEvents.length === 0 ? (
					<p className={styles.muted}>No events yet.</p>
				) : (
					<EventList 
                        initialEvents={initialEvents} 
                        setSelectedId={setSelectedId}
                    />
				)}
			</div>

			<div className={styles.split}>
				<div className={styles.subSection}>
					<h4 className={styles.subTitle}>Add</h4>
					<AddEventForm 
                        createImagePath={createImagePath}
                        setCreateImagePath={setCreateImagePath}
                        handleEventThumbUpload={handleEventThumbUpload}
                    />
				</div>

				<div className={styles.subSection}>
					<h4 className={styles.subTitle}>Edit</h4>
					{!selectedEvent ? (
						<p className={styles.muted}>Select an event to edit.</p>
					) : (
						<EditEventForm
                            selectedEvent={selectedEvent}
                            editImagePath={editImagePath}
                            handleEventThumbUpload={handleEventThumbUpload}
                        />
					)}
				</div>
			</div>
		</AdminModalSection>
	);
}