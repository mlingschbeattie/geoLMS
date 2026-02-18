import type { AnyEvent } from "../contracts";
import type { EmittedResult } from "./types";

export function emit<TState>(state: TState, event: AnyEvent): EmittedResult<TState> {
  return {
    state,
    emitted: [event]
  };
}

export function emitMany<TState>(state: TState, events: readonly AnyEvent[]): EmittedResult<TState> {
  return {
    state,
    emitted: [...events]
  };
}
