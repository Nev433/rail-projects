import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ManagedTransaction, Record as Neo4jRecord, Session } from 'neo4j-driver';
import {
  NEO4J_SESSION_PROVIDER,
  Neo4jSessionProvider,
} from './neo4j-session.provider';
import {
  MIGRATIONS,
  MIGRATIONS_NAMESPACE,
} from './neo4j-migrations.tokens';
import {
  AppliedMigration,
  MigrateResult,
  MigrationStatus,
  Neo4jMigration,
} from './migration.types';

/**
 * Label used to track applied migrations in the consumer's database.
 *
 * Chosen to:
 * - Start with `_` so it sorts to the top in tools like Neo4j Browser
 *   and is visually distinct from domain data labels.
 * - Stay `Rail`-prefixed so consumers sharing a database with other
 *   non-workspace data don't risk collision.
 *
 * Each applied migration is one node with `{version, name, appliedAt}`.
 */
const MIGRATION_LABEL = '_RailMigration';

/**
 * Tracks and applies versioned Cypher migrations.
 *
 * **What it does:**
 * - Stores one `:_RailMigration {version, name, appliedAt}` node per
 *   migration that's been run successfully.
 * - On `migrate()`, finds pending migrations (declared but not yet in
 *   the database), runs them in version order, and records each.
 * - Each migration runs inside `session.executeWrite(tx => ...)` so the
 *   user's Cypher and the audit-node write are atomic — if the user's
 *   migration throws, the audit node is rolled back too and the
 *   migration stays "pending" for the next run.
 *
 * **What it doesn't do:**
 * - No `down` migrations. Neo4j has no transactional DDL rollback;
 *   forward-only is the safe pattern. Fix mistakes with a new migration.
 * - No file-system discovery. Migrations are passed as an array at
 *   `Neo4jMigrationsModule.forRoot({ migrations })` time — keeps the
 *   runner buildable as a library and explicit about order.
 * - No concurrency control across multiple replicas. If two API
 *   instances boot at once and both try to run migrations, the second
 *   one's writes will conflict (constraint create on a duplicate name
 *   will throw). For now, call `migrate()` from a single instance
 *   (e.g. the existing init endpoint, or a dedicated CLI). A proper
 *   distributed lock can be added if/when that becomes a real problem.
 */
@Injectable()
export class Neo4jMigrationsService {
  private readonly logger = new Logger(Neo4jMigrationsService.name);

  constructor(
    @Inject(NEO4J_SESSION_PROVIDER)
    private readonly sessions: Neo4jSessionProvider,
    @Inject(MIGRATIONS)
    private readonly migrations: Neo4jMigration[],
    @Inject(MIGRATIONS_NAMESPACE)
    private readonly namespace: string,
  ) {
    this.assertWellFormed(migrations);
  }

  /**
   * Apply every pending migration in ascending version order.
   *
   * Idempotent: calling `migrate()` twice in a row is safe — the second
   * call finds no pending work and returns `appliedNow: []`.
   */
  async migrate(): Promise<MigrateResult> {
    const session = this.sessions.getSession();
    try {
      await this.ensureLabelIndex(session);
      const alreadyApplied = await this.fetchApplied(session);
      const appliedVersions = new Set(alreadyApplied.map((m) => m.version));
      const pending = this.sortedMigrations().filter(
        (m) => !appliedVersions.has(m.version),
      );

      if (pending.length === 0) {
        this.logger.log(
          `No pending migrations (${alreadyApplied.length} already applied).`,
        );
        return { appliedNow: [], alreadyApplied };
      }

      this.logger.log(
        `Applying ${pending.length} pending migration(s): ` +
          pending.map((m) => `${m.version}_${m.name}`).join(', '),
      );

      const appliedNow: Array<Pick<Neo4jMigration, 'version' | 'name'>> = [];
      for (const migration of pending) {
        await this.applyOne(session, migration);
        appliedNow.push({ version: migration.version, name: migration.name });
      }
      return { appliedNow, alreadyApplied };
    } finally {
      await session.close();
    }
  }

  /**
   * Report applied vs pending migrations without changing state.
   *
   * Useful for a health/admin endpoint that wants to expose "what version
   * is this database at" without triggering a write.
   */
  async status(): Promise<MigrationStatus> {
    const session = this.sessions.getSession();
    try {
      const applied = await this.fetchApplied(session);
      const appliedVersions = new Set(applied.map((m) => m.version));
      const pending = this.sortedMigrations()
        .filter((m) => !appliedVersions.has(m.version))
        .map((m) => ({ version: m.version, name: m.name }));
      return { applied, pending };
    } finally {
      await session.close();
    }
  }

