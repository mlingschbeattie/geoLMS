# Acceptance Checklist (Airtight)

Every change that affects behavior must satisfy ALL:

## Contracts
- [ ] Event emitted for every user action
- [ ] Event conforms to docs/contracts/events.schema.json
- [ ] Error codes only from docs/contracts/errors.json
- [ ] No undocumented event types or error codes introduced

## Workflow
- [ ] Build Cart follows docs/workflows/build-cart.md
- [ ] Pick follows docs/workflows/pick.md
- [ ] Exceptions follow docs/workflows/exceptions.md
- [ ] No UI-only rules (all behavior in state machines)

## Determinism
- [ ] Same inputs produce same outputs
- [ ] No randomness unless seeded and documented
- [ ] No time-based logic unless clock-injected

## Tests
- [ ] Unit tests added/updated for transitions and error paths
- [ ] Contract validation tests cover positive and negative examples
- [ ] Integration test exists for a complete pick + end-of-tote + CTRL+A path

## Security
- [ ] Scanner input validated (length/charset)
- [ ] JSON inputs schema-validated
- [ ] No secrets committed
