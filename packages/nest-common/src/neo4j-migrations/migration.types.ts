/**
 * Shape of a single Cypher migration.
 *
 * Each consumer authors one file per migration and registers an array
 * of them when importing the module:
 *
 * ```ts
 * Neo4jMigrationsModule.forRoot({
 *   migrations: [
 *     { version: 1, name: 'constraints', up: constraintsUp },
 *     { version: 2, name: 'seed_categories', up: seedCategoriesUp },
 *   ],
 * })
 * ```
 *
 * Conventions:
 *
 * - **`version`** is a monotonically increasing positive integer. Gaps are
 *   allowed but discouraged; the runner orders by version ascending. Never
 *   reuse or reorder versions once shipped.
 * - **`name`** is a short snake_case label used in logs and the
 *   `:_RailMigration {name}` property. It's for humans, not a key.
 * - **`up`** receives the open `Session` and runs whatever Cypher it needs.
 *   It's wrapped in `session.executeWrite(...)` by the runner, so any
 *   side-effect within it is part of the migration's transaction.
 * - There is **no `down`** by design. Neo4j has no transactional DDL
 *   rollback, schema migrations are typically forward-only, and a "down"
 *   that's wrong is worse than no down at all. If a migration needs
 *   correction, ship a forward migration that fixes it.
 */
export interface Neo4jMigration {
  /** Monotonically increasing positive integer. */
  version: number;
  /** Short snake_case label for logs and the audit node. */
  name: string;
  /**
   * Runs the migration. Receives the active session's executeWrite tx.
   *
   * @param tx — a Neo4j managed transaction. Use `await tx.run(cypher, params)`.
   */
  up: (tx: import('neo4j-driver').ManagedTransaction) => Promise<void>;
}

/** Per-migration audit record returned by `status()` / `history()`. */
export interface AppliedMigration {
  version: number;
  name: string;
  appliedAt: string; // ISO timestamp
}

/** Summary returned by `status()`. */
export interface MigrationStatus {
  applied: AppliedMigration[];
  pending: Array<Pick<Neo4jMigration, 'version' | 'name'>>;
}

/** Result of a single `migrate()` call. */
export interface MigrateResult {
  appliedNow: Array<Pick<Neo4jMigration, 'version' | 'name'>>;
  alreadyApplied: AppliedMigration[];
}
