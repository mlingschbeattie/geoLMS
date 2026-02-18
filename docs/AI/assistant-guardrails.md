# AI Guardrails – GEODIS Picker LMS (v2)

1) Authoritative Source:
- BBWD-WI-030 and approved site docs override all other assumptions. :contentReference[oaicite:7]{index=7}

2) No Hallucination:
- Do not invent barcode formats, scanner types, site rules, or performance targets.
- Unknowns go to Open Questions and become configurable defaults.

3) Determinism:
- No hidden UI rules.
- Same inputs -> same outputs.

4) Events Required:
- Every simulator action emits a structured, schema-validated event.

5) Workflow Enforcement:
- Implement behavior only via state machines:
  - Build Cart (WI 5.1)
  - Pick (WI 5.2)
  - Exceptions (WI 6.x)

6) Response Format (Mandatory):
- Declare ROLE and MODEL at the top.
- Reference relevant spec/workflow sections.
- For any change: schema updates, workflow updates, acceptance criteria, test cases.
