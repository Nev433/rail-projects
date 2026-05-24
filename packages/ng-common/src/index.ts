// Public API surface for the rail-projects shared Angular package.
//
// Intentionally minimal: only pure types and a pure helper function.
// No runtime Angular or rxjs imports, so the package can be symlinked
// across multiple consumers without the dual-instance type/class
// identity problems that bit rail-nest-common's @nestjs/core shadow.
//
// Each consumer's `error.interceptor.ts` is a thin 6–10 line file
// that imports both `ApiError` and `formatHttpError` and wires them
// into a project-specific `HttpInterceptorFn`. The interceptor stays
// at the consumer level so app-specific side-effects (toastr,
// router redirects, telemetry) remain visible at the call site.

export { ApiError } from './api-error';
export { formatHttpError } from './format-http-error';
