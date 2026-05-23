# Rail Projects — Workspace Context

This file is the shared context for all rail projects in this workspace.
Project-specific `CLAUDE.md` files append further detail. The memory
hierarchy is cumulative: this file + the project file + any sub-folder
files all apply.

When this file and a project file disagree, the project file wins for that
project; the disagreement is a signal to update one or the other (see
"Maintaining this context" below).

## Purpose

This workspace holds a family of related projects supporting the UK and EU
rail industries. Common themes: timetable and infrastructure data, graph
database modelling, data-standard interoperability (CIF, railML, NeTEx,
RINF, ERA Ontology), and modernisation of legacy mainframe-era systems.

---

## Repository topology

`~/Developer/` is a **plain folder** (not a git repo) containing
independent project repos plus this meta repo. Each project has its own
`.git`, lives on GitHub at `github.com/Nev433/<name>`, and is cloned /
worked on / released independently.

```
~/Developer/                                  (plain folder, not a git repo)
│
├── CLAUDE.md → rail-projects/CLAUDE.md       (symlink — Claude Code follows
│                                              the parent walk into here)
│
├── rail-projects/                            github.com/Nev433/rail-projects
│   ├── CLAUDE.md                             ← this file (workspace docs)
│   ├── standards/                            ← shared data standards
│   │   ├── README.md
│   │   ├── MANIFEST.yaml
│   │   ├── CHANGELOG.md
│   │   └── railML/3.3/                       ← currently the only tracked standard
│   └── .gitignore
│
├── Rail-ID-Service/                          github.com/Nev433/Rail-ID-Service
├── rail-id-client/                           github.com/Nev433/rail-id-client
├── railML-Infrastructure/                    github.com/Nev433/railML-Infrastructure
├── railML-Timetable/                         github.com/Nev433/railML-Timetable
├── railML-RollingStock/                      github.com/Nev433/railML-RollingStock
├── railML-Crew/                              github.com/Nev433/railML-Crew
├── railML-StockCrewPlan/                     github.com/Nev433/railML-StockCrewPlan
├── TPRConvertor/                             github.com/Nev433/TPRConvertor
│
├── .claude/                                  ← local Claude Code settings
│                                              (not in any repo, lives on disk)
├── ToDo/                                     ← legacy / pre-conversion projects,
│                                              not in active scope (gitignored
│                                              at the rail-projects level)
│
└── (workspace tooling files — orphaned, no current git home — see open
    decisions issue #11)
    ├── build-all.sh                          ← workspace build helper
    ├── export-projects.sh                    ← workspace export helper
    ├── ecosystem.config.js                   ← PM2 process map for local dev
    └── export/                               ← old project snapshots
```

Project descriptions:

- **Rail-ID-Service** — canonical identity / resolution hub (Nest + Angular)
- **rail-id-client** — shared TypeScript client for Rail-ID-Service
- **railML-Infrastructure** — network / map / route-finding (Nest + Angular, zoneless)
- **railML-Timetable** — timetable editor + multi-format export (Nest + Angular)
- **railML-RollingStock** — rolling-stock editor (Nest + Angular)
- **railML-Crew** — crew management (Nest + Angular)
- **railML-StockCrewPlan** — combined stock + crew rostering (Nest + Angular)
- **TPRConvertor** — Network Rail TPR PDF→data (.NET 10 + React + Tauri)

Each project is independently runnable, has its own `package.json` (or
`.sln`) and `node_modules`, and is built and released on its own. The
workspace is **not** an npm monorepo and **not** a git monorepo — there's
no parent `package.json` or `.git` orchestrating builds.

Cross-project shared assets live in **rail-projects** (this repo) — the
canonical CLAUDE.md, the `standards/` catalogue, and any other
workspace-wide documentation.

---

## Standard stack

The shape every new Nest + Angular project should match. Where a project
deviates, see "Per-project deviations" below.

