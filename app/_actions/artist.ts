'use server';

import { unstable_cache } from 'next/cache';
import { revalidateTag } from 'next/cache';
import { prisma } from '@lib/prisma';
import { CACHE_TAGS, CACHE_LIFE } from '@lib/constants';
import { requireAuth } from '@lib/auth';
import { redirect } from 'next/navigation';
import { deleteStorageObject } from '@lib/supabase/storage-server';

export type ArtistProfilePayload = {
  id: string;
  ownerUserId: string;
  name: string;
  description: string;
  coverImagePath: string;
  themePrimaryColor: string;
  themeSecondaryColor: string;
  themeTertiaryColor: string;
  themePrimaryFontCssLink: string;
  themeSecondaryFontCssLink: string;
  themeFavPath: string;
  spotifyArtistId: string;
  spotifyPlaylistId: string;
};

export type ArtistEventPayload = {
  id: string;
  artistProfileId: string;
  title: string;
  eventDate: string; // ISO string
  eventDateYmd: string; // YYYY-MM-DD for <input type="date">
  eventTime: string;
  venue: string;
  locationText: string;
  imagePath: string;
};

/**
 * Public read: the single artist profile (cached).
 */
export async function getArtistProfile(): Promise<ArtistProfilePayload | null> {
  return unstable_cache(
    async () => {
      const profile = await prisma.artistProfile.findFirst({
        orderBy: { createdAt: 'asc' },
      });
      return profile;
    },
    ['artist-profile'],
    {
      tags: [CACHE_TAGS.ARTIST_PROFILE],
      revalidate: CACHE_LIFE.USER.revalidate,
    }
  )();
}

/**
 * Public read: upcoming events for the artist (cached).
 */
export async function getArtistEvents(
  artistProfileId: string
): Promise<ArtistEventPayload[]> {
  return unstable_cache(
    async () => {
      const events = await prisma.artistEvent.findMany({
        where: { artistProfileId },
        orderBy: { eventDate: 'asc' },
      });
      return events.map((e) => {
        const iso = e.eventDate.toISOString();
        return {
          ...e,
          eventDate: iso,
          eventDateYmd: iso.slice(0, 10),
        };
      });
    },
    ['artist-events', artistProfileId],
    {
      tags: [CACHE_TAGS.ARTIST_EVENTS],
      revalidate: CACHE_LIFE.USER.revalidate,
    }
  )();
}

function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value.trim());
}

function isGoogleFontsCssLink(value: string): boolean {
  const v = value.trim();
  // Basic validation: must be Google Fonts CSS2 endpoint.
  return v.startsWith('https://fonts.googleapis.com/css2?') && v.includes('family=');
}

async function getOwnedProfileOrThrow() {
  const session = await requireAuth();
  const profile = await prisma.artistProfile.findUnique({
    where: { ownerUserId: session.user.id },
  });
  if (!profile) throw new Error('Artist profile not found for this user.');
  return profile;
}

export async function updateArtistDescription(description: string) {
  // Back-compat for potential direct calls; forms should use the FormData overload below.
  const fd = new FormData();
  fd.set('description', description);
  return await updateArtistDescriptionFromFormData(fd);
}

export async function updateArtistDescriptionFromFormData(formData: FormData) {
  const description = String(formData.get('description') ?? '');
  const profile = await getOwnedProfileOrThrow();
  await prisma.artistProfile.update({
    where: { ownerUserId: profile.ownerUserId },
    data: { description },
  });
  revalidateTag(CACHE_TAGS.ARTIST_PROFILE, CACHE_LIFE.USER);
  redirect('/');
}

export async function updateArtistTheme(formData: FormData) {
  const primaryColor = String(formData.get('primaryColor') ?? '').trim();
  const secondaryColor = String(formData.get('secondaryColor') ?? '').trim();
  const tertiaryColor = String(formData.get('tertiaryColor') ?? '').trim();
  const primaryFontCssLink = String(formData.get('primaryFontCssLink') ?? '').trim();
  const secondaryFontCssLink = String(formData.get('secondaryFontCssLink') ?? '').trim();

  if (!isHexColor(primaryColor)) throw new Error('Invalid primaryColor (expected #RRGGBB).');
  if (!isHexColor(secondaryColor)) throw new Error('Invalid secondaryColor (expected #RRGGBB).');
  if (!isHexColor(tertiaryColor)) throw new Error('Invalid tertiaryColor (expected #RRGGBB).');
  if (!isGoogleFontsCssLink(primaryFontCssLink)) throw new Error('Invalid primaryFontCssLink (expected Google Fonts CSS2 URL).');
  if (!isGoogleFontsCssLink(secondaryFontCssLink)) throw new Error('Invalid secondaryFontCssLink (expected Google Fonts CSS2 URL).');

  const profile = await getOwnedProfileOrThrow();
  await prisma.artistProfile.update({
    where: { ownerUserId: profile.ownerUserId },
    data: {
      themePrimaryColor: primaryColor,
      themeSecondaryColor: secondaryColor,
      themeTertiaryColor: tertiaryColor,
      themePrimaryFontCssLink: primaryFontCssLink,
      themeSecondaryFontCssLink: secondaryFontCssLink,
    },
  });

  revalidateTag(CACHE_TAGS.ARTIST_PROFILE, CACHE_LIFE.USER);
  redirect('/');
}

