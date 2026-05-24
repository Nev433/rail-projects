/**
 * Typed exception thrown by the workspace's shared
 * `createErrorInterceptor`. Consumers can `instanceof ApiError` in
 * components and effects to branch on it without parsing strings.
 *
 * @example
 * ```ts
 * import { ApiError } from 'rail-ng-common';
 *
 * this.api.getEntities().subscribe({
 *   error: (err: unknown) => {
 *     if (err instanceof ApiError && err.status === 401) {
 *       this.router.navigate(['/login']);
 *     } else if (err instanceof Error) {
 *       this.toast.error(err.message);
 *     }
 *   },
 * });
 * ```
 *
 * The class is intentionally tiny — only what every consumer needs.
 * The original `HttpErrorResponse` is preserved on `originalError`
 * for callers that need raw access (response headers, etc.) without
 * giving up the typed status field.
 */
export class ApiError extends Error {
  /**
   * @param status — HTTP status code from the upstream response, or
   *                 `0` for network/CORS failures where no response
   *                 was received.
   * @param message — human-readable message (already formatted by
   *                  `formatHttpError` if you're using the factory).
   * @param originalError — the source `HttpErrorResponse`, kept for
   *                        consumers that need raw access.
   */
  constructor(
    public readonly status: number,
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
    // Restore prototype chain — needed when targeting ES5/ES2015 and
    // when this class is loaded across realms. Harmless on modern
    // runtimes that target ES2022.
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
