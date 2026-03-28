'use client';

import React, { useState } from 'react';

import { Button, resolvePublicObjectUrl, Img, Field, Input } from '@components/admin';
import { uploadToBucket } from '@lib/supabase/storage-client';
import { deleteArtistCoverImage, setArtistCoverImagePath } from '@actions/artist';

import styles from './AdminModalSectionAbout.module.scss';

interface AdminModalCoverImageProps {
	initialCoverImagePath: string | null;
}
export const AdminModalCoverImage = (props: AdminModalCoverImageProps) => {
	const {
		initialCoverImagePath
	} = props;
    
    const [coverUploading, setCoverUploading] = useState(false);
    const [coverError, setCoverError] = useState<string | null>(null);

	async function handleCoverUpload(file: File) {
		setCoverUploading(true);
		setCoverError(null);
		try {
			const objectPath = await uploadToBucket('artist-covers', file);
			await setArtistCoverImagePath(objectPath);
			window.location.reload();
		} catch (e) {
			setCoverError(
				e instanceof Error
					? e.message
					: 'Failed to upload cover image.',
			);
		} finally {
			setCoverUploading(false);
		}
	}

	async function handleDeleteCover() {
		await deleteArtistCoverImage();
		window.location.reload();
	}

	return (
		<div className={styles.coverRow}>
			<div className={styles.coverPreview}>
				{(initialCoverImagePath && initialCoverImagePath !== '') ? (
					<Img
						className={styles.coverImg}
						alt='Cover'
						src={resolvePublicObjectUrl(
							'artist-covers',
							initialCoverImagePath ?? '',
						)}
					/>
				) : (
					<div className={styles.coverEmpty}>No cover</div>
				)}
			</div>

			<div className={styles.coverControls}>
				<Field label='Cover image'>
					<Input
						name='cover-image-upload'
						type='file'
						accept='image/*'
						disabled={coverUploading}
						onChange={async (
							ev: React.ChangeEvent<HTMLInputElement>,
						) => {
							const f = ev.target.files?.[0];
							if (f)
								await handleCoverUpload(f);
							ev.currentTarget.value = '';
						}}
					/>
				</Field>

				<div className={styles.coverBtnRow}>
					<Button
						content='Delete Cover'
						onClick={() => handleDeleteCover()}
						disabled={coverUploading || !initialCoverImagePath}
					/>
				</div>

				{coverError && <p className={styles.muted}>{coverError}</p>}
			</div>
		</div>
	);
};