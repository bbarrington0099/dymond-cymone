import Link from 'next/link';
import styles from './DiscographyWidget.module.scss';
import type { DiscographyPage } from '@actions/spotify';
import { getDiscographyPage } from '@actions/spotify';

function DiscographySkeleton() {
  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <div className="skeleton" style={{ height: 22, width: 180 }} />
        <div className="skeleton" style={{ height: 28, width: 130, borderRadius: 8 }} />
      </div>
      <div className={styles.grid}>
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className={styles.card}>
            <div className={styles.art} />
            <div className="skeleton" style={{ height: 16, width: '80%', marginTop: 10 }} />
            <div className="skeleton" style={{ height: 12, width: '60%', marginTop: 6 }} />
            <div className="skeleton" style={{ height: 12, width: '70%', marginTop: 6 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function DiscographyWidget({
  spotifyArtistId,
  page,
  pageSize = 5,
}: {
  spotifyArtistId: string;
  page: number;
  pageSize?: number;
}) {
  const data: DiscographyPage = await getDiscographyPage({
    spotifyArtistId,
    page,
    pageSize,
    tracksPerRelease: 3,
  });

  return (
    <section className={styles.widget} aria-label="Discography">
      <div className={styles.header}>
        <h2 className={styles.title}>Discography</h2>

        <div className={styles.pager}>
          {data.page > 1 ? (
            <Link className={styles.pagerBtn} href={`/?discographyPage=${data.page - 1}`}>
              Prev
            </Link>
          ) : (
            <span className={styles.pagerBtnDisabled}>Prev</span>
          )}
          <span className={styles.pagerText}>
            Page {data.page} / {Math.max(1, data.totalPages)}
          </span>
          {data.page < data.totalPages ? (
            <Link className={styles.pagerBtn} href={`/?discographyPage=${data.page + 1}`}>
              Next
            </Link>
          ) : (
            <span className={styles.pagerBtnDisabled}>Next</span>
          )}
        </div>
      </div>

      <div className={styles.grid}>
        {data.releases.map((release) => (
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
    </section>
  );
}

export { DiscographySkeleton };

