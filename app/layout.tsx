import type { Metadata } from 'next';
import { getArtistProfile } from '@actions/artist';
import './globals.scss';

export const metadata: Metadata = {
  title: 'Artist',
  description: 'Artist site',
};

function getGoogleFontFamily(cssLink: string | undefined): string | undefined {
  if (!cssLink) return undefined;
  try {
    const url = new URL(cssLink);
    const family = url.searchParams.get('family');
    if (!family) return undefined;
    // Example: "Roboto:wght@400;700" => "Roboto"
    const first = family.split(':')[0] ?? '';
    return decodeURIComponent(first).replace(/\+/g, ' ').trim() || undefined;
  } catch {
    return undefined;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getArtistProfile();
  const themeVars: React.CSSProperties = profile
    ? {
        ['--primary-color' as string]: profile.themePrimaryColor,
        ['--secondary-color' as string]: profile.themeSecondaryColor,
        ['--tertiary-color' as string]: profile.themeTertiaryColor,
        ['--primary-font-family' as string]: getGoogleFontFamily(profile.themePrimaryFontCssLink),
        ['--secondary-font-family' as string]: getGoogleFontFamily(profile.themeSecondaryFontCssLink),
      }
    : {};
  const primaryFont = profile?.themePrimaryFontCssLink;
  const secondaryFont = profile?.themeSecondaryFontCssLink;
  const favPath = profile?.themeFavPath;

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        {primaryFont && (
          <link rel="stylesheet" href={primaryFont} />
        )}
        {secondaryFont && primaryFont !== secondaryFont && (
          <link rel="stylesheet" href={secondaryFont} />
        )}
        {favPath && <link rel="icon" href={favPath} />}
      </head>
      <body style={themeVars}>{children}</body>
    </html>
  );
}