| Layer | Choice | Notes |
|---|---|---|
| Backend framework | **NestJS 11** (TypeScript, strict) | Express adapter |
| Frontend framework | **Angular 21** (TypeScript, strict) | standalone components, signals |
| Graph DB | **Neo4j** (Desktop locally; database name `gemini`) | bolt port 7687 |
| Relational DB | **PostgreSQL** *(aspirational — not currently used by any project)* | remove or adopt — flag |
| Frontend testing | **Vitest** + `@analogjs/vite-plugin-angular` + jsdom | `npm test` → `vitest run` |
| Backend testing | **Jest** + `@nestjs/testing` | **Decision pending** — only 3 of 6 services have it today |
| e2e testing | *None standardised today.* Playwright was previously listed but is not installed anywhere | |
| Package manager | **npm** with `package-lock.json` | every project uses npm — pnpm is not used despite earlier docs |
| Build / monorepo tooling | **None** — each project builds independently | no Nx, no Turborepo, no npm workspaces |
| Node version | **Decision pending** — Rail-ID-Service pins `>=26`; Timetable CI uses Node 20; others unspecified. Pick one workspace-wide minimum |
| Legacy importers | **C# / .NET 10** (TPRConvertor) | predates the Nest+Angular standard; kept as-is |
| Auxiliary frontends | **React 18 + Vite 5 + Tauri 2** (TPRConvertor/client) | deliberate — desktop app for PDF→data workflow |

---

## Ports and service map

Local development assumes these ports. Values are taken from each
project's `client-ng/angular.json` (`serve.options.port`) and the API's
`main.ts` default + `client-ng/proxy.conf.json` target.

Client ports follow the convention **client port = API port + 1200**.

| Service | API port | Client port |
|---|---|---|
| Rail-ID-Service | 3000 | 4200 |
| railML-Infrastructure | 3005 | 4205 |
| railML-Timetable | 3010 | 4210 |
| railML-RollingStock | 3015 | 4215 |
| railML-StockCrewPlan | 3025 ⚠ clash with Crew | 4220 |
| railML-Crew | 3025 ⚠ clash with StockCrewPlan (also: `main.ts` defaults to 3020 but `proxy.conf.json` proxies to 3025 — internal disagreement) | 4225 |

**Decision pending** (tracked as GitHub issues):

