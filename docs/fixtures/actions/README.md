# Action Fixtures

These fixtures are consumed by `src/cli/run-sim.ts`.

## Format

```json
{
  "actions": [
    {
      "eventId": "a1",
      "timestamp": "2026-02-18T10:00:00.000Z",
      "type": "RF_LOGIN",
      "traineeId": "t1",
      "sessionId": "s1",
      "payload": {}
    }
  ]
}
```

## Fixtures

- `actions.buildcart.pick.happy.json`: successful build-cart + pick path.
- `actions.pick.out-of-order.reject.json`: deterministic reject path (`ERR_SEQUENCE_QTY_MISSING`).