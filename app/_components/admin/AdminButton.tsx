'use client';

import { Suspense, lazy, useState } from 'react';
import { AdminProps, AdminModal, AdminButtonSkeleton } from '@components/admin';
import { Button } from '@components/controls';

const AdminModalLazy = lazy(() => Promise.resolve({ default: AdminModal }));

interface AdminButtonProps {
  adminProps: AdminProps
}
export function AdminButton(props: AdminButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button 
        type="button" 
        onClick={() => setOpen(true)}
        content="Admin"
      />
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

