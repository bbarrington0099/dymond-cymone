import { auth } from '@lib/auth';
import AdminButton from '@components/admin/AdminButton';
import type { ArtistEventPayload } from '@actions/artist';

export default async function AdminGate({
  initialDescription,
  initialCoverImagePath,
  initialTheme,
  initialEvents,
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
}) {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <AdminButton
      initialDescription={initialDescription}
      initialCoverImagePath={initialCoverImagePath}
      initialTheme={initialTheme}
      initialEvents={initialEvents}
    />
  );
}

