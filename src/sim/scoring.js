import { ERROR_CODES } from "../contracts";
const PICK_ACTION_TYPES = ["SCAN_ITEM", "ENTER_QUANTITY", "SCAN_TOTE_VERIFY"];
const CRITICAL_SEQUENCE_CODES = [
    "ERR_SEQUENCE_TOTE_BEFORE_ITEM",
    "ERR_SEQUENCE_QTY_BEFORE_ITEM",
    "ERR_SEQUENCE_QTY_MISSING",
    "ERR_SEQUENCE_CTRL_E_TOO_EARLY",
    "ERR_SEQUENCE_CTRL_A_TOO_EARLY",
    "ERR_SEQUENCE_SETUP_INCOMPLETE"
];
export const DEFAULT_CERTIFICATION_CONFIG = {
    accuracyTarget: 0.97,
    maxCriticalSequenceViolations: 0
};
function createRejectedByErrorMap() {
    return Object.fromEntries(ERROR_CODES.map((code) => [code, 0]));
}
function isPickAcceptedEvent(event) {
    return event.type === "STEP_ACCEPTED" && PICK_ACTION_TYPES.includes(event.payload.acceptedType);
}
function isPickRejectedEvent(event) {
    return event.type === "STEP_REJECTED" && PICK_ACTION_TYPES.includes(event.payload.rejectedType);
}
export function scoreSession(eventLog, config) {
    const effectiveConfig = {
        accuracyTarget: config?.accuracyTarget ?? DEFAULT_CERTIFICATION_CONFIG.accuracyTarget,
        maxCriticalSequenceViolations: config?.maxCriticalSequenceViolations ?? DEFAULT_CERTIFICATION_CONFIG.maxCriticalSequenceViolations
    };
    let acceptedPickActions = 0;
    let rejectedPickActions = 0;
    let totalRejected = 0;
    let criticalSequenceViolations = 0;
    const rejectedByError = createRejectedByErrorMap();
    for (const event of eventLog) {
        if (event.type !== "STEP_REJECTED" && event.type !== "STEP_ACCEPTED") {
            continue;
        }
        if (event.type === "STEP_ACCEPTED") {
            if (isPickAcceptedEvent(event)) {
                acceptedPickActions += 1;
            }
            continue;
        }
        totalRejected += 1;
        const code = event.payload.errorCode;
        rejectedByError[code] += 1;
        if (isPickRejectedEvent(event)) {
            rejectedPickActions += 1;
        }
        if (CRITICAL_SEQUENCE_CODES.includes(code)) {
            criticalSequenceViolations += 1;
        }
    }
    const pickAttempts = acceptedPickActions + rejectedPickActions;
    const pickAccuracy = pickAttempts > 0 ? acceptedPickActions / pickAttempts : 0;
    const reasons = [];
    if (pickAccuracy < effectiveConfig.accuracyTarget) {
        reasons.push("ACCURACY_BELOW_TARGET");
    }
    if (criticalSequenceViolations > effectiveConfig.maxCriticalSequenceViolations) {
        reasons.push("CRITICAL_SEQUENCE_VIOLATIONS");
    }
    reasons.sort((left, right) => left.localeCompare(right));
    return {
        pickAccuracy,
        totalRejected,
        criticalSequenceViolations,
        rejectedByError,
        passed: reasons.length === 0,
        reasons
    };
}
