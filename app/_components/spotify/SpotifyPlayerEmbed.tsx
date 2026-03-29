import styles from './SpotifyPlayer.module.scss';

interface SpotifyPlayerEmbedProps {
    trackId: string;
}
export function SpotifyPlayerEmbed(props: SpotifyPlayerEmbedProps) {
    const { trackId } = props;

    return (
        <iframe
          title="Spotify track"
          src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator`}
          style={{ borderRadius: 12 }}
          width="100%"
          height={152}
          frameBorder={0}
          allowFullScreen
          allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className={styles.embed}
        />
    )
}