'use client';

import { AdminModalForm, Field, Input, Img, Button, resolvePublicObjectUrl } from "@components/admin";
import { deleteArtistEventThumbnail, updateArtistEvent } from "@actions/artist";
import { createSupabaseBrowserClient } from "@lib/supabase/client";
import { camelCaseToWords } from "@lib/utils";

import styles from "./AdminModalSectionEvents.module.scss";

interface EditEventFormProps {
    selectedEvent: any;
    editImagePath: string;
    handleEventThumbUpload: (kind: 'create' | 'edit', file: File) => Promise<void>;
}
export const EditEventForm = (props: EditEventFormProps) => {
    const { selectedEvent, editImagePath, handleEventThumbUpload } = props;

    const eventFields: { name: string; type?: string; required?: boolean }[] = [
        { name: 'title', required: true },
        { name: 'eventDate', type: 'date', required: true },
        { name: 'eventTime', type: 'text' },
        { name: 'venue', type: 'text' },
        { name: 'locationText', type: 'text' },
    ];

    async function handleDeleteEventThumb() {
		if (!selectedEvent) return;
		const prevPath = (selectedEvent.imagePath ?? '').trim();
		const draftPath = (editImagePath ?? '').trim();

		// If the artist uploaded a new draft thumbnail that hasn't been saved to DB yet,
		// delete it client-side to avoid leaving an orphan object behind.
		if (draftPath && draftPath !== prevPath) {
			try {
				const supabase = createSupabaseBrowserClient();
				await supabase.storage
					.from('artist-event-thumbs')
					.remove([draftPath]);
			} catch {
				// Best-effort cleanup; DB will still be cleared below.
			}
		}

		await deleteArtistEventThumbnail(selectedEvent.id);
		window.location.reload();
	}

    return (
		<AdminModalForm
			key={selectedEvent.id}
			action={updateArtistEvent}
			type='grid'
		>
			<Input type='hidden' name='eventId' value={selectedEvent.id} />
			<Input type='hidden' name='imagePath' value={editImagePath} />

            {eventFields.map((field) => (
                <Field key={field.name} label={`${camelCaseToWords(field.name)}${field.required ? ' *' : ' (optional)'}`}>
                    <Input name={field.name} type={field.type || 'text'} defaultValue={selectedEvent[field.name]} required={field.required} />
                </Field>
            ))}
			
			<div className={styles.thumbUploadBlock}>
				<div className={styles.thumbPreview}>
					{editImagePath ? (
						<Img
							className={styles.thumbImg}
							alt='Event thumbnail'
							src={resolvePublicObjectUrl(
								'artist-event-thumbs',
								editImagePath,
							)}
						/>
					) : (
						<div className={styles.thumbEmpty}>No thumbnail</div>
					)}
				</div>

                <Field label="Change thumbnail">
                    <Input
                        name='eventThumb'
                        type='file'
                        accept='image/*'
                        onChange={async (event: React.ChangeEvent<HTMLInputElement>) => {
                            const f = event.target.files?.[0];
                            if (f)
                                await handleEventThumbUpload('edit', f);
                            event.currentTarget.value = '';
                        }}
                    />
                </Field>

				<Button
					type='button'
					onClick={() => handleDeleteEventThumb()}
					disabled={!editImagePath && !selectedEvent.imagePath}
					content='Remove thumbnail'
				/>
			</div>

			<Button 
                type='submit' 
                content='Save changes' 
            />
		</AdminModalForm>
	);
}
