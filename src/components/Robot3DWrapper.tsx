'use client';

import dynamic from 'next/dynamic';

const Robot3D = dynamic(() => import('@/components/Robot3D').then(m => ({ default: m.Robot3D })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] lg:h-[600px] flex items-center justify-center text-[var(--muted)] text-xs uppercase tracking-wider">
      Loading...
    </div>
  ),
});

export function Robot3DWrapper() {
  return <Robot3D />;
}
