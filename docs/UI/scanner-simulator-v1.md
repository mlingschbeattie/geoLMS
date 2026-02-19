# Scanner Simulator V1 (MVP)

## Purpose

Single-screen RF scanner simulator UI as a pure render layer over deterministic engine state.

## Runtime Boundaries

- UI owns: rendering, keyboard focus lock, scanner wedge capture.
- Engine owns: workflow sequence, validation, penalties, scoring, next-step truth.
- UI must only consume `ScannerSimViewModel` and emit schema-valid engine events through adapter mapping.

## Module Surface

- `src/ui/scannerSimulatorV1/types.ts`
  - `UiEvent` (`UI_SCAN_SUBMITTED`)
  - `ScannerSimViewModel`
  - `ScannerSimAdapter`
- `src/ui/scannerSimulatorV1/mount.ts`
  - `mountScannerSimulatorV1(host, adapter, options)`
- `src/ui/scannerSimulatorV1/styles.css`
  - industrial RF visual tokens and single-screen layout classes

## Event Wiring

1. User scans into focused input (keyboard wedge).
2. Enter key emits UI event:
  - `type: UI_SCAN_SUBMITTED`
  - `payload.value`
  - `payload.timestampMs`
  - `payload.source: "keyboard_wedge"`
3. Adapter converts `UI_SCAN_SUBMITTED` to one or more schema-valid engine events (`AnyEvent`).
4. UI validates each emitted engine event with `validateEngineEvent()` before dispatch.
5. Adapter applies events to engine; UI re-renders from new engine-provided view model.

## Focus Management

- Input is auto-focused on mount.
- On `blur`, input immediately refocuses.
- On window focus regain, input refocuses.
- No mouse interaction is required to continue scanning.

## Mounting

```ts
import { mountScannerSimulatorV1 } from "./src/ui/scannerSimulatorV1/mount";

const handle = mountScannerSimulatorV1(hostElement, adapter, {
  now: () => Date.now(),
  autoFocusOnMount: true
});

// optional
handle.render();
handle.focusInput();
handle.destroy();
```

## Styling Tokens

- Background: `--rfv1-bg`
- Panel: `--rfv1-panel`, `--rfv1-border`
- Text: `--rfv1-text`, `--rfv1-muted`
- Success: `--rfv1-success`
- Error: `--rfv1-error`
- Warning: `--rfv1-warning`
- Focus ring: `--rfv1-focus`

All styling uses a dark industrial RF aesthetic, monospace text, and high-contrast colors.

## Constraints Compliance

- Single screen only; no routing.
- No workflow logic in UI.
- No scoring calculations in UI.
- No randomness.
- No hidden transitions.
