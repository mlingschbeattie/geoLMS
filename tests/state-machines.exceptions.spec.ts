import { describe, expect, it } from "vitest";
import { createEvent, type AnyEvent } from "../src/contracts";
import { createExceptionsInitialState, exceptionsReducer } from "../src/sim";
import { assertEmittedEventsValid } from "../src/sim/validate";

function createFactory() {
  let index = 0;

  return {
    event<T extends AnyEvent["type"]>(type: T, payload: AnyEvent["payload"]): AnyEvent {
      index += 1;
      return createEvent({
        eventId: `ex-event-${index}`,
        timestamp: "2026-02-18T12:00:00.000Z",
        type,
        traineeId: "trainee-1",
        sessionId: "session-1",
        payload
      }) as AnyEvent;
    }
  };
}

describe("exceptions state machine", () => {
  it("CTRL+W returns deterministically to previous stable state", () => {
    const factory = createFactory();
    let state = createExceptionsInitialState("PK_TASK_ACTIVE");

    const stable1 = factory.event("STEP_ACCEPTED", { stableState: "PK_AT_LOCATION" });
    const stable2 = factory.event("STEP_ACCEPTED", { stableState: "PK_ITEM_SCANNED" });

    state = exceptionsReducer(state, stable1).state;
    state = exceptionsReducer(state, stable2).state;

    const result = exceptionsReducer(state, factory.event("RF_KEY_CTRL_W", {}));
    assertEmittedEventsValid(result.emitted);

    expect(result.state.currentStableState).toBe("PK_AT_LOCATION");
    expect(result.state.stableHistory).toEqual(["PK_TASK_ACTIVE", "PK_AT_LOCATION"]);
    expect(result.state.history.length).toBeGreaterThan(state.history.length);
  });

  it("CTRL+K logs skip and advances pointer deterministically", () => {
    const factory = createFactory();
    const state = createExceptionsInitialState("PK_TASK_ACTIVE");

    const result = exceptionsReducer(state, factory.event("RF_KEY_CTRL_K", {}));
    assertEmittedEventsValid(result.emitted);

    expect(result.state.scenarioPointer).toBe(1);
    expect(result.emitted.some((event) => event.type === "EXCEPTION_SHORT_INVENTORY")).toBe(true);

    const errorEvent = result.emitted.find((event) => event.type === "ERROR");
    expect(errorEvent?.payload).toMatchObject({ errorCode: "ERR_SHORT_INVENTORY" });
  });
});
