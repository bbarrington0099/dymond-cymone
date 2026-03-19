'use client';

import Script from 'next/script';
import { useEffect, useState, useCallback, useRef } from 'react';
import { getSpotifyPlaybackToken } from '@actions/spotify';
import styles from './SpotifyPlayer.module.scss';

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: {
      Player: new (config: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
      }) => {
        connect: () => Promise<boolean>;
        addListener: (event: string, fn: (args?: unknown) => void) => void;
        disconnect: () => void;
        removeListener: (event: string) => void;
      };
    };
  }
}

type PlayerInstance = InstanceType<NonNullable<typeof window.Spotify>['Player']>;

export default function SpotifyPlayer({
  spotifyPlaylistId,
}: {
  spotifyPlaylistId: string;
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'sdk' | 'embed' | 'error'>('idle');
  const [needSdkScript, setNeedSdkScript] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const playerRef = useRef<PlayerInstance | null>(null);
  const tokenRef = useRef<string | null>(null);

  const playPlaylist = useCallback(
    async (accessToken: string, deviceId: string) => {
      const contextUri = `spotify:playlist:${spotifyPlaylistId}`;
      const base = 'https://api.spotify.com/v1/me/player';
      const headers = { Authorization: `Bearer ${accessToken}` };

      await fetch(`${base}/shuffle?state=true&device_id=${deviceId}`, {
        method: 'PUT',
        headers,
      });
      await fetch(`${base}/repeat?state=context&device_id=${deviceId}`, {
        method: 'PUT',
        headers,
      });
      const playRes = await fetch(`${base}/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ context_uri: contextUri }),
      });
      if (!playRes.ok) {
        const t = await playRes.text();
        throw new Error(`Playback failed: ${playRes.status} ${t}`);
      }
    },
    [spotifyPlaylistId]
  );

  const initPlayer = useCallback(
    (accessToken: string) => {
      if (!window.Spotify || playerRef.current) return;
      const p = new window.Spotify.Player({
        name: 'Artist Site Player',
        getOAuthToken: (cb) => cb(accessToken),
        volume: 0.7,
      });

      p.addListener('ready', ((args: { device_id?: string }) => {
        const device_id = args?.device_id;
        if (device_id && accessToken) {
          playPlaylist(accessToken, device_id).catch((err) => {
            console.error('Failed to start playback:', err);
            setErrorMsg('Could not start playback. Ensure you have Spotify Premium.');
            setStatus('error');
          });
        }
      }) as (args?: unknown) => void);

      p.addListener('not_ready', () => {});
      p.addListener('authentication_error', () => {
        setErrorMsg('Spotify authentication expired. Please reconnect.');
        setStatus('error');
      });
      p.addListener('account_error', () => {
        setErrorMsg('Spotify Premium required for in-page playback.');
        setStatus('error');
      });

      p.connect().then((success) => {
        if (!success) {
          setErrorMsg('Could not connect to Spotify.');
          setStatus('error');
        } else {
          setStatus('sdk');
        }
      });
      playerRef.current = p;
    },
    [playPlaylist]
  );

  useEffect(() => {
    if (!spotifyPlaylistId || status !== 'idle') return;

    let cancelled = false;
    setStatus('loading');

    getSpotifyPlaybackToken().then((result) => {
      if (cancelled) return;
      if (result?.accessToken) {
        tokenRef.current = result.accessToken;
        if (window.Spotify) {
          initPlayer(result.accessToken);
        } else {
          window.onSpotifyWebPlaybackSDKReady = () => {
            const token = tokenRef.current;
            if (token && window.Spotify) initPlayer(token);
          };
          setNeedSdkScript(true);
        }
      } else {
        setStatus('embed');
      }
    });

    return () => {
      cancelled = true;
      window.onSpotifyWebPlaybackSDKReady = undefined;
    };
  }, [spotifyPlaylistId, status, initPlayer]);

  useEffect(() => {
    return () => {
      playerRef.current?.disconnect();
      playerRef.current = null;
    };
  }, []);

  if (!spotifyPlaylistId) return null;

  const embedSection = (
    <section className={styles.player} aria-label="Listen">
      <h2 className={styles.title}>Listen</h2>
      <div className={styles.embedWrap}>
        {errorMsg && <p className={styles.error}>{errorMsg}</p>}
        <iframe
          title="Spotify playlist"
          src={`https://open.spotify.com/embed/playlist/${spotifyPlaylistId}?utm_source=generator`}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className={styles.embed}
        />
      </div>
    </section>
  );

  if (status === 'embed' || status === 'error') return embedSection;

  return (
    <>
      {needSdkScript && (
        <Script
          src="https://sdk.scdn.co/spotify-player.js"
          strategy="afterInteractive"
          onLoad={() => {
            if (window.onSpotifyWebPlaybackSDKReady) {
              window.onSpotifyWebPlaybackSDKReady();
            } else if (tokenRef.current && window.Spotify) {
              initPlayer(tokenRef.current);
            }
          }}
        />
      )}
      <section className={styles.player} aria-label="Listen">
        <h2 className={styles.title}>Listen</h2>
        {(status === 'loading' || status === 'sdk') && (
          <div className={styles.sdkWrap}>
            <p className={styles.sdkStatus}>
              {status === 'loading' ? 'Connecting to Spotify…' : 'Playing…'}
            </p>
            <p className={styles.sdkHint}>
              Requires Spotify Premium. Use Spotify Connect for playback controls.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
