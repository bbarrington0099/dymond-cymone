import { Suspense } from 'react';
import ArtistAuthGate from './ArtistAuthGate';

function LoginSkeleton() {
  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <div className="skeleton" style={{ height: 32, width: 240, marginBottom: 16 }} />
      <div className="skeleton" style={{ height: 420, width: '100%' }} />
    </div>
  );
}

export default function ArtistPage() {
  return (
    <main style={{ padding: '2rem 1rem' }}>
      <Suspense fallback={<LoginSkeleton />}>
        <ArtistAuthGate />
      </Suspense>
    </main>
  );
}

