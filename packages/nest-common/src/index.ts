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
export { resolveCorsOrigins } from './factories/cors';

export {
  NestCommonModule,
  type NestCommonModuleOptions,
} from './module/nest-common.module';

// ── Neo4j migrations ────────────────────────────────────────────────
export {
  Neo4jMigrationsModule,
  type Neo4jMigrationsModuleOptions,
} from './neo4j-migrations/neo4j-migrations.module';

export { Neo4jMigrationsService } from './neo4j-migrations/neo4j-migrations.service';

export {
  NEO4J_SESSION_PROVIDER,
  type Neo4jSessionProvider,
} from './neo4j-migrations/neo4j-session.provider';

export type {
  Neo4jMigration,
  AppliedMigration,
  MigrationStatus,
  MigrateResult,
} from './neo4j-migrations/migration.types';
