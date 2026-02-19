import type { ScannerSimAdapter, ScannerSimViewModel, UiEvent } from "./types.js";

export type ScannerSimulatorMountOptions = {
  now?: () => number;
  autoFocusOnMount?: boolean;
};

type DomRefs = {
  root: HTMLElement;
  timer: HTMLElement;
  progress: HTMLElement;
  error: HTMLElement;
  accuracy: HTMLElement;
  instruction: HTMLElement;
  instructionSubtext: HTMLElement;
  input: HTMLInputElement;
  feedbackPanel: HTMLElement;
  feedbackKind: HTMLElement;
  feedbackCode: HTMLElement;
  feedbackMessage: HTMLElement;
  lastScanEchoRow: HTMLElement;
  lastScanEchoValue: HTMLElement;
};

const FEEDBACK_FLASH_CLASS = "rfv1-feedback-flash";
const FEEDBACK_FLASH_DURATION_MS = 120;

export type ScannerSimulatorHandle = {
  render: () => void;
  focusInput: () => void;
  destroy: () => void;
};

function createLayout(host: HTMLElement): DomRefs {
  host.innerHTML = `
    <section class="rfv1-screen" data-testid="rfv1-screen">
      <header class="rfv1-header" data-testid="rfv1-header">
        <div class="rfv1-header-cell"><span class="rfv1-label">TIMER</span><strong data-testid="rfv1-timer"></strong></div>
        <div class="rfv1-header-cell"><span class="rfv1-label">PROGRESS</span><strong data-testid="rfv1-progress"></strong></div>
        <div class="rfv1-header-cell"><span class="rfv1-label">ERRORS</span><strong data-testid="rfv1-error"></strong></div>
        <div class="rfv1-header-cell"><span class="rfv1-label">ACCURACY</span><strong data-testid="rfv1-accuracy"></strong></div>
      </header>

      <section class="rfv1-instruction" data-testid="rfv1-instruction-wrap">
        <p class="rfv1-instruction-text" data-testid="rfv1-instruction"></p>
        <p class="rfv1-instruction-subtext" data-testid="rfv1-instruction-subtext"></p>
      </section>

      <section class="rfv1-input-panel" data-testid="rfv1-input-panel">
        <label class="rfv1-label" for="rfv1-input">SCANNER INPUT</label>
        <input id="rfv1-input" class="rfv1-input" data-testid="rfv1-input" autocomplete="off" spellcheck="false" />
      </section>

      <section class="rfv1-feedback" data-testid="rfv1-feedback">
        <strong class="rfv1-feedback-kind" data-testid="rfv1-feedback-kind"></strong>
        <span class="rfv1-feedback-code" data-testid="rfv1-feedback-code"></span>
        <p class="rfv1-feedback-message" data-testid="rfv1-feedback-message"></p>
      </section>

      <section class="rfv1-last-scan" data-testid="rfv1-last-scan">
        <span class="rfv1-label">LAST SCAN</span>
        <strong class="rfv1-last-scan-value" data-testid="rfv1-last-scan-value"></strong>
      </section>
    </section>
  `;

  return {
    root: host.querySelector("[data-testid='rfv1-screen']") as HTMLElement,
    timer: host.querySelector("[data-testid='rfv1-timer']") as HTMLElement,
    progress: host.querySelector("[data-testid='rfv1-progress']") as HTMLElement,
    error: host.querySelector("[data-testid='rfv1-error']") as HTMLElement,
    accuracy: host.querySelector("[data-testid='rfv1-accuracy']") as HTMLElement,
    instruction: host.querySelector("[data-testid='rfv1-instruction']") as HTMLElement,
    instructionSubtext: host.querySelector("[data-testid='rfv1-instruction-subtext']") as HTMLElement,
    input: host.querySelector("[data-testid='rfv1-input']") as HTMLInputElement,
    feedbackPanel: host.querySelector("[data-testid='rfv1-feedback']") as HTMLElement,
    feedbackKind: host.querySelector("[data-testid='rfv1-feedback-kind']") as HTMLElement,
    feedbackCode: host.querySelector("[data-testid='rfv1-feedback-code']") as HTMLElement,
    feedbackMessage: host.querySelector("[data-testid='rfv1-feedback-message']") as HTMLElement,
    lastScanEchoRow: host.querySelector("[data-testid='rfv1-last-scan']") as HTMLElement,
    lastScanEchoValue: host.querySelector("[data-testid='rfv1-last-scan-value']") as HTMLElement
  };
}

