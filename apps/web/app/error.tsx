'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Structured logging lands here once observability is wired up (NFR).
    console.error(error);
  }, [error]);

  return (
    <>
      <h1>Something went wrong</h1>
      <p className="lede">
        This page could not be rendered. The underlying records are unaffected —
        nothing has been changed or lost.
      </p>
      <p>
        <button type="button" onClick={reset}>
          Try again
        </button>
      </p>
      {error.digest ? (
        <p style={{ color: 'var(--text-faint)', fontSize: '0.8125rem' }}>
          Reference: <code>{error.digest}</code>
        </p>
      ) : null}
    </>
  );
}
