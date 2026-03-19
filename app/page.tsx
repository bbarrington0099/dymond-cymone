import { getArtistProfile, getArtistEvents } from '@actions/artist';
import styles from './page.module.scss';
import { Suspense } from 'react';
import AdminGate from '@components/admin/AdminGate';
import { renderFormattedText } from '@lib/react/renderFormattedText';
import DiscographyWidget, { DiscographySkeleton } from '@components/spotify/DiscographyWidget';
import SpotifyPlayer from '@components/spotify/SpotifyPlayer';

async function DiscographySection({
  searchParams,
  spotifyArtistId,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
  spotifyArtistId: string;
}) {
  const sp = searchParams ? await searchParams : undefined;
  const discographyPageRaw = sp?.discographyPage;
  const discographyPage =
    typeof discographyPageRaw === 'string' ? Number(discographyPageRaw) : 1;
  const page = Number.isFinite(discographyPage) && discographyPage > 0 ? discographyPage : 1;
  return (
    <DiscographyWidget
      spotifyArtistId={spotifyArtistId}
      page={page}
      pageSize={5}
    />
  );
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

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<
    string,
    string | string[] | undefined
  >;
}) {
  const profile = await getArtistProfile();
  if (!profile) {
    return (
      <main className={styles.main}>
        <p>No artist profile found. Run the seed script.</p>
      </main>
    );
  }

  const events = await getArtistEvents(profile.id);
  const coverSrc = resolveSupabasePublicObjectUrl('artist-covers', profile.coverImagePath);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>{profile.name}</h1>
        {profile.coverImagePath && (
          <div className={styles.coverWrap}>
            {coverSrc ? (
              <img src={coverSrc} alt="Artist cover" className={styles.coverImg} />
            ) : (
              <div className={styles.coverPlaceholder}>Cover: {profile.coverImagePath}</div>
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
        />
      </Suspense>

      <Suspense fallback={<DiscographySkeleton />}>
        <DiscographySection
          searchParams={searchParams}
          spotifyArtistId={profile.spotifyArtistId}
        />
      </Suspense>

      {profile.spotifyPlaylistId && (
        <SpotifyPlayer spotifyPlaylistId={profile.spotifyPlaylistId} />
      )}
    </main>
  );
}
