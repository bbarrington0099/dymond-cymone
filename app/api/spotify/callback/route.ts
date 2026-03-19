import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';

const SPOTIFY_SCOPES =
  'streaming user-modify-playback-state user-read-playback-state';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const appUrl = requireEnv('NEXT_PUBLIC_APP_URL');
  const redirectUri = `${appUrl.replace(/\/$/, '')}/api/spotify/callback`;

  if (error) {
    console.error('Spotify OAuth error:', error);
    return NextResponse.redirect(`${appUrl}?spotify_error=${error}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}?spotify_error=missing_params`);
  }

  // state = artistProfileId (we pass it from the connect action)
  const artistProfileId = state;

  const clientId = requireEnv('SPOTIFY_CLIENT_ID');
  const clientSecret = requireEnv('SPOTIFY_CLIENT_SECRET');

  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
    cache: 'no-store',
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text().catch(() => '');
    console.error('Spotify token exchange failed:', tokenRes.status, text);
    return NextResponse.redirect(`${appUrl}?spotify_error=token_exchange`);
  }

  const data = (await tokenRes.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  const existing = await prisma.spotifyToken.findFirst({
    where: { artistProfileId },
  });

  if (existing) {
    await prisma.spotifyToken.update({
      where: { id: existing.id },
      data: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
      },
    });
  } else {
    await prisma.spotifyToken.create({
      data: {
        artistProfileId,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
      },
    });
  }

  return NextResponse.redirect(appUrl);
}
