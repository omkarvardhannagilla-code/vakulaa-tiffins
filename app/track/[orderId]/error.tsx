'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function TrackError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Track page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center p-8 text-center">
      <div className="text-5xl mb-4">🛵💨</div>
      <h2 className="font-display text-2xl text-brand-forest mb-2">Couldn&apos;t load tracking</h2>
      <p className="text-gray-500 text-sm mb-4 max-w-sm">
        Something went wrong while loading this order&apos;s tracker.
      </p>
      {error?.message && (
        <p className="text-xs text-gray-400 mb-6 max-w-sm break-words font-mono">{error.message}</p>
      )}
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="bg-brand-forest text-white rounded-xl px-5 py-3 text-sm font-semibold"
        >
          Try again
        </button>
        <Link
          href="/orders"
          className="border-2 border-brand-forest text-brand-forest rounded-xl px-5 py-3 text-sm font-semibold"
        >
          All Orders
        </Link>
      </div>
    </div>
  );
}
