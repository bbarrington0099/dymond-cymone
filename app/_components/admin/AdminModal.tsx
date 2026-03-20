'use client';

import { createPortal } from 'react-dom';
import { useEffect, useMemo, useState } from 'react';
import type { ArtistEventPayload } from '@actions/artist';
import {
  createArtistEvent,
  deleteArtistEvent,
  deleteArtistEventThumbnail,
  deleteArtistCoverImage,
  setArtistCoverImagePath,
  updateArtistDescriptionFromFormData,
  updateArtistEvent,
  updateArtistTheme,
  addSpotifyTrackId,
  removeSpotifyTrackId,
} from '@actions/artist';
import { createSupabaseBrowserClient } from '@lib/supabase/client';
import styles from './AdminModal.module.scss';

export default function AdminModal({
  onClose,
  initialDescription,
  initialCoverImagePath,
  initialTheme,
  initialEvents,
  initialSpotifyTrackIds,
}: {
  onClose: () => void;
  initialDescription: string;
  initialCoverImagePath: string;
  initialTheme: {
    themePrimaryColor: string;
    themeSecondaryColor: string;
    themeTertiaryColor: string;
    themePrimaryFontCssLink: string;
    themeSecondaryFontCssLink: string;
  };
  initialEvents: ArtistEventPayload[];
  initialSpotifyTrackIds: string[];
}) {
  const [mounted, setMounted] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createImagePath, setCreateImagePath] = useState<string>('');
  const [editImagePath, setEditImagePath] = useState<string>('');

  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mounted, onClose]);

  const selectedEvent = useMemo(() => {
    return initialEvents.find((e) => e.id === selectedId) ?? null;
  }, [initialEvents, selectedId]);

  useEffect(() => {
    setEditImagePath(selectedEvent?.imagePath ?? '');
  }, [selectedEvent?.id, selectedEvent?.imagePath]);

  const resolvePublicObjectUrl = (bucket: string, pathOrUrl: string) => {
    const trimmed = pathOrUrl?.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) return '';
    return `${base}/storage/v1/object/public/${bucket}/${trimmed}`;
  };

  async function getCurrentUserId() {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw new Error(error.message);
    if (!user) throw new Error('Not authenticated');
    return user.id;
  }

  function safeFileName(fileName: string) {
    return (fileName || '')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 140);
  }

  async function uploadToBucket(bucket: string, file: File) {
    const userId = await getCurrentUserId();
    const stamp = Date.now().toString(16);
    const objectPath = `${userId}/${stamp}_${safeFileName(file.name)}`;

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.storage
      .from(bucket)
      .upload(objectPath, file, { upsert: true, cacheControl: '3600' });

    if (error) throw new Error(error.message);
    return objectPath;
  }

  async function handleCoverUpload(file: File) {
    setCoverUploading(true);
    setCoverError(null);
    try {
      const objectPath = await uploadToBucket('artist-covers', file);
      await setArtistCoverImagePath(objectPath);
      // Refresh public homepage to pick up new cover URL + revalidated theme.
      window.location.reload();
    } catch (e) {
      setCoverError(e instanceof Error ? e.message : 'Failed to upload cover image.');
    } finally {
      setCoverUploading(false);
    }
  }

  async function handleEventThumbUpload(kind: 'create' | 'edit', file: File) {
    try {
      const objectPath = await uploadToBucket('artist-event-thumbs', file);
      if (kind === 'create') setCreateImagePath(objectPath);
      else setEditImagePath(objectPath);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to upload event thumbnail.');
    }
  }

  async function handleDeleteCover() {
    await deleteArtistCoverImage();
    window.location.reload();
  }

  async function handleDeleteEventThumb() {
    if (!selectedEvent) return;
    const prevPath = (selectedEvent.imagePath ?? '').trim();
    const draftPath = (editImagePath ?? '').trim();

    // If the artist uploaded a new draft thumbnail that hasn't been saved to DB yet,
    // delete it client-side to avoid leaving an orphan object behind.
    if (draftPath && draftPath !== prevPath) {
      try {
        const supabase = createSupabaseBrowserClient();
        await supabase.storage.from('artist-event-thumbs').remove([draftPath]);
      } catch {
        // Best-effort cleanup; DB will still be cleared below.
      }
    }

    await deleteArtistEventThumbnail(selectedEvent.id);
    window.location.reload();
  }

  return (
    mounted
      ? createPortal(
          <div
            className={styles.overlay}
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) onClose();
            }}
          >
            <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
              <div className={styles.header}>
                <h2 className={styles.title}>Artist Admin</h2>
                <button type="button" className={styles.close} onClick={onClose}>
                  Close
                </button>
              </div>

              <div className={styles.grid}>
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>About</h3>

                  <div className={styles.coverRow}>
                    <div className={styles.coverPreview}>
                      {initialCoverImagePath ? (
                        <img
                          className={styles.coverImg}
                          alt="Cover"
                          src={resolvePublicObjectUrl('artist-covers', initialCoverImagePath)}
                        />
                      ) : (
                        <div className={styles.coverEmpty}>No cover</div>
                      )}
                    </div>

                    <div className={styles.coverControls}>
                      <label className={styles.field}>
                        Cover image
                        <input
                          type="file"
                          accept="image/*"
                          disabled={coverUploading}
                          onChange={async (ev) => {
                            const f = ev.target.files?.[0];
                            if (f) await handleCoverUpload(f);
                            ev.currentTarget.value = '';
                          }}
                        />
                      </label>

                      <div className={styles.coverBtnRow}>
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          onClick={() => handleDeleteCover()}
                          disabled={coverUploading || !initialCoverImagePath}
                        >
                          Remove
                        </button>
                      </div>

                      {coverError && <p className={styles.muted}>{coverError}</p>}
                    </div>
                  </div>

                  <form action={updateArtistDescriptionFromFormData}>
                    <textarea
                      name="description"
                      defaultValue={initialDescription}
                      className={styles.textarea}
                      rows={6}
                    />
                    <span className={styles.formatInstructions}>
                      Using \n will create a line break, using \n\n will indent the new line.
                    </span>
                    <button className={styles.primaryBtn} type="submit">
                      Save description
                    </button>
                  </form>
                </section>

                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>Spotify Player Tracks</h3>
                  <p className={styles.muted}>
                    Add Spotify track IDs or paste track URLs. One track is shown at random in the embed.
                  </p>
                  <form action={addSpotifyTrackId} className={styles.formRow}>
                    <input
                      name="trackId"
                      type="text"
                      placeholder="Paste track URL or 22-char ID"
                      className={styles.input}
                    />
                    <button className={styles.primaryBtn} type="submit">
                      Add
                    </button>
                  </form>
                  {initialSpotifyTrackIds.length > 0 ? (
                    <ul className={styles.ul}>
                      {initialSpotifyTrackIds.map((id) => (
                        <li key={id} className={styles.eventItem}>
                          <span className={styles.trackId}>{id}</span>
                          <form action={removeSpotifyTrackId}>
                            <input type="hidden" name="trackId" value={id} />
                            <button type="submit" className={styles.dangerBtn}>
                              Remove
                            </button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.muted}>No tracks yet.</p>
                  )}
                </section>

                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>Theme</h3>
                  <form action={updateArtistTheme} className={styles.formGrid}>
                    <label className={styles.field}>
                      Primary color
                      <input name="primaryColor" defaultValue={initialTheme.themePrimaryColor} />
                    </label>
                    <label className={styles.field}>
                      Secondary color
                      <input name="secondaryColor" defaultValue={initialTheme.themeSecondaryColor} />
                    </label>
                    <label className={styles.field}>
                      Tertiary color
                      <input name="tertiaryColor" defaultValue={initialTheme.themeTertiaryColor} />
                    </label>
                    <label className={styles.field}>
                      Primary font CSS link
                      <input
                        name="primaryFontCssLink"
                        defaultValue={initialTheme.themePrimaryFontCssLink}
                      />
                    </label>
                    <label className={styles.field}>
                      Secondary font CSS link
                      <input
                        name="secondaryFontCssLink"
                        defaultValue={initialTheme.themeSecondaryFontCssLink}
                      />
                    </label>

                    <button className={styles.primaryBtn} type="submit">
                      Save theme
                    </button>
                  </form>
                </section>

                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>Upcoming events</h3>

                  <div className={styles.eventList}>
                    {initialEvents.length === 0 ? (
                      <p className={styles.muted}>No events yet.</p>
                    ) : (
                      <ul className={styles.ul}>
                        {initialEvents.map((e) => (
                          <li key={e.id} className={styles.eventItem}>
                            <div className={styles.eventMain}>
                              <strong>{e.title}</strong>
                              <div className={styles.eventMeta}>
                                {e.eventDate ? new Date(e.eventDate).toLocaleDateString() : ''}
                                {e.eventTime ? ` ${e.eventTime}` : ''}
                                {e.venue ? ` @ ${e.venue}` : ''}
                                {e.locationText ? `, ${e.locationText}` : ''}
                              </div>
                            </div>

                            <div className={styles.eventActions}>
                              <button
                                type="button"
                                className={styles.secondaryBtn}
                                onClick={() => setSelectedId(e.id)}
                              >
                                Edit
                              </button>
                      <form action={deleteArtistEvent}>
                                <input type="hidden" name="eventId" value={e.id} />
                                <button type="submit" className={styles.dangerBtn}>
                                  Delete
                                </button>
                              </form>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className={styles.split}>
                    <div className={styles.subSection}>
                      <h4 className={styles.subTitle}>Add</h4>
                      <form action={createArtistEvent} className={styles.formGrid}>
                        <label className={styles.field}>
                          Title
                          <input name="title" required />
                        </label>
                        <label className={styles.field}>
                          Date
                          <input name="eventDate" type="date" required />
                        </label>
                        <label className={styles.field}>
                          Time (optional)
                          <input name="eventTime" />
                        </label>
                        <label className={styles.field}>
                          Venue (optional)
                          <input name="venue" />
                        </label>
                        <label className={styles.field}>
                          Location text (optional)
                          <input name="locationText" />
                        </label>

                        <input type="hidden" name="imagePath" value={createImagePath} />

                        <div className={styles.thumbUploadBlock}>
                          <div className={styles.thumbPreview}>
                            {createImagePath ? (
                              <img
                                className={styles.thumbImg}
                                alt="Event thumbnail"
                                src={resolvePublicObjectUrl('artist-event-thumbs', createImagePath)}
                              />
                            ) : (
                              <div className={styles.thumbEmpty}>No thumbnail</div>
                            )}
                          </div>
                          <label className={styles.field}>
                            Upload thumbnail
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (ev) => {
                                const f = ev.target.files?.[0];
                                if (f) await handleEventThumbUpload('create', f);
                                ev.currentTarget.value = '';
                              }}
                            />
                          </label>
                        </div>

                        <button className={styles.primaryBtn} type="submit">
                          Create event
                        </button>
                      </form>
                    </div>

                    <div className={styles.subSection}>
                      <h4 className={styles.subTitle}>Edit</h4>
                      {!selectedEvent ? (
                        <p className={styles.muted}>Select an event to edit.</p>
                      ) : (
                        <form
                          key={selectedEvent.id}
                          action={updateArtistEvent}
                          className={styles.formGrid}
                        >
                          <input type="hidden" name="eventId" value={selectedEvent.id} />

                          <input type="hidden" name="imagePath" value={editImagePath} />

                          <label className={styles.field}>
                            Title
                            <input name="title" defaultValue={selectedEvent.title} required />
                          </label>
                          <label className={styles.field}>
                            Date
                            <input
                              name="eventDate"
                              type="date"
                              defaultValue={selectedEvent.eventDateYmd}
                              required
                            />
                          </label>
                          <label className={styles.field}>
                            Time (optional)
                            <input name="eventTime" defaultValue={selectedEvent.eventTime} />
                          </label>
                          <label className={styles.field}>
                            Venue (optional)
                            <input name="venue" defaultValue={selectedEvent.venue} />
                          </label>
                          <label className={styles.field}>
                            Location text (optional)
                            <input
                              name="locationText"
                              defaultValue={selectedEvent.locationText}
                            />
                          </label>

                          <div className={styles.thumbUploadBlock}>
                            <div className={styles.thumbPreview}>
                              {editImagePath ? (
                                <img
                                  className={styles.thumbImg}
                                  alt="Event thumbnail"
                                  src={resolvePublicObjectUrl('artist-event-thumbs', editImagePath)}
                                />
                              ) : (
                                <div className={styles.thumbEmpty}>No thumbnail</div>
                              )}
                            </div>
                            <label className={styles.field}>
                              Upload thumbnail
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (ev) => {
                                  const f = ev.target.files?.[0];
                                  if (f) await handleEventThumbUpload('edit', f);
                                  ev.currentTarget.value = '';
                                }}
                              />
                            </label>

                            <button
                              type="button"
                              className={styles.dangerBtn}
                              onClick={() => handleDeleteEventThumb()}
                              disabled={!editImagePath && !selectedEvent.imagePath}
                            >
                              Remove thumbnail
                            </button>
                          </div>

                          <button className={styles.primaryBtn} type="submit">
                            Save changes
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>,
          document.body
        )
      : null
  );
}

