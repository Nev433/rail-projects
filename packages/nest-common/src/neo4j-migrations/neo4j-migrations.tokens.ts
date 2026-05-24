/**
 * DI tokens for the values supplied via
 * `Neo4jMigrationsModule.forRoot({ namespace, migrations })`.
 *
 * Live in their own file so the service and module can both import them
 * without a circular dependency between them.
 */
export const MIGRATIONS = Symbol('RAIL_NEST_COMMON_MIGRATIONS');
export const MIGRATIONS_NAMESPACE = Symbol(
  'RAIL_NEST_COMMON_MIGRATIONS_NAMESPACE',
);
