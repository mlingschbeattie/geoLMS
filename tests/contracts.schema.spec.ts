import { describe, expect, it } from "vitest";
import { createEvent, validateEvent } from "../src/contracts";

describe("events schema validation", () => {
  it("validates minimal SCAN_ITEM", () => {
    const event = createEvent({
      eventId: "ev-scan-item",
      timestamp: "2026-02-18T12:00:00.000Z",
      type: "SCAN_ITEM",
      traineeId: "t1",
      sessionId: "s1",
      payload: { barcode: "ITEM-001" }
    });

    expect(validateEvent(event).ok).toBe(true);
  });

  it("validates minimal ENTER_QUANTITY", () => {
    const event = createEvent({
      eventId: "ev-enter-qty",
      timestamp: "2026-02-18T12:00:00.000Z",
      type: "ENTER_QUANTITY",
      traineeId: "t1",
      sessionId: "s1",
      payload: { quantity: 1 }
    });

    expect(validateEvent(event).ok).toBe(true);
  });

  it("validates minimal ERROR", () => {
    const event = createEvent({
      eventId: "ev-error",
      timestamp: "2026-02-18T12:00:00.000Z",
      type: "ERROR",
      traineeId: "t1",
      sessionId: "s1",
      payload: { errorCode: "ERR_SEQUENCE_QTY_MISSING" }
    });

    expect(validateEvent(event).ok).toBe(true);
  });

  it("fails invalid events", () => {
    const invalidMissingField = {
      eventId: "ev-invalid-1",
      timestamp: "2026-02-18T12:00:00.000Z",
      type: "SCAN_ITEM",
      traineeId: "t1",
      sessionId: "s1",
      payload: {}
    };

    const invalidUnknownType = {
      eventId: "ev-invalid-2",
      timestamp: "2026-02-18T12:00:00.000Z",
      type: "UNKNOWN_EVENT",
      traineeId: "t1",
      sessionId: "s1",
      payload: {}
    };

    expect(validateEvent(invalidMissingField as never).ok).toBe(false);
    expect(validateEvent(invalidUnknownType as never).ok).toBe(false);
  });
});
