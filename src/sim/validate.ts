import { validateEvent } from "../contracts";
import type { AnyEvent } from "../contracts";

export function validateEmittedEvents(events: readonly AnyEvent[]): { ok: boolean; errors: string[] } {
  const failures: string[] = [];

  events.forEach((event, index) => {
    const result = validateEvent(event);
    if (!result.ok) {
      failures.push(`event[${index}] ${event.type}: ${(result.errors ?? []).join(" | ")}`);
    }
  });

  return {
    ok: failures.length === 0,
    errors: failures
  };
}

export function assertEmittedEventsValid(events: readonly AnyEvent[]): void {
  const result = validateEmittedEvents(events);
  if (!result.ok) {
    throw new Error(`Schema validation failed for emitted events:\n${result.errors.join("\n")}`);
  }
}
