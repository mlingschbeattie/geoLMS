import { createBuildCartInitialState } from "./state-machines/buildCart";
import { createPickInitialState } from "./state-machines/pick";
import { createZeroMetrics } from "./metrics";
export function createSession(scenario, ids) {
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
export function getActivePickTask(session) {
    if (session.mode !== "pick") {
        return null;
    }
    return session.scenario.pickTasks[session.pick.cursor] ?? null;
}
