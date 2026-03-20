import { auth } from '@lib/auth';
import { logout } from '@actions/auth';
import AdminButton from '@components/admin/AdminButton';
import type { ArtistEventPayload } from '@actions/artist';
import styles from './AdminGate.module.scss';

export default async function AdminGate({
  initialDescription,
  initialCoverImagePath,
  initialTheme,
  initialEvents,
  initialSpotifyTrackIds,
}: {
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
  const session = await auth();
  if (!session?.user) return null;

  return (
    <div className={styles.adminBar}>
      <AdminButton
        initialDescription={initialDescription}
        initialCoverImagePath={initialCoverImagePath}
        initialTheme={initialTheme}
        initialEvents={initialEvents}
        initialSpotifyTrackIds={initialSpotifyTrackIds}
      />
      <form action={logout}>
        <button type="submit" className={styles.button}>
          Logout
        </button>
      </form>
    </div>
  );
}