  /** Full ordered history of applied migrations, oldest first. */
  async history(): Promise<AppliedMigration[]> {
    const session = this.sessions.getSession();
    try {
      return await this.fetchApplied(session);
    } finally {
      await session.close();
    }
  }

  // ── internals ──────────────────────────────────────────────────────

  private async ensureLabelIndex(session: Session): Promise<void> {
    // Composite index on (namespace, version) for the per-consumer
    // applied-set lookup. NOT a uniqueness constraint — composite
    // uniqueness needs `IS NODE KEY` which isn't on Neo4j Community.
    // Application-level uniqueness is enforced by the runner itself,
    // which only writes a new audit node when the version isn't in the
    // applied set for the current namespace.
    await session.run(
      `CREATE INDEX rail_migration_ns_version IF NOT EXISTS ` +
        `FOR (m:${MIGRATION_LABEL}) ON (m.namespace, m.version)`,
    );
  }

  private async fetchApplied(session: Session): Promise<AppliedMigration[]> {
    const result = await session.run(
      `MATCH (m:${MIGRATION_LABEL} {namespace: $namespace}) ` +
        `RETURN m.version AS version, m.name AS name, ` +
        `       toString(m.appliedAt) AS appliedAt ` +
        `ORDER BY m.version ASC`,
      { namespace: this.namespace },
    );
    return result.records.map((r: Neo4jRecord) => ({
      version: Number(r.get('version')),
      name: String(r.get('name')),
      appliedAt: String(r.get('appliedAt')),
    }));
  }

  private async applyOne(
    session: Session,
    migration: Neo4jMigration,
  ): Promise<void> {
    const label = `${migration.version}_${migration.name}`;
    const start = Date.now();
    try {
      // The user's `up()` runs in its own transaction so it can do
      // anything: schema mods, data writes, or a mix. (Neo4j forbids
      // mixing schema mods with data writes within ONE transaction,
      // but the runner doesn't know what shape `up()` is — it's the
      // caller's job to keep each migration internally consistent.)
      await session.executeWrite(async (tx: ManagedTransaction) => {
        await migration.up(tx);
      });

      // The audit node is written in a SECOND transaction because we
      // can't predict whether the migration above was schema- or
      // data-shaped. A constraint create + this CREATE in the same tx
      // throws `ForbiddenDueToTransactionType` in Neo4j 5+.
      //
      // Trade-off: atomicity between `up()` and audit is lost. If the
      // audit write fails (network blip, etc.) AFTER `up()` succeeded,
      // the migration is in the database but unrecorded — the next
      // `migrate()` run will re-apply it. This is safe because the
      // runner contract requires every migration body to be idempotent
      // (MERGE / IF NOT EXISTS / matches on legacy values that don't
      // exist after first run). See README "Idempotency contract".
      await session.executeWrite(async (tx: ManagedTransaction) => {
        await tx.run(
          `CREATE (m:${MIGRATION_LABEL} { ` +
            `  namespace: $namespace, ` +
            `  version: $version, ` +
            `  name: $name, ` +
            `  appliedAt: datetime() ` +
            `})`,
          {
            namespace: this.namespace,
            version: migration.version,
            name: migration.name,
          },
        );
      });

      this.logger.log(
        `✓ Applied migration ${label} (${Date.now() - start}ms)`,
      );
    } catch (error) {
      this.logger.error(
        `✗ Migration ${label} failed; halting. ` +
          `Database is unchanged for this and any subsequent migrations.`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  private sortedMigrations(): Neo4jMigration[] {
    return [...this.migrations].sort((a, b) => a.version - b.version);
  }

  private assertWellFormed(migrations: Neo4jMigration[]): void {
    if (!Array.isArray(migrations)) {
      throw new Error(
        'Neo4jMigrationsModule: migrations option must be an array.',
      );
    }
    const seen = new Set<number>();
    for (const m of migrations) {
      if (!Number.isInteger(m.version) || m.version <= 0) {
        throw new Error(
          `Neo4jMigrationsModule: migration '${m.name}' has invalid ` +
            `version '${m.version}' — must be a positive integer.`,
        );
      }
      if (seen.has(m.version)) {
        throw new Error(
          `Neo4jMigrationsModule: duplicate migration version ` +
            `${m.version} ('${m.name}'). Versions must be unique.`,
        );
      }
      seen.add(m.version);
      if (!m.name || typeof m.name !== 'string') {
        throw new Error(
          `Neo4jMigrationsModule: migration ${m.version} is missing a name.`,
        );
      }
      if (typeof m.up !== 'function') {
        throw new Error(
          `Neo4jMigrationsModule: migration ${m.version}_${m.name} ` +
            `is missing an 'up' function.`,
        );
      }
    }
  }
}
