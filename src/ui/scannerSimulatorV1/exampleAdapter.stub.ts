import type {
  ScannerSimAdapter,
  ScannerSimViewModel,
  UiEvent,
} from "./types.js";

export function createExampleScannerSimAdapter(params: {
  getEngineState: () => unknown;
  applyEngineEvents: (events: readonly unknown[]) => void;
  validateEngineEvent: (event: unknown) => void;
  mapUiEventToEngineEvents: (e: UiEvent) => readonly unknown[];
  toViewModel: (engineState: unknown) => ScannerSimViewModel;
}): ScannerSimAdapter {
  return {
    getViewModel(): ScannerSimViewModel {
      const engineState = params.getEngineState();
      return params.toViewModel(engineState);
    },

    mapUiEventToEngineEvents(event: UiEvent) {
      // TODO(repo-integration): Provide UI->engine event mapping in the integration layer.
      // This stub intentionally does not assume engine event shapes.
      const mappedEvents = params.mapUiEventToEngineEvents(event);
      return [...mappedEvents] as ReturnType<
        ScannerSimAdapter["mapUiEventToEngineEvents"]
      >;
    },

    validateEngineEvent(
      event: Parameters<ScannerSimAdapter["validateEngineEvent"]>[0],
    ) {
      params.validateEngineEvent(event);
    },

    applyEngineEvents(
      events: Parameters<ScannerSimAdapter["applyEngineEvents"]>[0],
    ) {
      for (const event of events) {
        params.validateEngineEvent(event);
      }

      params.applyEngineEvents(events as readonly unknown[]);
    },
  };
}

// This stub is intentionally non-opinionated.
// Mapping + view model generation must be implemented in the repo-specific integration layer.
// No workflow logic belongs here.

// Example usage (integration layer only; do not wire in this stub file):
//
// import { mount } from "./mount";
//
// const adapter = createExampleScannerSimAdapter({
//   getEngineState: () => {
//     throw new Error("NotImplemented: supply engine state accessor");
//   },
//   applyEngineEvents: () => {
//     throw new Error("NotImplemented: supply engine event applier");
//   },
//   validateEngineEvent: () => {
//     throw new Error("NotImplemented: supply schema validator");
//   },
//   mapUiEventToEngineEvents: () => {
//     throw new Error("NotImplemented: supply event mapping");
//   },
//   toViewModel: () => {
//     throw new Error("NotImplemented: supply view model mapper");
//   },
// });
//
// mount(rootElement, adapter);
