import { ThrottlerModuleOptions } from '@nestjs/throttler';

/**
 * Workspace-standard `ThrottlerModule` config: two named tiers.
 *
 *   - `global`: 500 req / 15 min — applies to every route.
 *   - `write`:  60 req / 1 min   — applies to POST/PUT/PATCH/DELETE.
 *                                  GET handlers opt out per-handler via
 *                                  `@SkipThrottle({ write: true })`.
 *
 * ```ts
 * // in app.module.ts
 * @Module({
 *   imports: [
 *     ThrottlerModule.forRoot(workspaceThrottlerConfig()),
 *   ],
 *   providers: [
 *     { provide: APP_GUARD, useClass: ThrottlerGuard },
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
export function workspaceThrottlerConfig(): ThrottlerModuleOptions {
  return [
    { name: 'global', ttl: 15 * 60 * 1000, limit: 500 },
    { name: 'write', ttl: 60 * 1000, limit: 60 },
  ];
}
