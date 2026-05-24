# rail-nest-common

Shared NestJS infrastructure for the rail-projects workspace. One canonical implementation of the guards / filters / pipes / decorators that every backend in the family was previously copy-pasting.

## What it gives you

- **`@Public()`** decorator + `IS_PUBLIC_KEY` — mark a handler or controller as exempt from `ApiKeyGuard`.
- **`ApiKeyGuard`** — timing-safe `x-api-key` check with dev-mode passthrough when the configured env var is unset. Handles array-typed and whitespace-padded header values.
- **`Neo4jExceptionFilter`** — global error filter producing the workspace-standard `{ error, detail? }` response shape. Maps Neo4j connection/timeout errors to 503, all other unhandled to 500, ValidationPipe array messages flattened. `detail` only in non-production.
- **`createValidationPipe()`** — factory returning `new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true })`. Pass `extra` to override.
- **`workspaceThrottlerConfig()`** — two named tiers (`global` 500/15min, `write` 60/min) as a `ThrottlerModuleOptions` value.
- **`NestCommonModule.forRoot({ apiKeyEnvVar? })`** — wires `ApiKeyGuard` with the env var name your service uses (defaults to `API_SECRET_KEY`).

## Install (workspace `file:` ref)

```jsonc
// in <consumer>/api/package.json
"dependencies": {
  "rail-nest-common": "file:../../rail-projects/packages/nest-common"
}
```

The `prepare` script means `npm install` rebuilds `dist/` automatically. Both repos need to be checked out as siblings under `~/Developer/` per the workspace standard layout.

## Use

```ts
// app.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiKeyGuard,
  NestCommonModule,
  workspaceThrottlerConfig,
} from 'rail-nest-common';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot(workspaceThrottlerConfig()),
    NestCommonModule.forRoot(),          // uses API_SECRET_KEY
    // or: NestCommonModule.forRoot({ apiKeyEnvVar: 'API_KEY' }),
  ],
  providers: [
    { provide: APP_GUARD, useClass: ApiKeyGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
```

```ts
// main.ts
import { NestFactory } from '@nestjs/core';
import { Neo4jExceptionFilter, createValidationPipe } from 'rail-nest-common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new Neo4jExceptionFilter());
  app.useGlobalPipes(createValidationPipe());
  await app.listen(3000);
}
bootstrap();
```

```ts
// any.controller.ts
import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from 'rail-nest-common';

@Controller()
export class HealthController {
  @Get('health')
  @Public()
  @SkipThrottle({ write: true })
  health() {
    return { ok: true };
  }
}
```

## Build / distribution

Plain `tsc` (no `ng-packagr` — pure NestJS, no Angular components). Output goes to `dist/` with `.js` + `.d.ts`. Consumers `file:`-ref the package root; `main`/`types` in `package.json` point at `dist/`.

```bash
npm install   # also runs `npm run build` via the prepare script
npm run build # tsc -p tsconfig.json
```

## Related

- [`rail-id-client`](https://github.com/Nev433/rail-id-client) — sibling shared package (Rail-ID-Service HTTP client). Same `file:` ref distribution shape.
- Workspace [CLAUDE.md "NestJS conventions"](../../CLAUDE.md#nestjs-conventions) — documents the patterns this package implements.
