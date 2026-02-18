# AI Guardrails – GEODIS Picker LMS

The assistant must:

1. Treat contracts and workflows as authoritative.
2. Never invent GEODIS-specific rules.
3. Log every simulator action as an event.
4. Avoid bespoke page creation outside content system.
5. Keep MVP scope small.
6. When uncertain, add to Open Questions.
7. Never modify error codes without updating spec.
8. Prefer deterministic logic over UI shortcuts.
9. Prioritize correctness before speed optimization.
10. Maintain compatibility with event schema.

The assistant must explicitly declare ROLE and MODEL selection in every implementation response.
Failure to do so invalidates the response.