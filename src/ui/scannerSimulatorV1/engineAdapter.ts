import { validateEvent } from "../../contracts/schema.js";
import type { AnyEvent } from "../../contracts/events.js";
import { applyAction } from "../../sim/router.js";
import type { SessionState } from "../../sim/session.js";
import type { ScannerSimAdapter, ScannerSimViewModel, UiEvent } from "./types.js";

export type EngineAdapterViewDefaults = {
  timerText: string;
  progressText: string;
  errorText: string;
  accuracyText: string;
  instructionText: string;
};

export const DEFAULT_ENGINE_ADAPTER_VIEW_DEFAULTS: Readonly<EngineAdapterViewDefaults> = Object.freeze({
  timerText: "--:--",
  progressText: "0/0",
  errorText: "0",
  accuracyText: "--",
  instructionText: "READY"
});

export type CreateEngineScannerSimAdapterParams = {
  getSessionState: () => SessionState;
  setSessionState: (next: SessionState) => void;
  mapUiEventToEngineEvents: (event: UiEvent, session: SessionState) => readonly AnyEvent[];
  applyActionToSession?: (session: SessionState, event: AnyEvent) => SessionState;
  validateEngineEvent?: (event: AnyEvent) => void;
  toViewModel?: (session: SessionState, defaults: Readonly<EngineAdapterViewDefaults>) => ScannerSimViewModel;
  viewDefaults?: Partial<EngineAdapterViewDefaults>;
};

function defaultValidateEngineEvent(event: AnyEvent): void {
  const result = validateEvent(event);
  if (!result.ok) {
    throw new Error(`Invalid engine event ${event.type}: ${(result.errors ?? []).join(" | ")}`);
  }
}

function defaultToViewModel(_session: SessionState, defaults: Readonly<EngineAdapterViewDefaults>): ScannerSimViewModel {
  return {
    header: {
      timerText: defaults.timerText,
      progressText: defaults.progressText,
      errorText: defaults.errorText,
      accuracyText: defaults.accuracyText
    },
    instructionText: defaults.instructionText,
    feedback: {
      kind: "NONE"
    }
  };
}

export function createEngineScannerSimAdapter(params: CreateEngineScannerSimAdapterParams): ScannerSimAdapter {
  const defaults: Readonly<EngineAdapterViewDefaults> = {
    ...DEFAULT_ENGINE_ADAPTER_VIEW_DEFAULTS,
    ...params.viewDefaults
  };

  const validateEventOrThrow = params.validateEngineEvent ?? defaultValidateEngineEvent;
  const reduceSession = params.applyActionToSession ?? applyAction;
  const mapViewModel = params.toViewModel ?? defaultToViewModel;

  return {
    getViewModel(): ScannerSimViewModel {
      const session = params.getSessionState();
      return mapViewModel(session, defaults);
    },

    mapUiEventToEngineEvents(event: UiEvent): AnyEvent[] {
      const session = params.getSessionState();
      return [...params.mapUiEventToEngineEvents(event, session)];
    },

    validateEngineEvent(event: AnyEvent): void {
      validateEventOrThrow(event);
    },

    applyEngineEvents(events: AnyEvent[]): void {
      for (const event of events) {
        validateEventOrThrow(event);
      }

      let nextSession = params.getSessionState();
      for (const event of events) {
        nextSession = reduceSession(nextSession, event);
      }

      params.setSessionState(nextSession);
    }
  };
}