function renderViewModel(
  viewModel: ScannerSimViewModel,
  refs: DomRefs,
  previousFeedbackKind: ScannerSimViewModel["feedback"]["kind"] | null,
  clearFlashTimeout: () => void,
): ScannerSimViewModel["feedback"]["kind"] {
  refs.timer.textContent = viewModel.header.timerText;
  refs.progress.textContent = viewModel.header.progressText;
  refs.error.textContent = viewModel.header.errorText;
  refs.accuracy.textContent = viewModel.header.accuracyText;

  refs.instruction.textContent = viewModel.instructionText;

  refs.instructionSubtext.textContent = viewModel.instructionSubtext ?? "";
  refs.instructionSubtext.hidden = !viewModel.instructionSubtext;

  refs.feedbackKind.textContent = viewModel.feedback.kind;
  refs.feedbackKind.className = `rfv1-feedback-kind rfv1-feedback-${viewModel.feedback.kind.toLowerCase()}`;
  refs.feedbackCode.textContent = viewModel.feedback.code ?? "";
  refs.feedbackMessage.textContent = viewModel.feedback.message ?? "";
  refs.feedbackMessage.hidden = !viewModel.feedback.message;

  refs.lastScanEchoValue.textContent = viewModel.lastScanEcho ?? "";
  refs.lastScanEchoRow.hidden = !viewModel.lastScanEcho;

  if (previousFeedbackKind !== null && previousFeedbackKind !== viewModel.feedback.kind) {
    clearFlashTimeout();
    refs.feedbackPanel.classList.remove(FEEDBACK_FLASH_CLASS);
    refs.feedbackPanel.classList.add(FEEDBACK_FLASH_CLASS);
  }

  return viewModel.feedback.kind;
}

export function mountScannerSimulatorV1(
  host: HTMLElement,
  adapter: ScannerSimAdapter,
  options: ScannerSimulatorMountOptions = {}
): ScannerSimulatorHandle {
  const now = options.now ?? (() => Date.now());
  const refs = createLayout(host);
  let previousFeedbackKind: ScannerSimViewModel["feedback"]["kind"] | null = null;
  let feedbackFlashTimeout: ReturnType<typeof setTimeout> | null = null;

  const clearFeedbackFlashTimeout = (): void => {
    if (feedbackFlashTimeout !== null) {
      clearTimeout(feedbackFlashTimeout);
      feedbackFlashTimeout = null;
    }
  };

  const focusInput = (): void => {
    if (host.ownerDocument.activeElement !== refs.input) {
      refs.input.focus();
    }
  };

  const render = (): void => {
    const feedbackKind = renderViewModel(
      adapter.getViewModel(),
      refs,
      previousFeedbackKind,
      clearFeedbackFlashTimeout,
    );

    if (previousFeedbackKind !== null && previousFeedbackKind !== feedbackKind) {
      feedbackFlashTimeout = setTimeout(() => {
        refs.feedbackPanel.classList.remove(FEEDBACK_FLASH_CLASS);
        feedbackFlashTimeout = null;
      }, FEEDBACK_FLASH_DURATION_MS);
    }

    previousFeedbackKind = feedbackKind;
  };

  const onSubmit = (event: KeyboardEvent): void => {
    if (event.key !== "Enter") {
      return;
    }

    const uiEvent: UiEvent = {
      type: "UI_SCAN_SUBMITTED",
      payload: {
        value: refs.input.value,
        timestampMs: now(),
        source: "keyboard_wedge"
      }
    };

    refs.input.value = "";

    const engineEvents = adapter.mapUiEventToEngineEvents(uiEvent);
    adapter.applyEngineEvents(engineEvents);
    render();
  };

  const onBlur = (): void => {
    focusInput();
  };

  const onWindowFocus = (): void => {
    focusInput();
  };

  refs.input.addEventListener("keydown", onSubmit);
  refs.input.addEventListener("blur", onBlur);
  host.ownerDocument.defaultView?.addEventListener("focus", onWindowFocus);

  render();

  if (options.autoFocusOnMount !== false) {
    focusInput();
  }

  return {
    render,
    focusInput,
    destroy: () => {
      clearFeedbackFlashTimeout();
      refs.input.removeEventListener("keydown", onSubmit);
      refs.input.removeEventListener("blur", onBlur);
      host.ownerDocument.defaultView?.removeEventListener("focus", onWindowFocus);
      host.innerHTML = "";
    }
  };
}
