export type SpotifyTrackId = {
  id: string;
  weight: number;
};

export function isSpotifyTrackIdArray(data: unknown): data is SpotifyTrackId[] {
  return (
    Array.isArray(data) &&
    data.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        'id' in item &&
        'weight' in item &&
        typeof (item as { id: unknown }).id === 'string' &&
        typeof (item as { weight: unknown }).weight === 'number'
    )
  );
}
