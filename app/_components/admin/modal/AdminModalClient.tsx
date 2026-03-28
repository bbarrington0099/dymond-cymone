'use client';

import { createPortal } from 'react-dom';
import { useEffect, useMemo, useState } from 'react';
import { AdminProps, AdminModal } from '@components/admin';

interface AdminModalProps {
  onClose: () => void;
  adminProps: AdminProps;
}
export function AdminModalClient(props: AdminModalProps) {
  const { 
    adminProps: {
      initialDescription,
      initialCoverImagePath,
      initialTheme,
      initialEvents,
      initialSpotifyTrackIds,
    }, onClose 
  } = props;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mounted, onClose]);

  return (
    mounted
      ? createPortal(
          <AdminModal 
            onClose={onClose}
            adminProps={{
              initialDescription,
              initialCoverImagePath,
              initialTheme,
              initialEvents,
              initialSpotifyTrackIds,
            }}
          />,
          document.body
        )
      : null
  );
}

