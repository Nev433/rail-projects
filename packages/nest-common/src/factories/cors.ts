/**
 * Parse a `CORS_ORIGIN` env value (comma-separated origin list) into a
 * trimmed array. Refuses to return `'*'` when `nodeEnv === 'production'`
 * so a misconfigured deploy fails fast at startup rather than silently
 * shipping wildcard CORS.
 *
 * Usage in a backend's `main.ts`:
 *
 * ```ts
 * const corsOrigins = resolveCorsOrigins(
 *   config.get<string>('CORS_ORIGIN'),
 *   'http://localhost:4200',
 *   config.get<string>('NODE_ENV'),
 * );
 * ```
 */
export function resolveCorsOrigins(
  raw: string | undefined | null,
  fallback: string,
  nodeEnv?: string,
): string[] {
  const origins = (raw ?? fallback)
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (nodeEnv === 'production' && origins.includes('*')) {
    throw new Error(
      "Refusing to start: CORS_ORIGIN='*' is not allowed when NODE_ENV=production",
    );
  }

  return origins;
}
