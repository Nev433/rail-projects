import { ValidationPipe, ValidationPipeOptions } from '@nestjs/common';

/**
 * Workspace-standard `ValidationPipe` options. Use the strict shape by
 * default — `forbidNonWhitelisted` makes a typo in a request body fail
 * loudly instead of silently being ignored. Override with `extra` if a
 * specific service needs to relax it.
 *
 * ```ts
 * // in main.ts
 * app.useGlobalPipes(createValidationPipe());
 * // or with overrides:
 * app.useGlobalPipes(createValidationPipe({ disableErrorMessages: true }));
 * ```
 */
export function createValidationPipe(
  extra: Partial<ValidationPipeOptions> = {},
): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    ...extra,
  });
}
