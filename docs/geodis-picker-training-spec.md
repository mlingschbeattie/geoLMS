# GEODIS Picker Training LMS + Simulator Specification (v2 – Authoritative)

## 0. Authority & Scope

This specification aligns to:

- RF Picking: US – BBWD-WI-030 (Procedure 5.1–5.2, Exceptions 6.x)
- Build Cart / Pick reference deck

Where this specification differs from official Work Instructions (WI), the WI prevails.

This document defines:
- System purpose
- KPIs
- Domain model
- Event model requirements
- Error taxonomy authority
- Acceptance criteria
- Governance rules

Detailed workflow ordering is defined in:

- docs/workflows/build-cart.md
- docs/workflows/pick.md
- docs/workflows/exceptions.md

Machine-checkable contracts are defined in:

- docs/contracts/events.schema.json
- docs/contracts/errors.json

These are the Single Source of Truth (SSoT).

---

# 1. Purpose

Build a deterministic training LMS and RF workflow simulator that reduces new hire ramp time by enforcing:

- Correct Build Cart procedure
- Correct Pick execution order
- Required quantity entry
- End Of Tote confirmation (CTRL+A)
- Proper exception handling (CTRL+W / CTRL+K)
- Deterministic error logging

The system trains muscle memory, procedural compliance, and accuracy under repetition.

---

# 2. Business Objective

## Primary KPI

Reduce time-to-independent-picking-readiness from approximately 4 weeks to a measurable, lower target defined per site.

## Definition of “Ready”

A trainee must satisfy:

### Accuracy Gate
- ≥ 97% correct execution over 3 consecutive sessions
- 0 critical sequence violations in last session

### Process Gate
- No illegal workflow transitions
- Proper End Of Tote confirmation
- Correct Build Cart completion

### Speed Gate (Configurable)
- Average seconds per pick at or below site-defined target

Targets must be configurable and not hard-coded.

---

# 3. System Architecture Principles

## 3.1 Single Source of Truth (SSoT)

Authority order:

1. Contracts (events + errors)
2. Workflow state machines
3. This specification
4. UI

UI must not introduce behavior outside defined state machines.

---

## 3.2 Determinism

- No hidden transitions.
- No implicit step skipping.
- No UI shortcuts.
- Same inputs must always produce same outputs.
- No randomness unless seeded and documented.

---

## 3.3 Event-Sourced Logging

Every simulator action must emit a structured event conforming to:

docs/contracts/events.schema.json

No simulator action may occur without event emission.

Events are immutable.

---

# 4. Domain Model (High-Level)

## Trainee
- id
- trainingStatus
- completedModules
- performanceSummary

## CartSession
- id
- traineeId
- cartId
- roundNumber
- startTime
- endTime
- toteAssignments
- eventLog
- derivedMetrics

## PickTask
- id
- locationCode
- itemBarcode
- expectedTote
- quantityRequired

## Scenario
- id
- list of PickTasks
- toteCountRequired (site configurable)
- rulesetVersion

---

# 5. Event Model (Authoritative)

All simulator behavior must emit events defined in:

docs/contracts/events.schema.json

Categories include:

## RF / Navigation
- RF_LOGIN
- RF_MENU_SELECT
- RF_KEY_CTRL_T
- RF_TASK_GROUP_SET
- RF_ZONE_SELECTED

## Build Cart
- SCAN_CART_LABEL
- SCAN_TOTE_ASSIGN
- RF_KEY_CTRL_E

## Pick
- PICK_ASSIGN
- ARRIVE_LOCATION
- SCAN_ITEM
- ENTER_QUANTITY
- SCAN_TOTE_VERIFY
- RF_END_OF_TOTE_SHOWN
- RF_KEY_CTRL_A
- TOTE_PLACED_ON_CONVEYOR

## Exceptions
- RF_KEY_CTRL_W
- RF_KEY_CTRL_K
- EXCEPTION_TOTE_ALLOCATED
- EXCEPTION_CART_ALREADY_CREATED
- EXCEPTION_INCORRECT_LOCATION
- EXCEPTION_INCORRECT_TOTE
- EXCEPTION_INVALID_ITEM_LAST
- EXCEPTION_INVALID_ITEM_NOT_LAST
- EXCEPTION_SHORT_INVENTORY
- EXCEPTION_DAMAGED_ITEM

## Outcomes
- STEP_ACCEPTED
- STEP_REJECTED
- ERROR

No undocumented event types permitted.

---

# 6. Error Taxonomy (Authoritative)

All errors must use codes defined in:

docs/contracts/errors.json

Categories include:

## Sequence Errors
- ERR_SEQUENCE_TOTE_BEFORE_ITEM
- ERR_SEQUENCE_QTY_BEFORE_ITEM
- ERR_SEQUENCE_QTY_MISSING
- ERR_SEQUENCE_CTRL_E_TOO_EARLY
- ERR_SEQUENCE_CTRL_A_TOO_EARLY
- ERR_SEQUENCE_SETUP_INCOMPLETE

## Validation Errors
- ERR_WRONG_ITEM_SCANNED
- ERR_ITEM_NOT_RECOGNIZED
- ERR_WRONG_TOTE_SCANNED
- ERR_TOTE_DUPLICATE_IN_SETUP
- ERR_TOTE_SLOT_MISMATCH

## Operational Exceptions
- ERR_TOTE_ALREADY_ALLOCATED
- ERR_CART_ALREADY_CREATED
- ERR_SHORT_INVENTORY
- ERR_DAMAGED_ITEM
- ERR_INVALID_ITEM

Error codes may not be invented without updating contracts + workflows + tests.

---

# 7. Curriculum Structure

Track: GEODIS RF Picking Proficiency

Modules:

1. RF Navigation & Key Commands
2. Build Cart (Make Tote Cart BB)
3. Pick Execution Order
4. End Of Tote & Confirmation
5. Exception Handling
6. Certification Run

Each module must map to:
- Specific error modes
- Measurable KPI impact
- Workflow compliance validation

---

# 8. Acceptance Criteria (System-Level)

The simulator must:

- Enforce Build Cart ordering exactly as defined in workflows/build-cart.md
- Enforce Pick ordering exactly as defined in workflows/pick.md
- Require quantity entry before tote verification
- Require CTRL+A after End Of Tote before tote convey
- Support CTRL+W and CTRL+K deterministic behavior
- Emit valid events for every action
- Reject invalid transitions with structured error codes
- Pass contract validation against events.schema.json

---

# 9. Governance Rules

Any behavioral change requires:

1. Contract update (if event/error changes)
2. Workflow document update
3. Test updates
4. Acceptance checklist validation
5. Role + model declaration in proposal

No undocumented behavior is permitted.

---

# 10. Open Questions (Living Section)

These must be resolved with GEODIS before site-specific deployment:

- Is tote count fixed or dynamic per task group?
- How are zone codes standardized across facilities?
- Is quantity entry always manual?
- When exactly does "End Of Tote" trigger in production?
- What are official speed benchmarks per site?

Unknowns must be configurable defaults, not hard-coded assumptions.

---

# 11. Versioning

Spec Version: v2  
Aligned to BBWD-WI-030 (01/06/2025 revision)

Future changes must increment version and document rationale.
