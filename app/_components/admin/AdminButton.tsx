'use client';

import { Suspense, lazy, useState } from 'react';
import { AdminProps, AdminModal, AdminButtonSkeleton } from '@components/admin';

import styles from './AdminButton.module.scss';

const AdminModalLazy = lazy(() => Promise.resolve({ default: AdminModal }));

interface AdminButtonProps {
  adminProps: AdminProps
}
export function AdminButton(props: AdminButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className={styles.button} type="button" onClick={() => setOpen(true)}>
        Admin
      </button>
      {open && (
        <Suspense
          fallback={
            <AdminButtonSkeleton />
          }
        >
          <AdminModalLazy
            onClose={() => setOpen(false)}
            adminProps={props.adminProps}
          />
        </Suspense>
      )}
    </>
  );
}

