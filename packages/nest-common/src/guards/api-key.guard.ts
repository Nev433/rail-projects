import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { timingSafeEqual } from 'crypto';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * DI token holding the name of the env var that carries the shared API
 * key. Wired in via `NestCommonModule.forRoot({ apiKeyEnvVar })`.
 */
export const API_KEY_ENV_VAR_TOKEN = 'RAIL_NEST_COMMON_API_KEY_ENV_VAR';

/** Default env var name. Workspace convention. */
export const DEFAULT_API_KEY_ENV_VAR = 'API_SECRET_KEY';

/**
 * Workspace-standard API-key gate, ported from the audited canonical
 * variant in railML-Infrastructure:
 *
 *   - Reads the `x-api-key` request header.
 *   - Coerces array-typed headers (Express sometimes gives `string[]`)
 *     and trims whitespace.
 *   - Compares against the configured key with `timingSafeEqual` so
 *     timing attacks can't leak the key length character-by-character.
 *   - Dev-mode passthrough: if the configured env var is unset, logs a
 *     single warning and allows every request. Lets local development
 *     run without ceremony.
 *
 * Apply at the app-level as a global guard:
 *
 * ```ts
 * @Module({
 *   imports: [NestCommonModule.forRoot()],
 *   providers: [{ provide: APP_GUARD, useClass: ApiKeyGuard }],
 * })
 * export class AppModule {}
 * ```
 *
 * Decorate specific handlers/controllers with `@Public()` to bypass.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(
    @Inject(API_KEY_ENV_VAR_TOKEN) private readonly apiKeyEnvVar: string,
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const rawKey: string | string[] | undefined = req.headers['x-api-key'];
    const validKey = this.config.get<string>(this.apiKeyEnvVar);

    if (!validKey) {
      if (this.config.get<string>('NODE_ENV') === 'production') {
        this.logger.error(
          `${this.apiKeyEnvVar} is not set in production — refusing all requests`,
        );
        throw new UnauthorizedException(
          'Server misconfiguration: API key not configured',
        );
      }
      this.logger.warn(
        `${this.apiKeyEnvVar} is not set — all requests are unauthenticated (dev mode)`,
      );
      return true;
    }

    const supplied = Buffer.from(
      (Array.isArray(rawKey) ? rawKey[0] : (rawKey ?? '')).trim(),
    );
    const expected = Buffer.from(validKey.trim());

    if (
      supplied.length !== expected.length ||
      !timingSafeEqual(supplied, expected)
    ) {
      throw new UnauthorizedException('Unauthorized: Invalid API Key');
    }

    return true;
  }
}