- [rail-projects #2](https://github.com/Nev433/rail-projects/issues/2) —
  resolve the **3025 API collision** between railML-Crew and
  railML-StockCrewPlan.
- [railML-Crew #1](https://github.com/Nev433/railML-Crew/issues/1) —
  reconcile that project's internal 3020 vs 3025 disagreement.

> **Historical note**: an earlier version of this table claimed
> Rail-ID-Service and railML-Infrastructure both used client port 4200,
> creating a non-existent collision. Reality: Infrastructure pins 4205 in
> its `angular.json` already, following the convention above. The false
> entry has been corrected, and
> [rail-projects #1](https://github.com/Nev433/rail-projects/issues/1)
> was closed as "not actually an issue."

---

## Cross-service integration

Two services act as data hubs that everything else consumes server-side:

- **Rail-ID-Service** (port 3000) — canonical identity and external-code
  resolution. Other services proxy reads/writes through their own
  `/api/rail-id/*` endpoints, using server-held `RAIL_ID_URL` and
  `RAIL_ID_API_KEY`. **The frontend never holds the Rail ID key.**
- **railML-Infrastructure** (port 3005) — track geometry and route
  finding. Consumers proxy through `/api/infra/*` using `INFRA_API_URL`
  and `INFRA_API_KEY`.

The shape every consumer should follow:

```
Frontend → /api/rail-id/entities → RailIdController (in consumer's api)
                                     → Rail-ID-Service /api/entities
                                     (uses server-held credentials)
```

Shared TypeScript types for Rail-ID entities live in
[`rail-id-client/`](rail-id-client/). New consumers should depend on this
package via a `file:` ref rather than redefining `RailIdEntity` /
`RailIdRelationship` shapes locally.

---

## Data standards

All data standards live in [`./standards/`](./standards/). **Never
duplicate standards inside individual projects.** Reference them by
relative path or via the (planned) shared resolver.

See [`standards/README.md`](./standards/README.md) for layout and the
add-a-standard procedure.

Authoritative lookup order when answering a standards question:

1. [`standards/MANIFEST.yaml`](./standards/MANIFEST.yaml) — catalogue.
2. `standards/<name>/<version>/SOURCE.md` — provenance for that drop.
3. `standards/<name>/<version>/` — actual schemas, ontologies, docs.

Prefer the local files over training-data knowledge. Standards drift; the
repo is the source of truth.

**Known violation**: four `railML-*` projects each hold a local copy of
the railML 3.3 XSDs under `<project>/railML/`. These should be replaced
with references to `standards/railML/3.3/source/schema/` — tracked as a
follow-up.

---

## Rail domain glossary

Terms used across these projects without further explanation.

### GB rail (codes and operational)

- **CIF** — Common Interface File. Network Rail's fixed-width timetable
  data export.
- **WTT** — Working Timetable.
- **STP** — Short Term Plan. Overlay records that modify the base WTT.
- **TIPLOC** — Timing Point Location code. GB rail operational location
  code used in CIF and Darwin.
- **STANOX** — Station Number, Network Rail operational location reference.
- **CRS** — Computer Reservation System code; three-letter station code.
- **NLC** — National Location Code. GB fares/retail-side location code.
- **CORPUS** — Network Rail dataset mapping location codes (TIPLOC,
  STANOX, CRS, NLC).
- **TPR** — Timetable Planning Rules. Network Rail's published planning
  ruleset; the TPRConvertor project parses these.
- **LOR** — Line Of Route. NR route identifier (e.g. `LN101`); appears
  throughout TPR data.

### Operational concepts

- **OCP** — Operational Control Point. A timetable stop / scheduling
  point in railML; used as a node label across Timetable, Crew, and
  Infrastructure projects.
- **TVD** — Track Vacancy Detection. Section of track monitored for
  occupancy by signalling; railML interlocking concept.
- **IL** — Interlocking. The signalling logic and physical kit governing
  safe route-setting.
- **DMI** — Driver Machine Interface. The in-cab signalling display.
- **ECS** — Empty Coaching Stock. A stock movement without passengers.

### Rolling stock

- **DMU** — Diesel Multiple Unit.
- **EMU** — Electric Multiple Unit.
- **HST** — High-Speed Train (Class 43 / Mark 3 sets).

### Train protection systems (used together in code as a vocabulary)

- **AWS** — Automatic Warning System (GB legacy).
- **TPWS** — Train Protection & Warning System (GB legacy + add-on).
- **ETCS** — European Train Control System (the signalling layer of ERTMS).
- **ERTMS** — European Rail Traffic Management System.
- **LZB** — Linienzugbeeinflussung (German continuous ATP).
- **PZB** — Punktförmige Zugbeeinflussung (German intermittent ATP).
- **TVM** — Transmission Voie-Machine (French TGV cab signalling).
- **ATPC** — Automatic Train Protection (continuous) — GB pilot scheme.

### External ID schemes

- **UIC** — International Union of Railways; numeric identifier scheme.
- **RID** / **UID** — Rail-ID-Service internal identifiers (see
  Rail-ID-Service CLAUDE.md for exact semantics).

### Real-time / movement systems

- **Darwin** — Network Rail's real-time train running information service.
- **TRUST** — GB train movement tracking system.

### Standards & profiles

- **railML** — Industry XML standard for railway-specific data; v3.3 is
  tracked under [`standards/railML/3.3/`](./standards/railML/3.3/).
- **NeTEx** — Network Timetable Exchange. CEN standard for static
  public-transport data.
- **GTFS** — General Transit Feed Specification. Used as a Timetable
  export format.
- **RINF** — Register of Infrastructure. ERA-mandated infrastructure
  register.
- **ERA Ontology** — European Union Agency for Railways RDF ontology;
  mandated under TEL TSI.
- **TEL TSI** — Telematics TSI (EU 2026/253). Elevates NeTEx and ERA
  Ontology; XML→RDF/SHACL transition direction.
- **NTSN** — National Technical Specification Notice. GB post-Brexit
  equivalent of EU TSIs.

### Currently not tracked or unused in code

The following are defined for context but have **no current usage** in
any project. Keep here as background, but don't assume they're wired up:
**NAPTAN**, **EPIP**, **SIRI**, **TAF/TAP TSI**, **MoI** (Memorandum of
Implementation), **NDOVLoket**, **n10s / neosemantics**. Remove once
their absence is confirmed deliberate.

### Project-local vocabularies

Some projects use prefixes or codes that are documented in their own
`CLAUDE.md`, not here:

- **Rail-ID-Service** — `CID*` node label prefix (likely "Common
  IDentity"; should be defined locally), `RID`, `UID`.
- **railML-Crew** — `CR*` and `SP*` node label prefixes.
- **railML-Timetable** — `Timetable*` node label prefix.
- **TPRConvertor** — `SX`/`SO`/`SUN` day codes, `TID`, `SLU`, `SRT`.

---

## Code style

- TypeScript: `strict` mode on. ESM only in new code; no CommonJS.
- **Prettier**: 100-char print width, single quotes, Angular HTML parser
  for `.html`. Every Angular client has `.prettierrc` configured this way.
- ESLint configured per project; don't fight the formatter.
- C# (TPRConvertor): file-scoped namespaces, nullable reference types on,
  PascalCase public / camelCase private.

---

## NestJS conventions

The shape every Nest service should follow. Source: convergent patterns
across Rail-ID-Service, railML-Crew, railML-Infrastructure, railML-Timetable,
railML-StockCrewPlan, railML-RollingStock.

### Module layout

```
api/src/
├── main.ts            # Bootstrap
├── app.module.ts      # Root: ConfigModule (global), ThrottlerModule,
│                      #   Neo4jModule, feature modules, APP_GUARDs
├── app.controller.ts  # /api/health — @Public()
├── neo4j/             # @Global() — Neo4jService (NOT db/)
│   ├── neo4j.module.ts
│   └── neo4j.service.ts
├── common/
│   ├── decorators/public.decorator.ts
│   ├── filters/neo4j-exception.filter.ts
│   └── guards/api-key.guard.ts
└── <feature>/
    ├── <feature>.module.ts
    ├── <feature>.controller.ts
    ├── <feature>.service.ts
    └── dto/
        ├── create-<thing>.dto.ts
        └── update-<thing>.dto.ts
```

- Every feature is its own `*.module.ts` registered in `AppModule.imports`.
  **Do not** wire controllers/services directly into `AppModule`.
- DTOs live under `<feature>/dto/`. Validation via `class-validator`
  annotations.

### Bootstrap (main.ts)

In order:

1. `NestFactory.create(AppModule, { bufferLogs: true })`.
2. `app.use(helmet())`.
3. CORS configured from `ConfigService.get('CORS_ORIGIN')` (comma-separated).
4. `app.setGlobalPrefix('api')`.
5. `app.useGlobalFilters(new Neo4jExceptionFilter())`.
6. `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }))`.
7. `app.listen(configService.get('PORT'))`.

### Standard env vars

Read via `ConfigService` only. **Never use `process.env` outside `main.ts`.**

| Var | Meaning |
|---|---|
| `PORT` | API listen port |
| `API_SECRET_KEY` | API key for `x-api-key` header (Infrastructure currently uses `API_KEY` — outlier) |
| `NEO4J_URI` | `bolt://localhost:7687` |
| `NEO4J_USER` / `NEO4J_PASSWORD` / `NEO4J_DATABASE` | Connection (db usually `gemini`) |
| `CORS_ORIGIN` | Comma-separated list of allowed origins |
| `RAIL_ID_URL` / `RAIL_ID_API_KEY` | Rail-ID-Service base + key (server-side only) |
| `INFRA_API_URL` / `INFRA_API_KEY` | railML-Infrastructure base + key (server-side only) |

### Guards and rate limiting

- `ApiKeyGuard` registered as global `APP_GUARD`. Uses
  `crypto.timingSafeEqual` against `API_SECRET_KEY`. If the env var is
  unset, logs a warning and allows all (dev mode).
- `@Public()` decorator (in `common/decorators/`) bypasses the guard;
  used on health checks and `/rail-id/*` and `/infra/*` proxies.
- `ThrottlerModule` registered as global `APP_GUARD` via `ThrottlerGuard`,
  with two named tiers:
  - `global`: 500 req / 15 min — applies to all routes
  - `write`: 60 req / 1 min — applies to POST/PUT/PATCH/DELETE
  - GET handlers opt out of `write` via `@SkipThrottle({ write: true })`

### Exception handling

`Neo4jExceptionFilter` at `common/filters/neo4j-exception.filter.ts`,
registered globally in `main.ts`. It:

- Normalises `HttpException` to `{ error: '...' }` (supports
  ValidationPipe array messages).
- Maps Neo4j connection / timeout errors to `503 Service Unavailable`.
- Maps other unexpected errors to `500 Internal Server Error`, adding
  `{ detail: '...' }` in non-production.

Services throw NestJS exceptions (`BadRequestException`,
`NotFoundException`, `ForbiddenException`, `InternalServerErrorException`).

### Logging

```ts
private readonly logger = new Logger(MyService.name);
this.logger.error('Failed to fetch X', error);
```

**Decision pending**: `nestjs-pino` is in the dep tree of Infrastructure
and RollingStock but not actually injected anywhere — either adopt it
properly (with `LoggerModule.forRoot` and pino-injected loggers) or drop
the dependency.

### Controller / service split

Controllers are thin (HTTP concerns only); services hold all Neo4j logic.
Use `session.executeWrite(async tx => { ... })` for any multi-step write
that requires atomicity.

---

## Angular conventions

The shape every new Angular client should follow. Source: convergent
patterns across railML-Crew, railML-Infrastructure, railML-Timetable,
railML-RollingStock, railML-StockCrewPlan.

### Component style

- **Standalone components only** — never NgModules. Don't set
  `standalone: true` explicitly (it's the default in Angular 21+).
- **`ChangeDetectionStrategy.OnPush`** on every component.
- **Signals** for state — `signal()`, `computed()`, `effect()`; never
  `mutate()` (use `update()` / `set()`).
- **`inject()`** for DI in components and services — never constructor
  parameter injection in new code.
- **`input()` / `output()`** functions over `@Input()` / `@Output()`.
- **`host: {}`** object over `@HostBinding` / `@HostListener`.
- **Native control flow** — `@if`, `@for` (with `track`), `@switch`,
  `@else` — never `*ngIf`, `*ngFor`, `*ngSwitch`.
- **`[class.foo]` / `[style.foo]`** bindings — never `ngClass` / `ngStyle`.
- **`takeUntilDestroyed(destroyRef)`** on all HTTP subscriptions inside
  components.

### App shell

- `app.config.ts` provides `provideRouter`, `provideHttpClient(withInterceptors(...))`,
  `provideToastr`, optional `provideZonelessChangeDetection()`.
- `LayoutComponent` wraps `<router-outlet>` with the nav chrome; all
  feature routes are children of it.
- Routes always lazy: `loadComponent: () => import('./pages/x/x.component').then(m => m.XComponent)`.
  **No eager `component:` imports in `app.routes.ts`.** (RollingStock is
  the current outlier.)

### HTTP layer

- Thin `ApiService` wrapper around `HttpClient`.
- Two functional interceptors registered in `app.config.ts`:
  - `apiKeyInterceptor` — injects `x-api-key` from `environment.apiKey`.
  - `errorInterceptor` — extracts `{ error, detail }` from API
    responses into a plain `Error` so components see `err.message`.
- Dev proxy `proxy.conf.json` forwards `/api → http://localhost:<api-port>`.

### State

- Feature state lives in a service (`*-state.service.ts`,
  `providedIn: 'root'`) as signals.
- Persisted state goes to `localStorage` with a project-specific prefix
  (`railml-*`, `crm_*`, `inf_*`).
- Models live in `client-ng/src/app/models.ts` (or per-feature
  `*.models.ts`).

### Zoneless vs zoned

**New projects: zoneless.** Use `provideZonelessChangeDetection()` and
omit `zone.js` from dependencies. railML-Infrastructure is the reference
implementation. Existing zoned projects can migrate when convenient —
not urgent.

### Frontend testing

**Vitest** (`vitest run`) + `@analogjs/vite-plugin-angular` + `jsdom`.
Tests live under `client-ng/src/`. Config in `client-ng/vitest.config.ts`.

Three projects (Crew, RollingStock, StockCrewPlan) currently declare
`"test": "ng test"` (Karma/Jasmine) but have Vitest installed — these
scripts should be updated to `"test": "vitest run"`.

For zoneless projects: do **not** import
`@analogjs/vite-plugin-angular/setup-vitest` (it pulls in Zone.js). Each
spec must call `getTestBed().initTestEnvironment(...)` in `beforeAll`
itself — see [railML-Infrastructure/CLAUDE.md](railML-Infrastructure/CLAUDE.md)
for the exact shape.

### Maps

Plain Leaflet (no `ngx-leaflet`-style wrappers). Initialise in
`ngAfterViewInit` (or `afterNextRender` in zoneless), destroy in
`ngOnDestroy`. Use `ResizeObserver` to call `invalidateSize()` on
container resize. A reusable `leaflet-map.component.ts` exists in most
projects — share via `rail-id-client` or a future shared lib if it grows
further.

---

## Neo4j conventions

- **Database name**: `gemini` everywhere unless a project documents
  otherwise.
- **`Neo4jService` at `src/neo4j/`**, exported by a `@Global()`
  `Neo4jModule`. Set `disableLosslessIntegers: true` — and consequently
  **never call `.toNumber()`** on a Neo4j result value (they're plain
  JS numbers).
- **Always close the session in `finally`**:
  ```ts
  const session = this.neo4j.getSession();
  try { /* ... */ } finally { await session.close(); }
  ```
- **Use `MERGE`** with explicit unique-constraint keys, not `CREATE`.
- **Batch writes via `UNWIND $rows`** — never one statement per row.
- **Multi-step atomic writes** via `session.executeWrite(async tx => {})`.
- **SKIP/LIMIT inlined** as bounded validated integers — never
  parameterised. The driver does not support `$skip`/`$limit` as
  parameters in current Neo4j versions:
  ```ts
  const limit = Math.min(parseInt(req.query.limit) || 200, 1000);
  const skip = Math.max(parseInt(req.query.skip) || 0, 0);
  await session.run(`... SKIP ${skip} LIMIT ${limit}`, params);
  ```
- **Label and relationship-type interpolation** only after either an
  `ALLOWED_*` whitelist check or a DB validation (`MATCH (r:CIDRelTypeDef
  {name: $name})`). Never interpolate user input directly.
- **JSON-serialised string fields** for nested arrays (`coords`,
  `holidays`, `attributes`) — parse/stringify in the service layer.
- **Pattern expressions**: use `COUNT { (n)-[:REL]->() }` not
  `size((n)-[:REL]->())` — `size()` over pattern expressions throws at
  runtime on current Neo4j.
- **For RDF integration** use `n10s` / `neosemantics`; don't stand up a
  separate triplestore unless explicitly required.

**Known gap**: no project currently uses versioned migration scripts for
constraints/indexes — they're applied via one-shot `POST /api/init` or
`/api/setup` endpoints. Adopting a proper migration tool is a workspace
follow-up.

---

## Shared types

The de-facto shared TypeScript package is
[`rail-id-client/`](rail-id-client/). It exports `RailIdEntity`,
`RailIdRelationship`, and HTTP client utilities. **New consumers of
Rail-ID-Service data should depend on this package** via a `file:` ref
rather than redefining the shapes locally.

### Current adoption (verified by code inspection, not by docs)

| Project | Status |
|---|---|
| railML-Timetable | ✓ imports from `rail-id-client` (`api/src/sync/sync.service.ts`) |
| railML-Infrastructure | ✓ proxy controller uses workspace-shared HTTP types |
| railML-Crew | ✗ has its own `api/src/common/rail-id.client.ts` + local interface definitions — **real duplication, worth migrating** |
| Rail-ID-Service | n/a — *is* the upstream |
| railML-RollingStock | n/a — no Rail-ID integration today (no `RAIL_ID_URL` env, no entity sync) |
| railML-StockCrewPlan | n/a — no Rail-ID integration today |

So the migration backlog is **one project** (Crew), not four. See
[rail-projects #7](https://github.com/Nev433/rail-projects/issues/7)
for the tracked work.

A general shared-types package (`@rail/shared` or similar) is not in
place. Promote shared types into `rail-id-client/` until the second
domain (e.g. railML-Timetable shapes) justifies a second package.

> **Historical note**: an earlier version of this section claimed only
> Infrastructure consumed `rail-id-client` and that Crew, Timetable,
> RollingStock and StockCrewPlan all duplicated `RailIdEntity` locally.
> The deep audit found that overstated: Timetable already imports the
> package, and RollingStock + StockCrewPlan have no Rail-ID surface to
> migrate. The matrix above is the corrected picture.

---

## Per-project deviations

Intentional or grandfathered differences from the conventions above.
Listed so they're not mistaken for drift to be "fixed."

| Project | Deviation | Status |
|---|---|---|
| Rail-ID-Service | No DTOs, no `ValidationPipe`, no signals (pure RxJS), `reflect-metadata ^0.1.13` (behind), `@types/node: "latest"` (footgun) | **Legacy** — fixes welcome but not urgent |
| railML-Infrastructure | Uses `db/` instead of `neo4j/`; env var `API_KEY` instead of `API_SECRET_KEY`; throttler is single tier (100/min) not the standard two-tier; localStorage-stored API key with per-request header injection; zoneless | First three are drift; localStorage key + zoneless are deliberate |
| railML-RollingStock | Flat `AppModule` — no feature `*.module.ts` files; eager route imports (not lazy); `nestjs-pino` in deps but not used | All drift to fix |
| railML-Crew | DTOs flat in feature folders, not under `dto/`; `nestjs-pino` in deps but not used | Drift |
| railML-StockCrewPlan | Bare `process.env` reads despite ConfigModule; `core/`+`features/` client layout (siblings use `pages/`+`services/`); no `CLAUDE.md` | Drift + missing scaffolding |
| railML-Timetable | Uses Node `--env-file` flag instead of `@nestjs/config` for env loading | Tolerable, but inconsistent |
| TPRConvertor | .NET 10 + React + Tauri — not Nest+Angular at all; no `CLAUDE.md` | Deliberate (legacy importer scope) — needs a `CLAUDE.md` though |
| rail-id-client | Library, not a service; no `CLAUDE.md` or `.claude/` | Deliberate — needs a `CLAUDE.md` |

---

## Git / PR hygiene

- **Conventional Commits**.
- **One concern per PR**.
- Failing tests block merge.
- Format-on-commit via lefthook or husky where configured.
- Always commit changes to `CLAUDE.md` and `standards/` files in the
  same PR as the code that motivated them — not as a follow-up.

---

## Working with Claude in this workspace

### Context loading

`~/Developer/CLAUDE.md` is a **symlink** to this file. When you open
Claude Code inside any project (e.g. `~/Developer/railML-Crew/`), the
parent-directory walk loads:

1. The project's own `CLAUDE.md` (project-specific conventions).
2. `~/Developer/CLAUDE.md` → this file (workspace conventions).
3. `~/.claude/CLAUDE.md` if you have a user-level file.

So workspace context is automatically available in every project session,
without any manual setup, via the symlink. Keep it that way — if the
symlink is broken, no project will see workspace conventions.

### Where to work

- **Open Claude Code inside a single project**, not at `~/Developer/`.
  Per-project sessions are focused and load just the relevant
  `node_modules`, file tree, and CLAUDE.md.
- **Workspace-wide work** (editing this file, the `standards/` catalogue,
  filing cross-cutting issues) is the only case for opening Claude Code
  in `~/Developer/rail-projects/` itself.

### Settings

- **`~/Developer/.claude/`** holds local Claude Code settings for the
  workspace folder. Not in any git repo — local-only state.
- **Per-project `.claude/`** in each project repo holds settings that
  *do* travel with the project (committed). Prefer workspace-level for
  anything reusable across projects; per-project for project-specific
  agents, commands, or skills.

### Standards lookup

When uncertain about a data standard, consult
[`standards/README.md`](./standards/README.md) and the per-version
`SOURCE.md` files **before** inferring from training data.

### Stale memory

When consulting a memory note that names a file, function, or env var,
verify it still exists before acting on it. The split means file paths
that were correct before (e.g. `~/Developer/railML-Crew/...`) are still
correct, but anything that referenced the umbrella git history is
necessarily stale.

---

## Maintaining this context

These `CLAUDE.md` files and the `standards/` directory are living
documents. Decisions made in a session that affect conventions,
standards, or scope should be reflected in the relevant file **in the
same change**, not deferred. Treat documentation edits as part of the
work, not a follow-up.

When a session produces any of the following, propose the corresponding
file updates in the same response:

- **New convention, or change to an existing one** (style, framework
  choice, architectural pattern, testing approach)
  → update this file if cross-cutting, the project file if local.
  Promote project-local → workspace only after the convention appears
  in **two or more** projects.
- **Deprecated pattern**
  → mark deprecated in place with a short rationale; do not delete
  silently. Removal is a later, separate change once references are gone.
- **New data standard** added under `standards/`
  → update `standards/MANIFEST.yaml`, `standards/CHANGELOG.md`, and the
  "currently tracked" table in `standards/README.md`.
- **New version of an existing standard**
  → add the version folder, an entry under that standard's `versions:`
  in `MANIFEST.yaml`, an entry in `CHANGELOG.md`, and update any
  consuming project's `CLAUDE.md` that pins a version.
- **New project added** to the workspace
  → add it to the topology section above, the ports table, and the
  relevant `used_by:` lists in `standards/MANIFEST.yaml`.
- **Domain term used in code or docs without explanation**
  → add it to the glossary above (or to the project's `CLAUDE.md` if
  project-local).
- **Project scope change** (new sub-system, deprecated area, new owner)
  → update that project's `CLAUDE.md`.

Update discipline:

- Edits to `CLAUDE.md` files are reviewed at least as carefully as code
  diffs. A bad convention written into context shapes every subsequent
  session.
- Never silently mutate upstream artefacts in `standards/`. If a local
  fix-up is required, commit the patch and document it in the relevant
  `SOURCE.md`.
- When unsure whether a change is workspace-wide or project-local,
  prefer project-local first; promote on the second occurrence.

---

## Out of scope

- **Production deployment configuration** — handled outside this workspace.
- **Customer-specific contractual material** — kept separately.
- **`~/Developer/ToDo/`** — legacy / pre-conversion projects, ignored
  when assessing workspace conventions. Gitignored at the `rail-projects`
  level; otherwise just a local folder.
- **`~/Developer/export/`** — historical project snapshots from before
  the split. Not the live source. Don't treat as authoritative; safe to
  delete once it's confirmed no scripts depend on it
  (see open decisions issue #11).

---

## Open decisions

Cross-cutting workspace decisions and tech-debt items are tracked as
GitHub Issues on the `rail-projects` repo:

- **Open**: https://github.com/Nev433/rail-projects/issues
- **Closed (decision log)**: https://github.com/Nev433/rail-projects/issues?q=is%3Aissue+is%3Aclosed

Project-specific decisions belong on the relevant project repo's own
Issues tab — e.g. the railML-Crew port-numbering disagreement lives at
https://github.com/Nev433/railML-Crew/issues.

When closing an issue, add a short comment summarising the decision so
the closed-issues list doubles as a searchable decision log.

### Closure-comment shape

Two or three sentences. Capture **what** and **why**, not just **what** —
in six months "we decided X" is much less useful than "we decided X
**because** Y", because the rationale is what tells future-you whether
the decision still applies after circumstances change.

```
Decided: <the choice in one line>
Why:     <the reason in one or two lines>
Done:    <what changed, with a link to the commit(s) or PR(s)>
```

A worked example — the actual closure of [rail-projects #1](https://github.com/Nev433/rail-projects/issues/1) ("Resolve port 4200 collision"):

> **Decided**: Closed — not actually an issue.
> **Why**: The audit that opened this misread railML-Infrastructure's
> CLAUDE.md as documenting port 4200. The real source of truth is
> `client-ng/angular.json` `serve.options.port`, which already pins
> Infrastructure to 4205 — following the workspace convention of
> *client port = api port + 1200*.
> **Done**: Workspace CLAUDE.md ports table corrected in
> `Nev433/rail-projects@<sha>`. railML-Infrastructure's CLAUDE.md
> updated to match its angular.json in
> `Nev433/railML-Infrastructure@<sha>`.

### Filing labels (set up once)

A small label set keeps filtering useful without becoming bureaucracy:

- `decision-needed` — requires a call, no obvious right answer
- `tech-debt` — known-bad pattern to fix
- `cross-cutting` — affects multiple projects
- `priority:high` / `priority:low` — only the extremes; everything
  else is implicit medium
- `area:standards`, `area:nestjs`, `area:angular`, `area:neo4j`,
  `area:ports` — domain tags for filtering
