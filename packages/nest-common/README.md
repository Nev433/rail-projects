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
npm run build # tsc -p tsconfig.json && postbuild:cleanup
```

### The `postbuild:cleanup` step (important)

After `tsc`, the build script deletes the package's own runtime peer-dep
copies from its `node_modules/`:

```
node_modules/@nestjs/   node_modules/express/
node_modules/rxjs/      node_modules/reflect-metadata/
```

This is required because the consumer's `node_modules/rail-nest-common` is
a **symlink** to this package. By default Node resolves the symlink to its
real path and walks UP from there when a `require()` inside the package
(e.g. `require('@nestjs/core')`) needs to be resolved. If this package's
own `node_modules` still has `@nestjs/core`, that copy is found first —
producing a **different `Reflector` class identity** from the consumer's
`@nestjs/core`. Nest DI then fails at startup with

> Nest can't resolve dependencies of the ApiKeyGuard ... argument
> Reflector at index [1] is available in the AppModule module

Deleting the dupes is half the fix. The consumer **also** has to start
Node with `--preserve-symlinks` so resolution walks up from the consumer's
tree (where the real peer-dep copies live). The workspace
[`scripts/ecosystem.config.js`](../../scripts/ecosystem.config.js) sets
`NODE_OPTIONS=--preserve-symlinks` on every API process for this reason.
A standalone consumer running `node dist/main` needs the same flag.

If you regenerate `node_modules` here and skip the cleanup, every backend
will crash at startup with the error above. The build script runs the
cleanup automatically — don't bypass it.

## Related

- [`rail-id-client`](https://github.com/Nev433/rail-id-client) — sibling shared package (Rail-ID-Service HTTP client). Same `file:` ref distribution shape.
- Workspace [CLAUDE.md "NestJS conventions"](../../CLAUDE.md#nestjs-conventions) — documents the patterns this package implements.
