import { DynamicModule, Module } from '@nestjs/common';
import {
  API_KEY_ENV_VAR_TOKEN,
  DEFAULT_API_KEY_ENV_VAR,
} from '../guards/api-key.guard';

export interface NestCommonModuleOptions {
  /**
   * Name of the env var (read via `ConfigService`) that holds the
   * shared API key. Defaults to `API_SECRET_KEY` — the workspace
   * convention. Override for projects on a different key
   * (railML-Infrastructure uses `API_KEY` for legacy reasons).
   */
  apiKeyEnvVar?: string;
}

/**
 * Configures and exposes the workspace's shared NestJS infrastructure.
 *
 * ```ts
 * @Module({
 *   imports: [
 *     ConfigModule.forRoot({ isGlobal: true }),
 *     ThrottlerModule.forRoot(workspaceThrottlerConfig()),
 *     NestCommonModule.forRoot(),
 *     // feature modules...
 *   ],
 *   providers: [
 *     { provide: APP_GUARD, useClass: ApiKeyGuard },
 *     { provide: APP_GUARD, useClass: ThrottlerGuard },
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * The `Neo4jExceptionFilter` and `createValidationPipe()` registrations
 * happen in `main.ts`, not via this module — they're per-app-instance
 * concerns, not per-module-import.
 */
@Module({})
export class NestCommonModule {
  static forRoot(options: NestCommonModuleOptions = {}): DynamicModule {
    return {
      module: NestCommonModule,
      // Global so the API_KEY_ENV_VAR_TOKEN is visible to ApiKeyGuard
      // wherever the consumer instantiates it (typically via
      // { provide: APP_GUARD, useClass: ApiKeyGuard } in AppModule's
      // own providers). Don't list ApiKeyGuard here — instantiating it
      // in NestCommonModule's scope hides Reflector / ConfigService
      // from its constructor and Nest's DI resolver fails at startup.
      global: true,
      providers: [
        {
          provide: API_KEY_ENV_VAR_TOKEN,
          useValue: options.apiKeyEnvVar ?? DEFAULT_API_KEY_ENV_VAR,
        },
      ],
      exports: [API_KEY_ENV_VAR_TOKEN],
    };
  }
}
