// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { mountScannerSimulatorV1 } from "../../src/ui/scannerSimulatorV1/mount";
import type {
  EngineEvent,
  ScannerSimAdapter,
  ScannerSimViewModel,
  UiEvent
} from "../../src/ui/scannerSimulatorV1/types";

function makeViewModel(): ScannerSimViewModel {
  return {
    header: {
      timerText: "00:31",
      progressText: "1/5",
      errorText: "0",
      accuracyText: "100%"
    },
    instructionText: "SCAN BIN 01-A-003",
    feedback: {
      kind: "NONE"
    }
  };
}

function makeViewModelWithPresentation(): ScannerSimViewModel {
  return {
    ...makeViewModel(),
    instructionSubtext: "VERIFY LABEL BEFORE CONFIRM",
    feedback: {
      kind: "WARNING",
      message: "SCAN DID NOT MATCH EXPECTED FORMAT"
    },
    lastScanEcho: "LOC-01-A-003"
  };
}

function makeViewModelWithHistory(scanHistory: readonly string[]): ScannerSimViewModel {
  return {
    ...makeViewModel(),
    scanHistory
  };
}

describe("mountScannerSimulatorV1", () => {
  it("focuses input on mount", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    const adapter: ScannerSimAdapter = {
      getViewModel: () => makeViewModel(),
      mapUiEventToEngineEvents: () => [],
      validateEngineEvent: () => {},
      applyEngineEvents: () => {}
    };

    const handle = mountScannerSimulatorV1(host, adapter);
    const input = host.querySelector("[data-testid='rfv1-input']") as HTMLInputElement;

    expect(document.activeElement).toBe(input);

    handle.destroy();
    host.remove();
  });

  it("re-focuses input after blur", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    const adapter: ScannerSimAdapter = {
      getViewModel: () => makeViewModel(),
      mapUiEventToEngineEvents: () => [],
      validateEngineEvent: () => {},
      applyEngineEvents: () => {}
    };

    const handle = mountScannerSimulatorV1(host, adapter);
    const input = host.querySelector("[data-testid='rfv1-input']") as HTMLInputElement;

    input.dispatchEvent(new Event("blur"));

    expect(document.activeElement).toBe(input);

    handle.destroy();
    host.remove();
  });

  it("submits trimmed UI_SCAN_SUBMITTED on Enter and clears input", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    const seenUiEvents: UiEvent[] = [];
    const adapter: ScannerSimAdapter = {
      getViewModel: () => makeViewModel(),
      mapUiEventToEngineEvents: (event) => {
        seenUiEvents.push(event);
        return [];
      },
      validateEngineEvent: () => {},
      applyEngineEvents: () => {}
    };

    const handle = mountScannerSimulatorV1(host, adapter, { now: () => 1700000000000 });
    const input = host.querySelector("[data-testid='rfv1-input']") as HTMLInputElement;

    input.value = "  LOC-01-A-003  ";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

    expect(input.value).toBe("");
    expect(seenUiEvents).toHaveLength(1);
    expect(seenUiEvents[0]).toEqual({
      type: "UI_SCAN_SUBMITTED",
      payload: {
        value: "LOC-01-A-003",
        timestampMs: 1700000000000,
        source: "keyboard_wedge"
      }
    });

    handle.destroy();
    host.remove();
  });

  it("does not submit when input is empty or whitespace", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    const seenUiEvents: UiEvent[] = [];
    let applyCalls = 0;

    const adapter: ScannerSimAdapter = {
      getViewModel: () => makeViewModel(),
      mapUiEventToEngineEvents: (event) => {
        seenUiEvents.push(event);
        return [];
      },
      validateEngineEvent: () => {},
      applyEngineEvents: () => {
        applyCalls += 1;
      }
    };

    const handle = mountScannerSimulatorV1(host, adapter, { now: () => 1700000000000 });
    const input = host.querySelector("[data-testid='rfv1-input']") as HTMLInputElement;

    input.value = "   ";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

    expect(input.value).toBe("");
    expect(seenUiEvents).toHaveLength(0);
    expect(applyCalls).toBe(0);

    handle.destroy();
    host.remove();
  });

  it("calls applyEngineEvents with mapped events", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    const order: string[] = [];
    const mappedEvents: EngineEvent[] = [
      { token: "evt-1" },
      { token: "evt-2" }
    ];

    let appliedEvents: EngineEvent[] = [];

    const adapter: ScannerSimAdapter = {
      getViewModel: () => makeViewModel(),
      mapUiEventToEngineEvents: () => {
        order.push("map");
        return mappedEvents;
      },
      validateEngineEvent: () => {},
      applyEngineEvents: (events) => {
        order.push("apply");
        appliedEvents = events;
      }
    };

    const handle = mountScannerSimulatorV1(host, adapter, { now: () => 1 });
    const input = host.querySelector("[data-testid='rfv1-input']") as HTMLInputElement;

    input.value = "ABC";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

    expect(order).toEqual(["map", "apply"]);
    expect(appliedEvents).toBe(mappedEvents);

    handle.destroy();
    host.remove();
  });

  it("renders instruction subtext when present", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    const adapter: ScannerSimAdapter = {
      getViewModel: () => makeViewModelWithPresentation(),
      mapUiEventToEngineEvents: () => [],
      validateEngineEvent: () => {},
      applyEngineEvents: () => {}
    };

    const handle = mountScannerSimulatorV1(host, adapter);
    const subtext = host.querySelector("[data-testid='rfv1-instruction-subtext']") as HTMLElement;

    expect(subtext.textContent).toBe("VERIFY LABEL BEFORE CONFIRM");
    expect(subtext.hidden).toBe(false);

    handle.destroy();
    host.remove();
  });

  it("renders feedback message when present", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    const adapter: ScannerSimAdapter = {
      getViewModel: () => makeViewModelWithPresentation(),
      mapUiEventToEngineEvents: () => [],
      validateEngineEvent: () => {},
      applyEngineEvents: () => {}
    };

    const handle = mountScannerSimulatorV1(host, adapter);
    const message = host.querySelector("[data-testid='rfv1-feedback-message']") as HTMLElement;

    expect(message.textContent).toBe("SCAN DID NOT MATCH EXPECTED FORMAT");
    expect(message.hidden).toBe(false);

    handle.destroy();
    host.remove();
  });

  it("renders last scan echo when present", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    const adapter: ScannerSimAdapter = {
      getViewModel: () => makeViewModelWithPresentation(),
      mapUiEventToEngineEvents: () => [],
      validateEngineEvent: () => {},
      applyEngineEvents: () => {}
    };

    const handle = mountScannerSimulatorV1(host, adapter);
    const lastScan = host.querySelector("[data-testid='rfv1-last-scan-value']") as HTMLElement;
    const lastScanRow = host.querySelector("[data-testid='rfv1-last-scan']") as HTMLElement;

    expect(lastScan.textContent).toBe("LOC-01-A-003");
    expect(lastScanRow.hidden).toBe(false);

    handle.destroy();
    host.remove();
  });

  it("renders scan history when present (up to 3, most-recent-first)", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    const adapter: ScannerSimAdapter = {
      getViewModel: () => makeViewModelWithHistory(["A", "B", "C", "D"]),
      mapUiEventToEngineEvents: () => [],
      validateEngineEvent: () => {},
      applyEngineEvents: () => {}
    };

    const handle = mountScannerSimulatorV1(host, adapter);
    const historyRow = host.querySelector("[data-testid='rfv1-history']") as HTMLElement;
    const historyList = host.querySelector("[data-testid='rfv1-history-list']") as HTMLOListElement;
    const historyItems = Array.from(historyList.querySelectorAll("li"));

    expect(historyRow.hidden).toBe(false);
    expect(historyItems).toHaveLength(3);
    expect(historyItems.map((item) => item.textContent)).toEqual(["A", "B", "C"]);

    handle.destroy();
    host.remove();
  });

  it("hides scan history when absent", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    const adapter: ScannerSimAdapter = {
      getViewModel: () => makeViewModel(),
      mapUiEventToEngineEvents: () => [],
      validateEngineEvent: () => {},
      applyEngineEvents: () => {}
    };

    const handle = mountScannerSimulatorV1(host, adapter);
    const historyRow = host.querySelector("[data-testid='rfv1-history']") as HTMLElement;
    const historyList = host.querySelector("[data-testid='rfv1-history-list']") as HTMLOListElement;

    expect(historyRow.hidden).toBe(true);
    expect(historyList.querySelectorAll("li")).toHaveLength(0);

    handle.destroy();
    host.remove();
  });

  it("applies feedback flash class when feedback kind changes on re-render", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    let viewModel: ScannerSimViewModel = {
      ...makeViewModel(),
      feedback: {
        kind: "NONE"
      }
    };

    const adapter: ScannerSimAdapter = {
      getViewModel: () => viewModel,
      mapUiEventToEngineEvents: () => [],
      validateEngineEvent: () => {},
      applyEngineEvents: () => {}
    };

    const handle = mountScannerSimulatorV1(host, adapter);
    const feedback = host.querySelector("[data-testid='rfv1-feedback']") as HTMLElement;

    expect(feedback.classList.contains("rfv1-feedback-flash")).toBe(false);

    viewModel = {
      ...viewModel,
      feedback: {
        kind: "ERROR"
      }
    };

    handle.render();

    expect(feedback.classList.contains("rfv1-feedback-flash")).toBe(true);

    handle.destroy();
    host.remove();
  });
});
