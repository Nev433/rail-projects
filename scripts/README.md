# scripts/

Local-dev orchestration scripts for the rail-projects family. These
operate across every project repo under `~/Developer/` — they're the
workspace's "run everything at once" tooling, hence their home in the
meta repo.

## What's here

### `build-all.sh`

Builds every NestJS API's `dist/` in turn. Run before
`pm2 start ecosystem.config.js` (PM2 starts the APIs from compiled
`dist/`, not via `nest start --watch`).

```bash
bash rail-projects/scripts/build-all.sh
```

Also re-run after any backend source change you want PM2 to pick up.
Or skip PM2 and use each project's `npm run dev` for live reload.

### `ecosystem.config.js`

PM2 process map covering all 12 dev processes (6 APIs + 6 Angular
clients). Ports follow the workspace `api + 1200` convention documented
in [rail-projects/CLAUDE.md "Ports and service map"](../CLAUDE.md#ports-and-service-map).

```bash
pm2 start rail-projects/scripts/ecosystem.config.js  # start everything
pm2 list                                              # status overview
pm2 logs <name>                                       # live logs for one
pm2 stop all                                          # stop everything
```

PM2 itself isn't a workspace requirement — you can run any subset of
projects manually with their own `npm run dev` if you only need a few.
PM2 is just convenient when you want the whole stack up at once.

## Workspace-level scripts (outside this folder)

`~/Developer/create-export.sh` lives one level above this folder (at the
workspace root, not tracked in any repo). It packages the entire workspace
for transfer to a new machine:

```bash
cd ~/Developer
./create-export.sh        # produces ~/Developer/export/
```

It copies every project's source code (excluding `node_modules/`, `dist/`,
`.angular/`, large reference-only railML assets, and TPRConvertor runtime
data), then writes five ready-to-run scripts into `export/`:

| Script | Purpose |
|---|---|
| `setup.sh` | `npm install` everywhere + `dotnet restore` (run once) |
| `start-all.sh` | Build all APIs then start all 12 processes via PM2 |
| `stop-all.sh` | Stop and remove all PM2 processes |
| `tpr-start.sh` | Build .NET API + launch Tauri desktop app |
| `tpr-stop.sh` | Force-kill TPRConvertor if needed from a second terminal |

It also writes a portable `ecosystem.config.js` that resolves paths via
`__dirname` (unlike the `scripts/ecosystem.config.js` here, which
hard-codes `$HOME/Developer`).

Full details: see "Transferring to a new machine" in
[`../CLAUDE.md`](../CLAUDE.md).

---

## What was removed

One earlier script from the pre-split umbrella-repo era:

- `~/Developer/export-projects.sh` — a simpler rsync script that produced
  a ~104 MB snapshot. Removed in
  [rail-projects #11](https://github.com/Nev433/rail-projects/issues/11)
  when every project became its own GitHub repo.

The current `~/Developer/create-export.sh` supersedes it: it strips far
more build artefacts (17 MB vs 104 MB output), handles TPRConvertor's
.NET + Rust project, and bundles the start/stop scripts.
