'use client';

/* ── Reusable Error Boundary UI ──
 * Used by Next.js error.tsx files at layout boundaries.
 * Captures errors via Sentry and provides a user-friendly recovery UI.
 *
 * Usage in src/app/error.tsx:
 *   'use client';
 *   import { ErrorBoundary } from '@/components/error-boundary';
 *   export default function RootError({ error, reset }) {
 *     return <ErrorBoundary error={error} reset={reset} context="Application" />;
 *   }
 *
 * Requires: @sentry/nextjs (optional — remove Sentry import if not using)
 */

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
  /** Context label for logging (e.g. "Dashboard", "Admin Pipeline") */
  context?: string;
}

export function ErrorBoundary({ error, reset, context = 'Application' }: ErrorBoundaryProps) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { boundary: context },
    });
  }, [error, context]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
      <div className="max-w-md space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          Something went wrong
        </h2>
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred in {context.toLowerCase()}. Our team has been notified.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
