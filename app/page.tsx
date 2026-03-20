import { getArtistProfile, getArtistEvents } from '@actions/artist';
import { getRandomTopTrackId, getSpotifyArtist } from '@actions/spotify';
import styles from './page.module.scss';
import { Suspense } from 'react';
import AdminGate from '@components/admin/AdminGate';
import { renderFormattedText } from '@lib/react/renderFormattedText';
import DiscographyClient from '@components/spotify/DiscographyClient';
import { DiscographySkeleton } from '@components/spotify/DiscographyWidget';
import SpotifyPlayer from '@components/spotify/SpotifyPlayer';

async function SpotifyPlayerSection({
  spotifyTrackIds,
  spotifyArtistId,
}: {
  spotifyTrackIds: string[];
  spotifyArtistId: string;
}) {
  let trackIds = spotifyTrackIds;
  if (trackIds.length === 0) {
    const topTrackId = await getRandomTopTrackId(spotifyArtistId);
    trackIds = topTrackId ? [topTrackId] : [];
  }
  if (trackIds.length > 0) {
    return <SpotifyPlayer spotifyTrackIds={trackIds} />;
  }
  return null;
}

function resolveSupabasePublicObjectUrl(bucket: string, pathOrUrl: string | null | undefined) {
  if (!pathOrUrl) return null;
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/${bucket}/${trimmed}`;
}

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
              <img src={coverSrc} alt="Artist cover" className={styles.coverImg} />
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
              <a
                href={spotifyArtist.spotifyUrl}
                target="_blank"
                rel="noreferrer"
                className={styles.spotifyLink}
              >
                Listen on Spotify
              </a>
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
          <ul className={styles.eventList}>
            {events.map((event) => (
              <li key={event.id} className={styles.eventItem}>
                <strong>{event.title}</strong>
                {' — '}
                {new Date(event.eventDate).toLocaleDateString()}
                {event.eventTime && ` ${event.eventTime}`}
                {event.venue && ` @ ${event.venue}`}
                {event.locationText && `, ${event.locationText}`}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Suspense fallback={null}>
        <AdminGate
          initialDescription={profile.description}
          initialCoverImagePath={profile.coverImagePath}
          initialTheme={{
            themePrimaryColor: profile.themePrimaryColor,
            themeSecondaryColor: profile.themeSecondaryColor,
            themeTertiaryColor: profile.themeTertiaryColor,
            themePrimaryFontCssLink: profile.themePrimaryFontCssLink,
            themeSecondaryFontCssLink: profile.themeSecondaryFontCssLink,
          }}
          initialEvents={events}
          initialSpotifyTrackIds={profile.spotifyTrackIds ?? []}
        />
      </Suspense>

      <Suspense fallback={<DiscographySkeleton />}>
        <DiscographyClient spotifyArtistId={profile.spotifyArtistId} />
      </Suspense>

      {(profile.spotifyTrackIds?.length || profile.spotifyArtistId) && (
        <Suspense fallback={null}>
          <SpotifyPlayerSection
            spotifyTrackIds={profile.spotifyTrackIds ?? []}
            spotifyArtistId={profile.spotifyArtistId}
          />
        </Suspense>
      )}
    </main>
  );
}
