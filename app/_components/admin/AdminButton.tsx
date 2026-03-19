'use client';

import { Suspense, lazy, useState } from 'react';
import type { ArtistEventPayload } from '@actions/artist';
import styles from './AdminButton.module.scss';

const AdminModalLazy = lazy(() => import('./AdminModal'));

export default function AdminButton({
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
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className={styles.button} type="button" onClick={() => setOpen(true)}>
        Admin
      </button>
      {open && (
        <Suspense
          fallback={
            <div className={styles.fallbackOverlay}>
              <div className={styles.fallbackModal}>
                <div className="skeleton" style={{ height: 26, width: 200, marginBottom: 16 }} />
                <div className="skeleton" style={{ height: 120, width: '100%', marginBottom: 16 }} />
                <div className="skeleton" style={{ height: 120, width: '100%', marginBottom: 16 }} />
              </div>
            </div>
          }
        >
          <AdminModalLazy
            onClose={() => setOpen(false)}
            initialDescription={initialDescription}
            initialCoverImagePath={initialCoverImagePath}
            initialTheme={initialTheme}
            initialEvents={initialEvents}
          />
        </Suspense>
      )}
    </>
  );
}

