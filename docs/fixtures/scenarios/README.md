# Scenario Fixtures

These fixtures are schema-focused deterministic inputs for simulator tests.

- `scenario.minimal.pick.json` — smallest valid pick scenario.
- `scenario.two-totes.end-of-tote.json` — valid multi-task, multi-slot scenario.
- `scenario.invalid.missing-fields.json` — intentionally invalid for negative tests.

Notes:
- Barcodes are treated as opaque strings.
- Tote count is always explicit and configurable via `buildCart.requiredToteCount`.
