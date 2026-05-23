# rail-projects

Workspace docs and shared data standards for the [Nev433 rail-projects](https://github.com/Nev433?tab=repositories) family — a collection of related projects supporting the UK and EU rail industries.

This repo holds the shared things:

- **[CLAUDE.md](./CLAUDE.md)** — the canonical workspace conventions: stack baseline (NestJS 11, Angular 21, Neo4j), Nest/Angular/Neo4j patterns, the rail domain glossary, cross-service integration patterns, and per-project deviations.
- **[standards/](./standards/)** — the catalogue of railway data standards consumed across the workspace (currently tracked: railML 3.3-SR2; planned: NeTEx 1.2.2, SIRI 2.1, GTFS, CIF; referenced: TPR).
- **[Issues](https://github.com/Nev433/rail-projects/issues)** — the tracker for cross-cutting workspace decisions and tech debt that span multiple projects.

## The projects

Each lives in its own GitHub repo and is independently built and released.

| Repo | Purpose |
|---|---|
| [Rail-ID-Service](https://github.com/Nev433/Rail-ID-Service) | Canonical GB rail entity registry and external-identifier resolution |
| [rail-id-client](https://github.com/Nev433/rail-id-client) | Shared TypeScript client for Rail-ID-Service |
| [railML-Infrastructure](https://github.com/Nev433/railML-Infrastructure) | Network infrastructure map + route finding |
| [railML-Timetable](https://github.com/Nev433/railML-Timetable) | Timetable editor + multi-format export |
| [railML-RollingStock](https://github.com/Nev433/railML-RollingStock) | Rolling-stock editor |
| [railML-Crew](https://github.com/Nev433/railML-Crew) | Crew management |
| [railML-StockCrewPlan](https://github.com/Nev433/railML-StockCrewPlan) | Combined stock + crew rostering |
| [TPRConvertor](https://github.com/Nev433/TPRConvertor) | Network Rail TPR PDF→data converter (.NET + React + Tauri) |

## Local layout

```
~/Developer/
├── CLAUDE.md → rail-projects/CLAUDE.md  (symlink — Claude Code parent walk)
├── rail-projects/                       (this repo)
└── <one folder per project repo above>
```

`~/Developer/` is a plain folder, not a git repo. The symlink lets Claude Code sessions inside any project folder pick up the workspace CLAUDE.md automatically via parent-directory walk.

## Contributing

The workspace is currently a solo project. The conventions in [CLAUDE.md](./CLAUDE.md) and the decision log in [closed issues](https://github.com/Nev433/rail-projects/issues?q=is%3Aissue+is%3Aclosed) tell future-me (and any future collaborators) why things are the way they are.
