import type { Session } from 'neo4j-driver';

/**
 * Contract the migration runner needs from the consumer's Neo4j layer.
 *
 * The workspace convention is that every backend has its own
 * `Neo4jService` with a `getSession(): Session` method (see workspace
 * CLAUDE.md "Neo4j conventions"). That existing service already
 * satisfies this interface — consumers just alias it to the token:
 *
 * ```ts
 * // app.module.ts
 * import {
 *   NEO4J_SESSION_PROVIDER,
 *   Neo4jMigrationsModule,
 * } from 'rail-nest-common';
 *
 * @Module({
 *   providers: [
 *     Neo4jService,
 *     { provide: NEO4J_SESSION_PROVIDER, useExisting: Neo4jService },
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * `useExisting` shares the same singleton instance — no second driver,
 * no second connection pool, no lifecycle duplication.
 *
 * The interface is deliberately tiny. The runner only needs to ask for
 * a session and close it itself; everything else (driver creation,
 * `OnModuleDestroy` cleanup, `disableLosslessIntegers`, database
 * selection) is the consumer's concern.
 */
export interface Neo4jSessionProvider {
  getSession(): Session;
}

/**
 * DI token consumers register their `Neo4jService` against.
 *
 * Uses a `Symbol` rather than a string so collisions with arbitrary
 * string-named providers are impossible.
 */
export const NEO4J_SESSION_PROVIDER = Symbol(
  'RAIL_NEST_COMMON_NEO4J_SESSION_PROVIDER',
);
