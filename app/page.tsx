'use server';

import { getArtistProfile, getArtistEvents } from '@actions/artist';
import { getSpotifyArtist } from '@actions/spotify';
import { isSpotifyTrackIdArray, SpotifyTrackId } from '@lib/spotify';
import {
	SpotifyPlayerSection,
	DiscographyWidget,
  AdminGate,
  Img,
  Link,
  List,
  ListItem,
} from '@components/index';
import { resolveSupabasePublicObjectUrl } from '@lib/supabase/storage-client';
import { Suspense } from 'react';
import { renderFormattedText } from '@lib/react/renderFormattedText';

import styles from './page.module.scss';

export default async function HomePage() {
  const profile = await getArtistProfile();
  if (!profile) {
    return (
      <main className={styles.main}>
        <p>No artist profile found. Run the seed script.</p>
      </main>
    );
  }

  const [events, spotifyArtist] = await Promise.all([
    getArtistEvents(profile.id),
    getSpotifyArtist(profile.spotifyArtistId),
  ]);

  const coverSrc = profile.coverImagePath
    ? resolveSupabasePublicObjectUrl('artist-covers', profile.coverImagePath)
    : spotifyArtist?.imageUrl ?? null;

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>{profile.name}</h1>
        {(coverSrc || profile.coverImagePath) && (
          <div className={styles.coverWrap}>
            {coverSrc ? (
              <Img src={coverSrc} alt="Artist cover" className={styles.coverImg} />
            ) : (
              <div className={styles.coverPlaceholder}>Cover: {profile.coverImagePath}</div>
            )}
          </div>
        )}
        {(spotifyArtist?.followers != null || spotifyArtist?.spotifyUrl) && (
          <div className={styles.spotifyMeta}>
            {spotifyArtist.followers > 0 && (
              <span className={styles.followers}>
                {spotifyArtist.followers.toLocaleString()} followers
              </span>
            )}
            {spotifyArtist.spotifyUrl && (
              <Link
                href={spotifyArtist.spotifyUrl}
                content="Listen on Spotify"
              />
            )}
          </div>
        )}
      </header>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>About</h2>
        <p className={styles.description}>{renderFormattedText(profile.description)}</p>
      </section>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Upcoming events</h2>
        {events.length === 0 ? (
          <p className={styles.empty}>No upcoming events.</p>
        ) : (
          <List>
            {events.map((event) => (
              <ListItem key={event.id}>
                <strong>{event.title}</strong>
                {' — '}
                {new Date(event.eventDate).toLocaleDateString()}
                {event.eventTime && ` ${event.eventTime}`}
                {event.venue && ` @ ${event.venue}`}
                {event.locationText && `, ${event.locationText}`}
              </ListItem>
            ))}
          </List>
        )}
      </section>

      <Suspense fallback={null}>
        <AdminGate
            adminProps={{
              initialDescription: profile.description,
              initialCoverImagePath: profile.coverImagePath,
              initialTheme: {
                themePrimaryColor: profile.themePrimaryColor,
                themeSecondaryColor: profile.themeSecondaryColor,
                themeTertiaryColor: profile.themeTertiaryColor,
                themePrimaryFontCssLink: profile.themePrimaryFontCssLink,
                themeSecondaryFontCssLink: profile.themeSecondaryFontCssLink,
              },
              initialEvents: events,
              initialSpotifyTrackIds: profile.spotifyTrackIds ?? []
            }}
        />
      </Suspense>

      <Suspense fallback={null}>
        <DiscographyWidget spotifyArtistId={profile.spotifyArtistId} />
      </Suspense>

      {(profile.spotifyTrackIds?.length || profile.spotifyArtistId) && (
        <Suspense fallback={null}>
          <SpotifyPlayerSection
            spotifyTrackIds={isSpotifyTrackIdArray(profile.spotifyTrackIds) ? profile.spotifyTrackIds as SpotifyTrackId[] : [] as SpotifyTrackId[]}
            spotifyArtistId={profile.spotifyArtistId}
          />
        </Suspense>
      )}
    </main>
  );
}
