# Neo4jMigrationsModule

Versioned Cypher migrations for NestJS backends sharing the workspace's
`gemini` Neo4j database.

## What it gives you

- One file per migration under `api/src/admin/migrations/` (or wherever
  your init lives), authored as `<version>_<name>.ts` exporting a
  `Neo4jMigration` default.
- A `Neo4jMigrationsService` injectable with three methods:
  - `migrate()` — apply every pending migration in version order.
  - `status()` — list applied vs pending without changing state.
  - `history()` — full ordered history of applied migrations.
- Per-consumer namespacing of audit nodes — multiple backends sharing a
  single Neo4j database don't collide.

## Wiring

```ts
// neo4j/neo4j.module.ts — make Neo4jService discoverable via the contract
import { Global, Module } from '@nestjs/common';
import { NEO4J_SESSION_PROVIDER } from 'rail-nest-common';
import { Neo4jService } from './neo4j.service';

@Global()
@Module({
  providers: [
    Neo4jService,
    { provide: NEO4J_SESSION_PROVIDER, useExisting: Neo4jService },
  ],
  exports: [Neo4jService, NEO4J_SESSION_PROVIDER],
})
export class Neo4jModule {}

// admin/migrations/001_constraints.ts — author a migration
import type { Neo4jMigration } from 'rail-nest-common';

const migration: Neo4jMigration = {
  version: 1,
  name: 'constraints',
  async up(tx) {
    await tx.run(
      'CREATE CONSTRAINT entity_id_uq IF NOT EXISTS ' +
        'FOR (n:MyEntity) REQUIRE n.id IS UNIQUE',
    );
  },
};
export default migration;

// admin/migrations/index.ts — order them
import type { Neo4jMigration } from 'rail-nest-common';
import m001 from './001_constraints';

export const MY_MIGRATIONS: Neo4jMigration[] = [m001];

// admin/admin.module.ts — register the runner
import { Module } from '@nestjs/common';
import { Neo4jMigrationsModule } from 'rail-nest-common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MY_MIGRATIONS } from './migrations';

@Module({
  imports: [
    Neo4jMigrationsModule.forRoot({
      namespace: 'my-service',          // ← REQUIRED, see Namespacing
      migrations: MY_MIGRATIONS,
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

// admin/admin.service.ts — call it
import { Injectable } from '@nestjs/common';
import { Neo4jMigrationsService } from 'rail-nest-common';

@Injectable()
export class AdminService {
  constructor(private readonly migrations: Neo4jMigrationsService) {}

  initDb() {
    return this.migrations.migrate();
  }
}
```

## Namespacing

`namespace` is **required**. The workspace runs every backend against
the same `gemini` Neo4j database, so an unnamespaced runner would let
Crew's version-1 audit node make Rail-ID-Service skip *its* version-1
migration (a totally different `CREATE CONSTRAINT`).

Use a stable kebab-case identifier per service:

| Backend | Namespace |
|---|---|
| Rail-ID-Service | `rail-id-service` |
| railML-Crew | `rail-crew` |
| railML-Timetable | `rail-timetable` |
| railML-StockCrewPlan | `rail-stock-crew-plan` |
| (Future) railML-Infrastructure | `rail-infrastructure` |
| (Future) railML-RollingStock | `rail-rolling-stock` |

**Never change a namespace after deployment.** Doing so effectively
"forgets" every migration applied under the old name; the runner will
re-apply everything under the new name (safe because migrations are
idempotent, but it pollutes the audit history with duplicate rows
under different namespaces).

## Idempotency contract

Every migration's `up(tx)` **must** be safe to re-run.

The audit-node write (`CREATE (:_RailMigration {...})`) happens in a
**separate transaction** from `up(tx)` because Neo4j 5+ throws
`ForbiddenDueToTransactionType` when you mix schema modifications
(`CREATE CONSTRAINT`) with data writes (the audit `CREATE`) inside one
managed transaction.

That means atomicity between `up()` and the audit is lost. If `up()`
succeeds but the audit write then fails (network blip, etc.), `up()`
will be re-applied on the next `migrate()` call. So:

- ✅ `MERGE (n:X {id: $id}) ON CREATE SET ...` — idempotent
- ✅ `CREATE CONSTRAINT ... IF NOT EXISTS` — idempotent
- ✅ `MATCH (e:Old) ... SET e.type = 'New' REMOVE e.subtype` — matches
  no rows after first successful run
- ❌ `CREATE (n:X {id: randomUUID()})` — would create duplicates on re-run
- ❌ `MATCH (n:X) WHERE n.count IS NULL SET n.count = 0` — fine for
  data, but `MATCH (n:X) SET n.count = n.count + 1` would double-count

## No `down` migrations

Forward-only by design:

1. Neo4j has no transactional DDL rollback. A `DROP CONSTRAINT` can't
   be undone if the next statement in the same migration fails.
2. A `down` that's wrong is worse than no `down` at all — it'll corrupt
   production trying to "fix" something.
3. Fix mistakes with a new migration. Versions are cheap.

## Endpoints

The package doesn't ship its own controllers — every consumer wires its
own admin endpoints. The Rail-ID-Service shape is the canonical one:

```ts
@Controller('init')
export class InitController {
  constructor(private readonly initService: InitService) {}

  @Post()                                  // POST /api/init
  init(@Body() body: InitDto) {            //   → run migrations + env-driven seed
    return this.initService.init(body);
  }

  @Get()                                   // GET /api/init
  status() {                               //   → applied vs pending, no writes
    return this.initService.status();
  }
}
```

## Audit node shape

```cypher
(:_RailMigration {
  namespace: 'rail-id-service',
  version:   3,
  name:      'seed_entity_types',
  appliedAt: datetime('2026-05-24T13:47:21.717Z')
})
```

A composite index on `(namespace, version)` is created automatically on
first call.

## Op queries

What version is each backend at?

```cypher
MATCH (m:_RailMigration)
RETURN m.namespace AS svc,
       max(m.version) AS at_version,
       count(m) AS applied_count
ORDER BY svc
```

Show the audit history for one service:

```cypher
MATCH (m:_RailMigration {namespace: 'rail-id-service'})
RETURN m.version, m.name, m.appliedAt
ORDER BY m.version
```
