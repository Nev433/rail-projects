# Workspace data standards

This directory is the single source of truth for railway data standards
referenced across all projects in this workspace. Schemas, ontologies,
profile documents and specification PDFs live here, not inside individual
projects.

See the parent [CLAUDE.md](../CLAUDE.md) for workspace conventions and
domain glossary.

## Authoritative lookup order

When answering a standards question, consult in this order:

1. [`MANIFEST.yaml`](./MANIFEST.yaml) — catalogue of what is tracked.
2. `<standard>/<version>/SOURCE.md` — provenance for that specific drop
   (origin, retrieval date, license, integrity, local patches).
3. `<standard>/<version>/` — the actual schemas, ontologies, docs,
   examples.

Prefer the local files over training-data knowledge. Standards drift; the
repo is the source of truth.

## Directory layout

```
standards/
├── README.md                 ← this file
├── MANIFEST.yaml             ← catalogue of tracked standards & versions
├── CHANGELOG.md              ← log of additions, version bumps, removals
└── <standard>/
    └── <version>/
        ├── SOURCE.md         ← provenance & integrity for this drop
        ├── README.md         ← upstream README, kept verbatim
        ├── source/           ← schemas, code, codelists
        ├── documentation/    ← upstream docs, model files
        └── examples/         ← sample files (optional)
```

`<standard>` is short, lowercase, hyphenated (`railml`, `netex`, `era`,
`rinf`). `<version>` is the upstream version string verbatim
(`3.3-SR2`, `1.2.2`, `2.0`).

## Currently tracked

Files actually present under `standards/`:

| Standard | Version  | Folder                                            | Notes |
|----------|----------|---------------------------------------------------|-------|
| railML   | 3.3-SR2  | [`railML/3.3/`](./railML/3.3/)                    | XSD distribution; used by all `railML-*` projects |

## Planned

Catalogued in [`MANIFEST.yaml`](./MANIFEST.yaml) with `status: planned` —
metadata captured so consumers can plan, but files not yet brought in.
Bring each one in when the first consumer needs the actual schema.

| Standard | Target version              | Triggered by |
|----------|-----------------------------|--------------|
| NeTEx    | 1.2.2                       | Rail-ID-Service identifier types; railML-Timetable export |
| SIRI     | 2.1                         | (no consumer yet — paired with NeTEx) |
| GTFS     | schedule (living) + RT 2.0  | railML-Timetable export |
| CIF      | ATOC CIF v3                 | railML-Timetable export; Rail-ID-Service seed |

## Referenced (held elsewhere)

| Standard | Where files live                                          | Notes |
|----------|-----------------------------------------------------------|-------|
| TPR      | [`TPRConvertor/TPRs/2026/V4/`](../TPRConvertor/TPRs/2026/V4/) | Network Rail Timetable Planning Rules PDFs. Promote to `standards/tpr/2026-V4/` once the layout for non-XML standards is decided. |

Other glossary entries in the parent CLAUDE.md (RINF, ERA Ontology,
NAPTAN, EPIP, TAF/TAP TSI, MoI, NDOVLoket, n10s) are referenced for
background context only and not catalogued here — see the parent
glossary's "not tracked or unused" section.

## Adding a new standard

1. Create `standards/<standard>/<version>/`.
2. Drop the upstream distribution unchanged.
3. Write `SOURCE.md` with origin URL, retrieval date, license, and a
   sha256 of the source archive if available.
4. Add an entry to [`MANIFEST.yaml`](./MANIFEST.yaml) under the standard's
   `versions:` list.
5. Append an entry to [`CHANGELOG.md`](./CHANGELOG.md).
6. Update the "Currently tracked" table above.
7. Update any consuming project's `CLAUDE.md` that should pin this version.

## Adding a new version of an existing standard

Same as above, but the standard folder already exists. Do not overwrite
prior versions — keep them side-by-side until consumers have migrated.

## Local patches

Never silently mutate upstream artefacts. If a fix-up is required:

- Commit the patch as a separate commit.
- Record what changed and why in the version's `SOURCE.md` under a
  "Local patches" section.
