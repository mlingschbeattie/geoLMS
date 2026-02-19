export type EngineEvent = unknown;

export type UiScanSubmittedEvent = {
  type: "UI_SCAN_SUBMITTED";
  payload: {
    value: string;
    timestampMs: number;
    source: "keyboard_wedge";
  };
};

export type UiEvent = UiScanSubmittedEvent;

export type ScannerSimViewModel = {
  header: {
    timerText: string;
    progressText: string;
    errorText: string;
    accuracyText: string;
  };
  instructionText: string;
  instructionSubtext?: string;
  feedback: {
    kind: "NONE" | "SUCCESS" | "WARNING" | "ERROR";
    code?: string;
    message?: string;
  };
  lastScanEcho?: string;
};

export type ScannerSimAdapter = {
  getViewModel(): ScannerSimViewModel;
  mapUiEventToEngineEvents(event: UiEvent): EngineEvent[];
  validateEngineEvent(event: EngineEvent): void;
  applyEngineEvents(events: EngineEvent[]): void;
};
