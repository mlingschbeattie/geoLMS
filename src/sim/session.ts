import type { AnyEvent } from "../contracts";
import { createBuildCartInitialState, type BuildCartConfig, type BuildCartState } from "./state-machines/buildCart";
import { createPickInitialState, type PickState } from "./state-machines/pick";
import type { PickTask, Scenario } from "./scenario";
import { createZeroMetrics, type DerivedMetrics } from "./metrics";

export type SessionMode = "buildCart" | "pick";

export type SessionState = {
  mode: SessionMode;
  scenarioId: string;
  traineeId: string;
  sessionId: string;
  scenario: Scenario;
  buildCart: {
    state: BuildCartState;
    config: BuildCartConfig;
  };
  pick: {
    state: PickState;
    config: Record<string, never>;
    cursor: number;
    activePickTaskId?: string;
    endOfTotePending: boolean;
  };
  eventLog: readonly AnyEvent[];
  metrics: DerivedMetrics;
};

export function createSession(
  scenario: Scenario,
  ids: { traineeId: string; sessionId: string }
): SessionState {
  return {
    mode: "buildCart",
    scenarioId: scenario.id,
    traineeId: ids.traineeId,
    sessionId: ids.sessionId,
    scenario,
    buildCart: {
      state: createBuildCartInitialState(),
      config: {
        requiredToteCount: scenario.buildCart.requiredToteCount
      }
    },
    pick: {
      state: createPickInitialState(),
      config: {},
      cursor: 0,
      activePickTaskId: undefined,
      endOfTotePending: false
    },
    eventLog: [],
    metrics: createZeroMetrics()
  };
}

export function getActivePickTask(session: SessionState): PickTask | null {
  if (session.mode !== "pick") {
    return null;
  }

  return session.scenario.pickTasks[session.pick.cursor] ?? null;
}
