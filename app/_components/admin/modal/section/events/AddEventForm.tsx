'use client';

import React from "react";
import { AdminModalForm, Field, Input, Button, Img, resolvePublicObjectUrl } from "@components/admin";
import { createArtistEvent } from "@actions/artist";
import { camelCaseToWords } from "@lib/utils";

import styles from './AdminModalSectionEvents.module.scss';

interface AddEventFormProps {
    createImagePath?: string;
    setCreateImagePath: React.Dispatch<React.SetStateAction<string>>;
	handleEventThumbUpload: (kind: 'create' | 'edit', file: File) => Promise<void>;
}
export const AddEventForm = (props: AddEventFormProps) => {
    const { createImagePath, setCreateImagePath, handleEventThumbUpload } = props;

    const eventFields: { name: string; type?: string; required?: boolean }[] = [
        { name: 'title', required: true },
        { name: 'eventDate', type: 'date', required: true },
        { name: 'eventTime', type: 'text' },
        { name: 'venue', type: 'text' },
        { name: 'locationText', type: 'text' },
    ];

    return (
        <AdminModalForm action={createArtistEvent} type='grid'>
            {eventFields.map((field) => (
                <Field key={field.name} label={`${camelCaseToWords(field.name)}${field.required ? ' *' : ' (optional)'}`}>
                    <Input name={field.name} type={field.type || 'text'} required={field.required} />
                </Field>
            ))}

            <Input
                type='hidden'
                name='imagePath'
                value={createImagePath}
            />

            <div className={styles.thumbUploadBlock}>
                <div className={styles.thumbPreview}>
                    {createImagePath ? (
                        <Img
                            className={styles.thumbImg}
                            alt='Event thumbnail'
                            src={resolvePublicObjectUrl(
                                'artist-event-thumbs',
                                createImagePath,
                            )}
                        />
                    ) : (
                        <div className={styles.thumbEmpty}>
                            No thumbnail
                        </div>
                    )}
                </div>
                <Field label="Upload thumbnail">
                    <Input
                        name='eventThumb'
                        type='file'
                        accept='image/*'
                        onChange={async (event: React.ChangeEvent<HTMLInputElement>) => {
                            const f = event.target.files?.[0];
                            if (f)
                                await handleEventThumbUpload(
                                    'create',
                                    f,
                                );
                            event.currentTarget.value = '';
                        }}
                    />
                </Field>
            </div>

            <Button 
                type='submit'
                content='Create event'
                onClick={() => setCreateImagePath('')}
            />
        </AdminModalForm>
    )
}
