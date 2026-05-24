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

## What was removed

Two earlier scripts that the pre-split umbrella-repo era needed:

- `~/Developer/export-projects.sh` — rsync each project to `~/Developer/export/`
  for offline backup/sharing.
- `~/Developer/export/` — the snapshot folder it produced (~104 MB).

Both are redundant now: every project is its own GitHub repo with its
own history and can be cloned/forked/shared individually. Removed in
[rail-projects #11](https://github.com/Nev433/rail-projects/issues/11).
