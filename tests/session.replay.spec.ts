import path from "node:path";
import { describe, expect, it } from "vitest";
import { createEvent, type AnyEvent } from "../src/contracts";
import { applyAction, createSession, getActivePickTask, loadScenarioFromFile, type SessionState } from "../src/sim";

function createActionFactory(traineeId: string, sessionId: string) {
  let index = 0;

  return {
    build<T extends AnyEvent["type"]>(type: T, payload: AnyEvent["payload"]): AnyEvent {
      index += 1;
      return createEvent({
        eventId: `sess-act-${index.toString().padStart(4, "0")}`,
        timestamp: `2026-02-18T12:00:${String(index).padStart(2, "0")}.000Z`,
        type,
        traineeId,
        sessionId,
        payload
      }) as AnyEvent;
    }
  };
}

function runActions(initial: SessionState, actions: readonly AnyEvent[]): SessionState {
  return actions.reduce((session, action) => applyAction(session, action), initial);
}

describe("session replay determinism", () => {
  it("produces identical final state and event log for identical input actions", () => {
    const scenario = loadScenarioFromFile(path.resolve("docs/fixtures/scenarios/scenario.session.happy.json"));

    const ids = { traineeId: "trainee-replay-1", sessionId: "session-replay-1" };
    const actionFactory = createActionFactory(ids.traineeId, ids.sessionId);

    const actions: readonly AnyEvent[] = [
      actionFactory.build("RF_LOGIN", {}),
      actionFactory.build("RF_MENU_SELECT", { value: "1" }),
      actionFactory.build("RF_MENU_SELECT", { value: "2" }),
      actionFactory.build("RF_KEY_CTRL_T", {}),
      actionFactory.build("RF_ZONE_SELECTED", { zoneOrTaskGroupCode: "ZONE-01" }),
      actionFactory.build("RF_MENU_SELECT", { value: "1" }),
      actionFactory.build("SCAN_CART_LABEL", { barcode: "CART-H-01" }),
      actionFactory.build("SCAN_TOTE_ASSIGN", { barcode: "TOTE-H-01", slotIndex: 1 }),
      actionFactory.build("SCAN_TOTE_ASSIGN", { barcode: "TOTE-H-02", slotIndex: 2 }),
      actionFactory.build("RF_KEY_CTRL_E", {}),
      actionFactory.build("RF_LOGIN", {}),
      actionFactory.build("RF_MENU_SELECT", { value: "1" }),
      actionFactory.build("RF_MENU_SELECT", { value: "2" }),
      actionFactory.build("PICK_ASSIGN", {}),
      actionFactory.build("ARRIVE_LOCATION", {}),
      actionFactory.build("SCAN_ITEM", { barcode: "ITEM-H-01" }),
      actionFactory.build("ENTER_QUANTITY", { quantity: 1 }),
      actionFactory.build("SCAN_TOTE_VERIFY", { barcode: "TOTE-H-01" })
    ];

    const run1 = runActions(createSession(scenario, ids), actions);
    const run2 = runActions(createSession(scenario, ids), actions);

    expect(run1).toEqual(run2);
    expect(run1.mode).toBe("pick");
    expect(run1.pick.cursor).toBe(1);
    expect(getActivePickTask(run1)?.pickTaskId).toBe("PT-H-002");
  });

  it("does not advance cursor on rejected pick action", () => {
    const scenario = loadScenarioFromFile(path.resolve("docs/fixtures/scenarios/scenario.session.happy.json"));
    const ids = { traineeId: "trainee-replay-2", sessionId: "session-replay-2" };
    const actionFactory = createActionFactory(ids.traineeId, ids.sessionId);

    const toPickMode: readonly AnyEvent[] = [
      actionFactory.build("RF_LOGIN", {}),
      actionFactory.build("RF_MENU_SELECT", { value: "1" }),
      actionFactory.build("RF_MENU_SELECT", { value: "2" }),
      actionFactory.build("RF_KEY_CTRL_T", {}),
      actionFactory.build("RF_ZONE_SELECTED", { zoneOrTaskGroupCode: "ZONE-01" }),
      actionFactory.build("RF_MENU_SELECT", { value: "1" }),
      actionFactory.build("SCAN_CART_LABEL", { barcode: "CART-H-01" }),
      actionFactory.build("SCAN_TOTE_ASSIGN", { barcode: "TOTE-H-01", slotIndex: 1 }),
      actionFactory.build("SCAN_TOTE_ASSIGN", { barcode: "TOTE-H-02", slotIndex: 2 }),
      actionFactory.build("RF_KEY_CTRL_E", {}),
      actionFactory.build("RF_LOGIN", {}),
      actionFactory.build("RF_MENU_SELECT", { value: "1" }),
      actionFactory.build("RF_MENU_SELECT", { value: "2" }),
      actionFactory.build("PICK_ASSIGN", {}),
      actionFactory.build("ARRIVE_LOCATION", {})
    ];

    const session = runActions(createSession(scenario, ids), toPickMode);
    const result = applyAction(session, actionFactory.build("SCAN_TOTE_VERIFY", { barcode: "TOTE-H-01" }));

    expect(result.pick.cursor).toBe(0);
    expect(result.metrics.totalRejected).toBeGreaterThan(0);
  });
});
