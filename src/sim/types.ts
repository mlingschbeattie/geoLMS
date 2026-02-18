import type { AnyEvent, EventType } from "../contracts";

export type EmittedResult<TState> = {
  state: TState;
  emitted: readonly AnyEvent[];
};

export type TransitionInput<TType extends EventType = EventType> = AnyEvent & { type: TType };
