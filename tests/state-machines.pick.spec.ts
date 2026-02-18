import { describe, expect, it } from "vitest";
import { createEvent, type AnyEvent } from "../src/contracts";
import { createPickInitialState, pickReducer } from "../src/sim";
import { assertEmittedEventsValid } from "../src/sim/validate";

function createFactory() {
  let index = 0;

  return {
    event<T extends AnyEvent["type"]>(type: T, payload: AnyEvent["payload"]): AnyEvent {
      index += 1;
      return createEvent({
        eventId: `pk-event-${index}`,
        timestamp: "2026-02-18T12:00:00.000Z",
        type,
        traineeId: "trainee-1",
        sessionId: "session-1",
        payload
      }) as AnyEvent;
    }
  };
}

describe("pick state machine", () => {
  it("runs happy path including end-of-tote sequence", () => {
    const factory = createFactory();
    let state = createPickInitialState();

    const sequence: readonly AnyEvent[] = [
      factory.event("RF_LOGIN", {}),
      factory.event("RF_MENU_SELECT", { value: "1" }),
      factory.event("RF_MENU_SELECT", { value: "2" }),
      factory.event("PICK_ASSIGN", {}),
      factory.event("ARRIVE_LOCATION", {}),
      factory.event("SCAN_ITEM", { barcode: "ITEM-1" }),
      factory.event("ENTER_QUANTITY", { quantity: 1 }),
      factory.event("SCAN_TOTE_VERIFY", { barcode: "TOTE-1" }),
      factory.event("RF_END_OF_TOTE_SHOWN", {}),
      factory.event("RF_KEY_CTRL_A", {}),
      factory.event("TOTE_PLACED_ON_CONVEYOR", {})
    ];

    sequence.forEach((event) => {
      const result = pickReducer(state, event);
      assertEmittedEventsValid(result.emitted);
      state = result.state;
    });

    expect(state.status).toBe("PK_TOTE_CONVEYED");
  });

  it("rejects tote verify before item", () => {
    const factory = createFactory();
    let state = createPickInitialState();

    [
      factory.event("RF_LOGIN", {}),
      factory.event("RF_MENU_SELECT", { value: "1" }),
      factory.event("RF_MENU_SELECT", { value: "2" }),
      factory.event("PICK_ASSIGN", {}),
      factory.event("ARRIVE_LOCATION", {})
    ].forEach((event) => {
      state = pickReducer(state, event).state;
    });

    const result = pickReducer(state, factory.event("SCAN_TOTE_VERIFY", { barcode: "TOTE-1" }));
    assertEmittedEventsValid(result.emitted);

    const rejected = result.emitted.find((event) => event.type === "STEP_REJECTED");
    expect(rejected?.payload).toMatchObject({ errorCode: "ERR_SEQUENCE_TOTE_BEFORE_ITEM" });
  });

  it("rejects tote verify when quantity is missing", () => {
    const factory = createFactory();
    let state = createPickInitialState();

    [
      factory.event("RF_LOGIN", {}),
      factory.event("RF_MENU_SELECT", { value: "1" }),
      factory.event("RF_MENU_SELECT", { value: "2" }),
      factory.event("PICK_ASSIGN", {}),
      factory.event("ARRIVE_LOCATION", {}),
      factory.event("SCAN_ITEM", { barcode: "ITEM-1" })
    ].forEach((event) => {
      state = pickReducer(state, event).state;
    });

    const result = pickReducer(state, factory.event("SCAN_TOTE_VERIFY", { barcode: "TOTE-1" }));
    assertEmittedEventsValid(result.emitted);

    const rejected = result.emitted.find((event) => event.type === "STEP_REJECTED");
    expect(rejected?.payload).toMatchObject({ errorCode: "ERR_SEQUENCE_QTY_MISSING" });
  });

  it("rejects CTRL+A before end-of-tote prompt", () => {
    const factory = createFactory();
    let state = createPickInitialState();

    [
      factory.event("RF_LOGIN", {}),
      factory.event("RF_MENU_SELECT", { value: "1" }),
      factory.event("RF_MENU_SELECT", { value: "2" }),
      factory.event("PICK_ASSIGN", {}),
      factory.event("ARRIVE_LOCATION", {}),
      factory.event("SCAN_ITEM", { barcode: "ITEM-1" }),
      factory.event("ENTER_QUANTITY", { quantity: 1 }),
      factory.event("SCAN_TOTE_VERIFY", { barcode: "TOTE-1" })
    ].forEach((event) => {
      state = pickReducer(state, event).state;
    });

    const result = pickReducer(state, factory.event("RF_KEY_CTRL_A", {}));
    assertEmittedEventsValid(result.emitted);

    const rejected = result.emitted.find((event) => event.type === "STEP_REJECTED");
    expect(rejected?.payload).toMatchObject({ errorCode: "ERR_SEQUENCE_CTRL_A_TOO_EARLY" });
  });
});
