// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { createEvent, type AnyEvent } from "../../src/contracts/events.js";
import { validateEvent } from "../../src/contracts/schema.js";
import { applyAction } from "../../src/sim/router.js";
import { createSession, type SessionState } from "../../src/sim/session.js";
import type { Scenario } from "../../src/sim/scenario.js";
import { mountScannerSimulatorV1 } from "../../src/ui/scannerSimulatorV1/mount.js";
import { createEngineScannerSimAdapter } from "../../src/ui/scannerSimulatorV1/engineAdapter.js";
import type { UiEvent } from "../../src/ui/scannerSimulatorV1/types.js";

function createScenarioFixture(): Scenario {
  return {
    version: "1.0.0",
    id: "scenario-ui-engine-adapter",
    mode: "guided",
    buildCart: {
      requiredToteCount: 1
    },
    pickTasks: [
      {
        pickTaskId: "PT-001",
        locationCode: "LOC-01-A-003",
        itemBarcode: "ITEM-01",
        expectedToteSlot: 1,
        quantityRequired: 1
      }
    ]
  };
}

function createEventFactory(traineeId: string, sessionId: string) {
  let seq = 0;

  return {
    build(type: AnyEvent["type"], payload: AnyEvent["payload"], timestampMs: number): AnyEvent {
      seq += 1;
      return createEvent({
        eventId: `ui-adapter-${seq.toString().padStart(4, "0")}`,
        timestamp: new Date(timestampMs).toISOString(),
        type,
        traineeId,
        sessionId,
        payload
      }) as AnyEvent;
    }
  };
}

describe("createEngineScannerSimAdapter", () => {
  it("maps engine session state into UI view model and updates after Enter submit", () => {
    const ids = { traineeId: "trainee-ui-1", sessionId: "session-ui-1" };
    const factory = createEventFactory(ids.traineeId, ids.sessionId);
    let session: SessionState = createSession(createScenarioFixture(), ids);
    let instructionText = "MARKER:INITIAL";
    const mappedUiEvents: UiEvent[] = [];
    let applyCount = 0;

    const adapter = createEngineScannerSimAdapter({
      getSessionState: () => session,
      setSessionState: (next: SessionState) => {
        session = next;
      },
      mapUiEventToEngineEvents: (uiEvent: UiEvent) => {
        mappedUiEvents.push(uiEvent);
        return [factory.build("RF_KEY_CTRL_T", {}, uiEvent.payload.timestampMs)];
      },
      applyActionToSession: (state: SessionState) => {
        applyCount += 1;
        instructionText = "MARKER:UPDATED";
        return state;
      },
      toViewModel: () => ({
        header: {
          timerText: "T",
          progressText: "P",
          errorText: "E",
          accuracyText: "A"
        },
        instructionText,
        feedback: {
          kind: "NONE"
        }
      })
    });

    const host = document.createElement("div");
    document.body.appendChild(host);

    const handle = mountScannerSimulatorV1(host, adapter, { now: () => 1700000000000 });
    const instruction = host.querySelector("[data-testid='rfv1-instruction']") as HTMLElement;
    const input = host.querySelector("[data-testid='rfv1-input']") as HTMLInputElement;

    expect(instruction.textContent).toBe("MARKER:INITIAL");

    input.value = "LOC-01-A-003";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

    expect(mappedUiEvents).toHaveLength(1);
    const submitted = mappedUiEvents[0];
    expect(submitted).toBeDefined();
    expect(submitted?.type).toBe("UI_SCAN_SUBMITTED");
    expect(applyCount).toBe(1);
    expect(instruction.textContent).toBe("MARKER:UPDATED");

    handle.destroy();
    host.remove();
  });

  it("validates all events before applying any event", () => {
    const ids = { traineeId: "trainee-ui-2", sessionId: "session-ui-2" };
    const factory = createEventFactory(ids.traineeId, ids.sessionId);
    let session: SessionState = createSession(createScenarioFixture(), ids);
    const order: string[] = [];

    const adapter = createEngineScannerSimAdapter({
      getSessionState: () => session,
      setSessionState: (next: SessionState) => {
        session = next;
      },
      mapUiEventToEngineEvents: () => [],
      validateEngineEvent: (event: AnyEvent) => {
        order.push(`validate:${event.type}`);
        const result = validateEvent(event);
        if (!result.ok) {
          throw new Error(`Invalid event ${event.type}`);
        }
      },
      applyActionToSession: (state: SessionState, event: AnyEvent) => {
        order.push(`apply:${event.type}`);
        return applyAction(state, event);
      }
    });

    const events: AnyEvent[] = [
      factory.build("RF_LOGIN", {}, 1700000000000),
      factory.build("RF_MENU_SELECT", { value: "1" }, 1700000000100)
    ];

    adapter.applyEngineEvents(events);

    expect(order).toEqual([
      "validate:RF_LOGIN",
      "validate:RF_MENU_SELECT",
      "apply:RF_LOGIN",
      "apply:RF_MENU_SELECT"
    ]);
  });
});