export async function createArtistEvent(formData: FormData) {
  const profile = await getOwnedProfileOrThrow();
  const title = String(formData.get('title') ?? '').trim();
  const dateYmd = String(formData.get('eventDate') ?? '').trim();
  if (!title) throw new Error('Event title is required.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateYmd)) throw new Error('Invalid eventDate (expected YYYY-MM-DD).');

  const eventDate = new Date(`${dateYmd}T00:00:00.000Z`);
  if (Number.isNaN(eventDate.getTime())) throw new Error('Invalid eventDate.');

  const eventTime = String(formData.get('eventTime') ?? '').trim();
  const venue = String(formData.get('venue') ?? '').trim();
  const locationText = String(formData.get('locationText') ?? '').trim();
  const imagePath = String(formData.get('imagePath') ?? '').trim();

  await prisma.artistEvent.create({
    data: {
      artistProfileId: profile.id,
      title,
      eventDate,
      eventTime,
      venue,
      locationText,
      imagePath,
    },
  });

  revalidateTag(CACHE_TAGS.ARTIST_EVENTS, CACHE_LIFE.USER);
  redirect('/');
}

export async function updateArtistEvent(formData: FormData) {
  const profile = await getOwnedProfileOrThrow();
  const eventId = String(formData.get('eventId') ?? '').trim();
  if (!eventId) throw new Error('eventId is required.');

  const existing = await prisma.artistEvent.findUnique({
    where: { id: eventId },
    select: { id: true, artistProfileId: true, imagePath: true },
  });
  if (!existing) throw new Error('Event not found.');
  if (existing.artistProfileId !== profile.id) throw new Error('Forbidden.');

  const title = String(formData.get('title') ?? '').trim();
  const dateYmd = String(formData.get('eventDate') ?? '').trim();
  if (!title) throw new Error('Event title is required.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateYmd)) throw new Error('Invalid eventDate (expected YYYY-MM-DD).');

  const eventDate = new Date(`${dateYmd}T00:00:00.000Z`);
  const eventTime = String(formData.get('eventTime') ?? '').trim();
  const venue = String(formData.get('venue') ?? '').trim();
  const locationText = String(formData.get('locationText') ?? '').trim();
  const imagePath = String(formData.get('imagePath') ?? '').trim();

  // If the image path changed, delete the previous storage object.
  const prevImagePath = (existing.imagePath ?? '').trim();
  if (prevImagePath && prevImagePath !== imagePath) {
    await deleteStorageObject('artist-event-thumbs', prevImagePath);
  }

  await prisma.artistEvent.update({
    where: { id: eventId },
    data: {
      title,
      eventDate,
      eventTime,
      venue,
      locationText,
      imagePath,
    },
  });

  revalidateTag(CACHE_TAGS.ARTIST_EVENTS, CACHE_LIFE.USER);
  redirect('/');
}

export async function deleteArtistEvent(formData: FormData) {
  const profile = await getOwnedProfileOrThrow();
  const id = String(formData.get('eventId') ?? '').trim();
  if (!id) throw new Error('eventId is required.');

  const existing = await prisma.artistEvent.findUnique({
    where: { id },
    select: { artistProfileId: true, imagePath: true },
  });
  if (!existing) return;
  if (existing.artistProfileId !== profile.id) throw new Error('Forbidden.');

  const imagePath = (existing.imagePath ?? '').trim();
  if (imagePath) {
    await deleteStorageObject('artist-event-thumbs', imagePath);
  }

  await prisma.artistEvent.delete({ where: { id } });
  revalidateTag(CACHE_TAGS.ARTIST_EVENTS, CACHE_LIFE.USER);
  redirect('/');
}

export async function setArtistCoverImagePath(imagePath: string) {
  const profile = await getOwnedProfileOrThrow();
  const nextPath = imagePath?.trim() ?? '';

  const prevPath = (profile.coverImagePath ?? '').trim();
  if (prevPath && prevPath !== nextPath) {
    await deleteStorageObject('artist-covers', prevPath);
  }

  await prisma.artistProfile.update({
    where: { ownerUserId: profile.ownerUserId },
    data: { coverImagePath: nextPath },
  });

  revalidateTag(CACHE_TAGS.ARTIST_PROFILE, CACHE_LIFE.USER);
  return { success: true };
}

export async function deleteArtistCoverImage() {
  const profile = await getOwnedProfileOrThrow();
  const prevPath = (profile.coverImagePath ?? '').trim();

  if (prevPath) {
    await deleteStorageObject('artist-covers', prevPath);
  }

  await prisma.artistProfile.update({
    where: { ownerUserId: profile.ownerUserId },
    data: { coverImagePath: '' },
  });

  revalidateTag(CACHE_TAGS.ARTIST_PROFILE, CACHE_LIFE.USER);
  return { success: true };
}

export async function deleteArtistEventThumbnail(eventId: string) {
  const profile = await getOwnedProfileOrThrow();
  const id = eventId?.trim();
  if (!id) throw new Error('eventId is required.');

  const existing = await prisma.artistEvent.findUnique({
    where: { id },
    select: { artistProfileId: true, imagePath: true },
  });
  if (!existing) return;
  if (existing.artistProfileId !== profile.id) throw new Error('Forbidden.');

  const prevPath = (existing.imagePath ?? '').trim();
  if (prevPath) {
    await deleteStorageObject('artist-event-thumbs', prevPath);
  }

  await prisma.artistEvent.update({
    where: { id },
    data: { imagePath: '' },
  });

  revalidateTag(CACHE_TAGS.ARTIST_EVENTS, CACHE_LIFE.USER);
  return { success: true };
}
