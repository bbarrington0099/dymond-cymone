'use client';

import { useState, useEffect, useRef } from 'react';
import { getDiscographyPage } from '@actions/spotify';
import type { SpotifyRelease } from '@actions/spotify';
import styles from './DiscographyWidget.module.scss';

const PAGE_SIZE = 5;

export default function DiscographyClient({
  spotifyArtistId,
}: {
  spotifyArtistId: string;
}) {
  const [releases, setReleases] = useState<SpotifyRelease[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getDiscographyPage({
      spotifyArtistId,
      page: 1,
      pageSize: PAGE_SIZE,
      tracksPerRelease: 3,
    }).then((result) => {
      if (!cancelled) {
        setReleases(result.releases);
        setTotalPages(Math.max(1, result.totalPages));
        setPage(1);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [spotifyArtistId]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || loading || page >= totalPages) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting || loadingMoreRef.current) return;
        const nextPage = page + 1;
        if (nextPage > totalPages) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
        getDiscographyPage({
          spotifyArtistId,
          page: nextPage,
          pageSize: PAGE_SIZE,
          tracksPerRelease: 3,
        }).then((result) => {
          setReleases((prev) => [...prev, ...result.releases]);
          setPage(nextPage);
          loadingMoreRef.current = false;
          setLoadingMore(false);
        }).catch(() => {
          loadingMoreRef.current = false;
          setLoadingMore(false);
        });
      },
      { rootMargin: '100px', threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [spotifyArtistId, page, totalPages, loading]);

  if (loading && releases.length === 0) {
    return (
      <section className={styles.widget} aria-label="Discography">
        <div className={styles.header}>
          <h2 className={styles.title}>Discography</h2>
        </div>
        <div className={styles.grid}>
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className={styles.card}>
              <div className={styles.art} />
              <div className="skeleton" style={{ height: 16, width: '80%', marginTop: 10 }} />
              <div className="skeleton" style={{ height: 12, width: '60%', marginTop: 6 }} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={styles.widget} aria-label="Discography">
      <div className={styles.header}>
        <h2 className={styles.title}>Discography</h2>
      </div>
      <div className={styles.grid}>
        {releases.map((release) => (
          <div key={release.id} className={styles.card}>
            <div className={styles.artWrap}>
              {release.albumArtUrl ? (
                <img
                  src={release.albumArtUrl}
                  alt={`${release.name} cover`}
                  className={styles.art}
                />
              ) : (
                <div className={styles.artFallback} />
              )}
            </div>
            <div className={styles.cardBody}>
              <a
                href={release.spotifyUrl}
                target="_blank"
                rel="noreferrer"
                className={styles.releaseLink}
              >
                {release.name}
              </a>
              <div className={styles.releaseType}>{release.releaseType}</div>
              <ul className={styles.tracks}>
                {release.tracks.map((t) => (
                  <li key={t.id} className={styles.trackItem}>
                    <a
                      href={t.spotifyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.trackLink}
                    >
                      {t.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
      {page < totalPages && (
        <div ref={sentinelRef} className={styles.sentinel}>
          {loadingMore && (
            <div className={styles.loadingMore}>
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className={styles.card}>
                  <div className={styles.art} />
                  <div className="skeleton" style={{ height: 16, width: '80%', marginTop: 10 }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
