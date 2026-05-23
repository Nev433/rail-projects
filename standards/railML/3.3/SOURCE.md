# SOURCE — railML 3.3-SR2

Provenance for this specific drop of the railML 3.3-SR2 distribution.

| Field          | Value |
|----------------|-------|
| Standard       | railML |
| Version        | 3.3-SR2 (Service Release 2) |
| Authority      | railML.org e.V. |
| Homepage       | https://www.railml.org/ |
| Download page  | https://www.railml.org/en/user/download.html |
| Retrieved on   | TBC — see commit history for date the files were added |
| License        | CC BY-NC-ND 4.0, plus registration / certification requirements (see https://www.railml.org/en/licence) |

## Contents

Mirror of the upstream distribution, kept verbatim:

- [`source/schema/`](./source/schema/) — XSDs (common3, generic3,
  infrastructure3, interlocking3, rollingstock3, timetable3, etc.)
- [`source/model/`](./source/model/) — UML model files
- [`source/codelists/`](./source/codelists/) — controlled vocabularies
- [`documentation/schema/`](./documentation/schema/) — schema reference docs
- [`documentation/model/`](./documentation/model/) — model reference docs
- [`documentation/usecases/`](./documentation/usecases/) — use-case docs
- [`README.md`](./README.md) — upstream README, unchanged

## Integrity

No upstream archive checksum recorded yet. When refreshing this drop,
record the sha256 of the source `.zip` here so subsequent refreshes can
verify they match the published artefact.

## Local patches

None. The contents of this folder are unchanged from the upstream
distribution. If a local fix-up is ever required, add it as a separate
commit and document it here.

## Consumers

Projects in this workspace that consume this version (per
[`../../MANIFEST.yaml`](../../MANIFEST.yaml)):

- `railML-Infrastructure`
- `railML-RollingStock`
- `railML-StockCrewPlan`
- `railML-Timetable`
- `railML-Crew`

Each of these currently holds a local copy of the XSDs under its own
`railML/` folder. Those copies should be replaced with references to this
canonical location — tracked as a separate follow-up.
