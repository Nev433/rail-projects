import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

const NEO4J_CONNECTION_CODES = new Set([
  'ServiceUnavailable',
  'SessionExpired',
  'Neo.TransientError.General.DatabaseUnavailable',
]);

/**
 * Workspace-standard exception filter for the rail-projects family.
 * Normalises every error response to `{ error: string, detail?: string }`
 * — the shape every workspace Angular client's `errorInterceptor`
 * expects.
 *
 *   - `HttpException` → keeps its status; body normalised so that
 *     ValidationPipe array-of-messages collapses to a comma-separated
 *     string. 5xx responses also log the stack.
 *   - Neo4j connection / timeout errors → 503 Service Unavailable.
 *   - All other unhandled errors → 500 Internal Server Error.
 *   - `detail` field included only in non-production for safer
 *     debugging.
 *
 * Register globally in `main.ts`:
 *
 * ```ts
 * app.useGlobalFilters(new Neo4jExceptionFilter());
 * ```
 */
@Catch()
export class Neo4jExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(Neo4jExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const isProd = process.env.NODE_ENV === 'production';

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      let errorMessage: string;
      if (typeof res === 'string') {
        errorMessage = res;
      } else if (res && typeof res === 'object') {
        const body = res as { message?: unknown; error?: string };
        const msg = body.message;
        if (Array.isArray(msg)) {
          errorMessage = msg.join(', ');
        } else if (typeof msg === 'string') {
          errorMessage = msg;
        } else {
          errorMessage = body.error ?? exception.message;
        }
      } else {
        errorMessage = exception.message;
      }
      if (status >= 500) {
        this.logger.error(errorMessage, exception.stack);
      }
      response.status(status).json({ error: errorMessage });
      return;
    }

    const err = exception as { code?: string; message?: string; stack?: string } | null | undefined;
    const message = err?.message ?? String(exception);
    const isConnectionError =
      (err?.code && NEO4J_CONNECTION_CODES.has(err.code)) ||
      message.includes('ECONNREFUSED') ||
      message.includes('WebSocket') ||
      message.includes('connect ETIMEDOUT');

    const status = isConnectionError ? 503 : 500;
    this.logger.error(message, err?.stack);

    const body: { error: string; detail?: string } = {
      error: isConnectionError
        ? 'Database temporarily unavailable'
        : 'Internal server error',
    };
    if (!isProd) body.detail = message;
    response.status(status).json(body);
  }
}
