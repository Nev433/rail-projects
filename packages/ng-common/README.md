# rail-ng-common

Shared Angular client infrastructure for the rail-projects workspace.

Intentionally tiny: two exports, no runtime dependencies on Angular or
rxjs. Consumers get a typed exception class and a message-extraction
helper; their own `error.interceptor.ts` does the rxjs plumbing so
each app's side-effects (toasts, redirects) stay visible at the
wire-up site.

## What it gives you

- **`ApiError`** — typed `Error` subclass with a `status` field and
  the original `HttpErrorResponse` preserved on `originalError`.
  Components can `instanceof ApiError` to branch on status codes
  without parsing strings.
- **`formatHttpError(err)`** — extracts a human-readable message from
  an `HttpErrorResponse` following the workspace API shape
  (`{ error, detail }` produced by `Neo4jExceptionFilter` in
  rail-nest-common).

## Install (workspace `file:` ref)

```jsonc
// in <consumer>/client-ng/package.json
"dependencies": {
  "rail-ng-common": "file:../../rail-projects/packages/ng-common"
}
```

`prepare` runs `tsc` only — no postinstall stripping, so consumer
installs are reliable even on first link. See "Build" below for the
manual strip the dev cycle still needs.

## Use

```ts
// error.interceptor.ts — six lines per consumer
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ApiError, formatHttpError } from 'rail-ng-common';

export { ApiError };

export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((err: HttpErrorResponse) =>
      throwError(() => new ApiError(err.status, formatHttpError(err), err)),
    ),
  );
```

Add side-effects inline (the pattern the Crew + StockCrewPlan clients
use):

```ts
// railML-Crew variant — toastr for 5xx
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const message = formatHttpError(err);
      if (err.status >= 500) toastr.error(message, 'Server error');
      return throwError(() => new ApiError(err.status, message, err));
    }),
  );
};
```

```ts
// component — branch on ApiError without parsing strings
import { ApiError } from './error.interceptor';   // re-exports from rail-ng-common

this.api.getEntities().subscribe({
  error: (err: unknown) => {
    if (err instanceof ApiError && err.status === 404) {
      this.notFound = true;
    } else if (err instanceof Error) {
      this.error = err.message;
    }
  },
});
```

## Why no `createErrorInterceptor` factory?

The first cut of this package shipped a `createErrorInterceptor(hooks?)`
factory so consumers could one-line their wire-up. Dropped because:

1. **rxjs runtime imports** — the factory had to `import { catchError,
   throwError } from 'rxjs'`. With the package's dev-installed rxjs
   shadowing the consumer's (via Node's symlink-realpath resolution),
   Angular CLI saw two rxjs instances and consumer builds emitted
   warnings or failed type-check.
2. **Hook indirection** — `createErrorInterceptor({ onServerError: …
   })` is *less* readable than the equivalent inline 8-line
   interceptor. Side-effects belong at the wire-up site where reviews
   happen.
3. **Type duplication** — `HttpInterceptorFn` returned by the package
   carried the package's `@angular/common` type declarations, which
   didn't structurally match the consumer's identical-but-distinct
   declarations.

Trade-off accepted: each consumer has a 6–10 line `error.interceptor.ts`
instead of a 3-line wrapper. In return: zero runtime deps, zero
class-identity risks, and the actual behaviour stays visible per app.

## Build

```bash
npm install               # installs deps + runs `prepare` (tsc)
npm run strip:deps        # MANUAL — removes node_modules/@angular before
                          # consumers install this package
```

The strip is mandatory before consumers reference this package. Without
it, the consumer's Angular compiler resolves `HttpErrorResponse` to two
different type declarations (one from `node_modules/@angular/common`,
one from `node_modules/rail-ng-common/node_modules/@angular/common`)
and fails type-check with "is not assignable" errors.

The strip is **not** in `prepare` because npm runs `prepare` on the
linked package the first time a consumer installs the file: ref —
and that re-run would try to `tsc` with no deps installed, failing the
install. Manual strip keeps the dev cycle reliable.

If you regenerate `node_modules` here and forget to re-strip, run:

```bash
npm install && npm run strip:deps
```

## Related

- [`rail-nest-common`](../nest-common) — sibling package for shared
  NestJS backend infrastructure (ApiKeyGuard, ValidationPipe,
  Neo4jMigrationsModule, etc.).
- [`rail-id-client`](https://github.com/Nev433/rail-id-client) —
  shared TypeScript HTTP client for Rail-ID-Service.
- Workspace [CLAUDE.md "Angular conventions"](../../CLAUDE.md#angular-conventions).
