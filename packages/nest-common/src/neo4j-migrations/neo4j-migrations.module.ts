import { DynamicModule, Module } from '@nestjs/common';
import {
  MIGRATIONS,
  MIGRATIONS_NAMESPACE,
} from './neo4j-migrations.tokens';
import { Neo4jMigrationsService } from './neo4j-migrations.service';
import { Neo4jMigration } from './migration.types';

export interface Neo4jMigrationsModuleOptions {
  /**
   * Per-consumer namespace under which this app's migrations are
   * tracked. **Required, no default** — the workspace standard is for
   * multiple backends to share a single Neo4j database (`gemini`), so
   * an unnamespaced `:_RailMigration` would conflate every backend's
   * version sequence. Use a stable kebab-case string that identifies
   * the consumer service: `'rail-id-service'`, `'rail-crew'`,
   * `'rail-timetable'`, etc.
   *
   * Audit nodes are stored as `(:_RailMigration {namespace, version,
   * name, appliedAt})` and all reads/writes filter by `namespace`.
   * Changing this value after deployment effectively "forgets" all
   * applied migrations under the old namespace — don't.
   */
  namespace: string;

  /**
   * Ordered list of migrations the runner should know about. The runner
   * applies any version that isn't already recorded in the database
   * under this namespace.
   *
   * Convention: keep one migration per file under
   * `api/src/init/migrations/`, named `<version>_<name>.ts`. Each
   * file `export default { version, name, up }`. Then in your module:
   *
   * ```ts
   * import m001 from './migrations/001_constraints';
   * import m002 from './migrations/002_seed_categories';
   *
   * Neo4jMigrationsModule.forRoot({
   *   namespace: 'rail-id-service',
   *   migrations: [m001, m002],
   * });
   * ```
   */
  migrations: Neo4jMigration[];
}

/**
 * Wires the `Neo4jMigrationsService` with a project-specific migration
 * list.
 *
 * **Prerequisite**: the consumer must also register their `Neo4jService`
 * against the `NEO4J_SESSION_PROVIDER` token. The cleanest way is in
 * the same module that owns `Neo4jService`:
 *
 * ```ts
 * // neo4j/neo4j.module.ts
 * import { Module, Global } from '@nestjs/common';
 * import { NEO4J_SESSION_PROVIDER } from 'rail-nest-common';
 * import { Neo4jService } from './neo4j.service';
 *
 * @Global()
 * @Module({
 *   providers: [
 *     Neo4jService,
 *     { provide: NEO4J_SESSION_PROVIDER, useExisting: Neo4jService },
 *   ],
 *   exports: [Neo4jService, NEO4J_SESSION_PROVIDER],
 * })
 * export class Neo4jModule {}
 * ```
 *
 * `useExisting` shares the consumer's existing `Neo4jService` singleton
 * — no duplicate driver, no second connection pool.
 */
@Module({})
export class Neo4jMigrationsModule {
  static forRoot(options: Neo4jMigrationsModuleOptions): DynamicModule {
    if (!options.namespace || typeof options.namespace !== 'string') {
      throw new Error(
        'Neo4jMigrationsModule.forRoot: `namespace` is required and ' +
          'must be a non-empty string. Use a stable kebab-case label ' +
          "for this consumer service, e.g. 'rail-id-service'.",
      );
    }
    return {
      module: Neo4jMigrationsModule,
      providers: [
        { provide: MIGRATIONS_NAMESPACE, useValue: options.namespace },
        { provide: MIGRATIONS, useValue: options.migrations },
        Neo4jMigrationsService,
      ],
      exports: [Neo4jMigrationsService],
    };
  }
}
