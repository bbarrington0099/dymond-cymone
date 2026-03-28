import type { SpotifyTrackId } from '@lib/spotify';

export function capitalize(str: string): string {
	if (!str) return '';
	return str.charAt(0).toUpperCase() + str.slice(1);
}

export function camelCaseToWords(str: string): string {
	if (!str) return '';
	const result = str.replace(/([A-Z])/g, ' $1');
	return capitalize(result.trim());
}

export function pickRandomTrack(trackIds: SpotifyTrackId[]): string | null {
	if (!trackIds.length) return null;

	const trackPool: string[] = [];
	trackIds.forEach((track) => {
		const weight = track.weight && track.weight > 0 ? track.weight : 1;
		for (let i = 0; i < weight; i++) {
			trackPool.push(track.id);
		}
	});

	return trackPool[Math.floor(Math.random() * trackPool.length)] ?? null;
}

export function classes(
	...classNames: (string | boolean | undefined)[]
): string {
	return classNames.filter(Boolean).join(' ');
}

export function safeFileName(fileName: string) {
	return (fileName || '')
		.replace(/[^a-zA-Z0-9._-]/g, '_')
		.replace(/_+/g, '_')
		.slice(0, 140);
}