import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key the `ApiKeyGuard` reads to decide whether a route
 * bypasses authentication. Exposed so consumers can write custom
 * guards that respect the same convention.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route handler (or a whole controller) as public — exempt
 * from the workspace-standard `ApiKeyGuard`. Use sparingly; reserved
 * for health checks and cross-service proxies that authenticate
 * server-to-server.
 */
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true);
