import { describe, expect, it } from "vitest";
import { createEvent, type AnyEvent } from "../src/contracts";
import { buildCartReducer, createBuildCartInitialState } from "../src/sim";
import { assertEmittedEventsValid } from "../src/sim/validate";

function createFactory() {
  let index = 0;

  return {
    event<T extends AnyEvent["type"]>(type: T, payload: AnyEvent["payload"]): AnyEvent {
      index += 1;
      return createEvent({
        eventId: `bc-event-${index}`,
        timestamp: "2026-02-18T12:00:00.000Z",
        type,
        traineeId: "trainee-1",
        sessionId: "session-1",
        payload
      }) as AnyEvent;
    }
  };
}

describe("build cart state machine", () => {
  it("runs happy path and reaches BC_STARTED", () => {
    const factory = createFactory();
    const config = { requiredToteCount: 3 };
    let state = createBuildCartInitialState();

    const sequence: readonly AnyEvent[] = [
      factory.event("RF_LOGIN", {}),
      factory.event("RF_MENU_SELECT", { value: "1" }),
      factory.event("RF_MENU_SELECT", { value: "2" }),
      factory.event("RF_KEY_CTRL_T", {}),
      factory.event("RF_ZONE_SELECTED", { zoneOrTaskGroupCode: "ZONE-A" }),
      factory.event("RF_MENU_SELECT", { value: "1" }),
      factory.event("SCAN_CART_LABEL", { barcode: "CART-1" }),
      factory.event("SCAN_TOTE_ASSIGN", { barcode: "TOTE-1", slotIndex: 1 }),
      factory.event("SCAN_TOTE_ASSIGN", { barcode: "TOTE-2", slotIndex: 2 }),
      factory.event("SCAN_TOTE_ASSIGN", { barcode: "TOTE-3", slotIndex: 3 }),
      factory.event("RF_KEY_CTRL_E", {})
    ];

    sequence.forEach((event) => {
      const result = buildCartReducer(state, event, config);
      assertEmittedEventsValid(result.emitted);
      state = result.state;
    });

    expect(state.status).toBe("BC_STARTED");
  });

  it("rejects CTRL+E when tote setup is incomplete", () => {
    const factory = createFactory();
    const config = { requiredToteCount: 2 };
    let state = createBuildCartInitialState();

    [
      factory.event("RF_LOGIN", {}),
      factory.event("RF_MENU_SELECT", { value: "1" }),
      factory.event("RF_MENU_SELECT", { value: "2" }),
      factory.event("RF_KEY_CTRL_T", {}),
      factory.event("RF_ZONE_SELECTED", { zoneOrTaskGroupCode: "ZONE-A" }),
      factory.event("RF_MENU_SELECT", { value: "1" }),
      factory.event("SCAN_CART_LABEL", { barcode: "CART-1" }),
      factory.event("SCAN_TOTE_ASSIGN", { barcode: "TOTE-1", slotIndex: 1 })
    ].forEach((event) => {
      state = buildCartReducer(state, event, config).state;
    });

    const result = buildCartReducer(state, factory.event("RF_KEY_CTRL_E", {}), config);
    assertEmittedEventsValid(result.emitted);

    const rejected = result.emitted.find((event) => event.type === "STEP_REJECTED");
    const error = result.emitted.find((event) => event.type === "ERROR");

    expect(rejected?.payload).toMatchObject({ errorCode: "ERR_SEQUENCE_CTRL_E_TOO_EARLY" });
    expect(error?.payload).toMatchObject({ errorCode: "ERR_SEQUENCE_CTRL_E_TOO_EARLY" });
  });

  it("rejects duplicate tote barcode", () => {
    const factory = createFactory();
    const config = { requiredToteCount: 2 };
    let state = createBuildCartInitialState();

    [
      factory.event("RF_LOGIN", {}),
      factory.event("RF_MENU_SELECT", { value: "1" }),
      factory.event("RF_MENU_SELECT", { value: "2" }),
      factory.event("RF_KEY_CTRL_T", {}),
      factory.event("RF_ZONE_SELECTED", { zoneOrTaskGroupCode: "ZONE-A" }),
      factory.event("RF_MENU_SELECT", { value: "1" }),
      factory.event("SCAN_CART_LABEL", { barcode: "CART-1" }),
      factory.event("SCAN_TOTE_ASSIGN", { barcode: "TOTE-1", slotIndex: 1 })
    ].forEach((event) => {
      state = buildCartReducer(state, event, config).state;
    });

    const result = buildCartReducer(
      state,
      factory.event("SCAN_TOTE_ASSIGN", { barcode: "TOTE-1", slotIndex: 2 }),
      config
    );

    assertEmittedEventsValid(result.emitted);
    const rejected = result.emitted.find((event) => event.type === "STEP_REJECTED");

    expect(rejected?.payload).toMatchObject({ errorCode: "ERR_TOTE_DUPLICATE_IN_SETUP" });
  });
});
