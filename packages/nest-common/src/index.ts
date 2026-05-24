// Public API surface for the rail-projects shared NestJS package.

export {
  Public,
  IS_PUBLIC_KEY,
} from './decorators/public.decorator';

export {
  ApiKeyGuard,
  API_KEY_ENV_VAR_TOKEN,
  DEFAULT_API_KEY_ENV_VAR,
} from './guards/api-key.guard';

export { Neo4jExceptionFilter } from './filters/neo4j-exception.filter';

export { createValidationPipe } from './factories/validation-pipe';
export { workspaceThrottlerConfig } from './factories/throttler';

export {
  NestCommonModule,
  type NestCommonModuleOptions,
} from './module/nest-common.module';
