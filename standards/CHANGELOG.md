# Standards changelog

All notable additions, version bumps, and removals to tracked standards.
Newest first. Format: `YYYY-MM-DD — <standard> <version> — <action> — note`.

## 2026-05-23

- MANIFEST.yaml — **expanded** — added planned/referenced entries for
  NeTEx 1.2.2, SIRI 2.1, GTFS, CIF (ATOC v3) and TPR 2026 V4. New
  per-standard and per-version `status` field (`tracked` | `planned` |
  `referenced`) so the catalogue can honestly carry forward-looking
  metadata without claiming files exist.
- README.md — **updated** — split "Currently tracked" / "Planned" /
  "Referenced (held elsewhere)" tables to mirror the MANIFEST.
- railML 3.3-SR2 — **added** — Initial workspace drop. Full XSD
  distribution under [`railML/3.3/`](./railML/3.3/). See
  [`railML/3.3/SOURCE.md`](./railML/3.3/SOURCE.md) for provenance.
- Workspace standards scaffolding (`README.md`, `MANIFEST.yaml`, this
  changelog) **introduced** to formalise the contract described in the
  workspace `CLAUDE.md`.
