import type { HttpErrorResponse } from '@angular/common/http';

/**
 * Extract a single human-readable string from an `HttpErrorResponse`.
 *
 * Follows the **workspace API error shape** the Nest backends produce
 * via `Neo4jExceptionFilter` (in `rail-nest-common`):
 *
 * ```json
 * { "error": "Invalid input",                          // short summary
 *   "detail": "createEntity: lat must be a number" }   // optional, dev-only
 * ```
 *
 * Joining strategy:
 *
 * 1. If `body.error` and `body.detail` are both present, join them
 *    with an em-dash.
 * 2. Otherwise use whichever is present.
 * 3. Fall back to `body.message` (for non-workspace APIs that return
 *    `{ message: '...' }`).
 * 4. Fall back to the HTTP status line (`'HTTP 404: Not Found'`).
 *
 * **Type-only `@angular/common/http` import** — this function compiles
 * to plain JavaScript with no Angular runtime imports, so it can be
 * called from any TypeScript code that has the type available
 * (interceptors, tests, even non-Angular tooling that happens to have
 * the type).
 */
export function formatHttpError(err: HttpErrorResponse): string {
  const body = (err.error ?? {}) as {
    error?: unknown;
    detail?: unknown;
    message?: unknown;
  };

  const parts = [body.error, body.detail]
    .filter((v): v is string => typeof v === 'string' && v.length > 0);

  if (parts.length > 0) {
    return parts.join(' — ');
  }

  if (typeof body.message === 'string' && body.message.length > 0) {
    return body.message;
  }

  return `HTTP ${err.status}: ${err.statusText || 'Unknown error'}`;
}
