import path from "node:path";
import { describe, expect, it } from "vitest";
import { createEvent, type AnyEvent } from "../src/contracts";
import { applyAction, createSession, loadScenarioFromFile } from "../src/sim";

function createActionFactory(traineeId: string, sessionId: string) {
  let index = 0;

  return {
    build<T extends AnyEvent["type"]>(type: T, payload: AnyEvent["payload"]): AnyEvent {
      index += 1;
      return createEvent({
        eventId: `sess-metrics-${index.toString().padStart(4, "0")}`,
        timestamp: `2026-02-18T13:00:${String(index).padStart(2, "0")}.000Z`,
        type,
        traineeId,
        sessionId,
        payload
      }) as AnyEvent;
    }
  };
}

describe("session metrics", () => {
  it("computes deterministic totals and rejectedByError", () => {
    const scenario = loadScenarioFromFile(path.resolve("docs/fixtures/scenarios/scenario.minimal.pick.json"));
    const ids = { traineeId: "trainee-metrics-1", sessionId: "session-metrics-1" };
    const actionFactory = createActionFactory(ids.traineeId, ids.sessionId);

    const actions: readonly AnyEvent[] = [
      actionFactory.build("RF_LOGIN", {}),
      actionFactory.build("RF_MENU_SELECT", { value: "1" }),
      actionFactory.build("RF_MENU_SELECT", { value: "2" }),
      actionFactory.build("RF_KEY_CTRL_T", {}),
      actionFactory.build("RF_ZONE_SELECTED", { zoneOrTaskGroupCode: "ZONE-02" }),
      actionFactory.build("RF_MENU_SELECT", { value: "1" }),
      actionFactory.build("SCAN_CART_LABEL", { barcode: "CART-M-01" }),
      actionFactory.build("RF_KEY_CTRL_E", {})
    ];

    const finalSession = actions.reduce(
      (session, action) => applyAction(session, action),
      createSession(scenario, ids)
    );

    expect(finalSession.metrics.totalActions).toBe(actions.length);
    expect(finalSession.metrics.totalAccepted).toBe(7);
    expect(finalSession.metrics.totalRejected).toBe(1);
    expect(finalSession.metrics.rejectedByError.ERR_SEQUENCE_CTRL_E_TOO_EARLY).toBe(1);
  });
});
