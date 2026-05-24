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
 * - **`up`** receives the open `Session` directly — NOT a managed
 *   transaction. The migration decides its own transaction shape:
 *
 *   - **One-shot statements** (typical for DDL): `await session.run(ddl)`
 *     per statement. Each is its own auto-commit transaction, so you
 *     can `try/catch` around the call and recover (e.g. drop an
 *     orphan index that's blocking a named constraint, then retry).
 *   - **Atomic data writes**: wrap in
 *     `await session.executeWrite(async tx => { ... })`. Common for
 *     multi-step MERGE chains that must succeed-or-fail together.
 *
 *   Don't mix schema modifications and data writes inside one
 *   `executeWrite` block — Neo4j 5+ throws `ForbiddenDueToTransactionType`.
 *   Split them across two `executeWrite` calls or use `session.run`
 *   per statement.
 *
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
   * Runs the migration. Receives the open session — the runner owns
   * its lifecycle so don't call `.close()` on it.
   *
   * @param session — open `neo4j-driver` Session. Use `session.run`
   *                  for per-statement auto-commit OR
   *                  `session.executeWrite` for atomic groups.
   */
  up: (session: import('neo4j-driver').Session) => Promise<void>;
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
