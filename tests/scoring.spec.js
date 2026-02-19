import { describe, expect, it } from "vitest";
import { createEvent } from "../src/contracts";
import { scoreSession } from "../src/sim";
function eventFactory() {
    let index = 0;
    return {
        create(type, payload) {
            index += 1;
            return createEvent({
                eventId: `score-${String(index).padStart(4, "0")}`,
                timestamp: `2026-02-18T15:00:${String(index).padStart(2, "0")}.000Z`,
                type,
                traineeId: "t-score",
                sessionId: "s-score",
                payload
            });
        }
    };
}
describe("scoreSession", () => {
    it("passes with perfect pick sequence accuracy", () => {
        const factory = eventFactory();
        const eventLog = [
            factory.create("STEP_ACCEPTED", { acceptedType: "SCAN_ITEM" }),
            factory.create("STEP_ACCEPTED", { acceptedType: "ENTER_QUANTITY" }),
            factory.create("STEP_ACCEPTED", { acceptedType: "SCAN_TOTE_VERIFY" })
        ];
        const score = scoreSession(eventLog);
        expect(score.pickAccuracy).toBe(1);
        expect(score.criticalSequenceViolations).toBe(0);
        expect(score.passed).toBe(true);
        expect(score.reasons).toEqual([]);
    });
    it("counts critical sequence violations and fails when max allowed is zero", () => {
        const factory = eventFactory();
        const eventLog = [
            factory.create("STEP_ACCEPTED", { acceptedType: "SCAN_ITEM" }),
            factory.create("STEP_REJECTED", {
                errorCode: "ERR_SEQUENCE_QTY_MISSING",
                rejectedType: "ENTER_QUANTITY"
            })
        ];
        const score = scoreSession(eventLog, { accuracyTarget: 0, maxCriticalSequenceViolations: 0 });
        expect(score.criticalSequenceViolations).toBe(1);
        expect(score.rejectedByError.ERR_SEQUENCE_QTY_MISSING).toBe(1);
        expect(score.passed).toBe(false);
        expect(score.reasons).toContain("CRITICAL_SEQUENCE_VIOLATIONS");
    });
    it("fails when pick accuracy is below target", () => {
        const factory = eventFactory();
        const eventLog = [
            factory.create("STEP_ACCEPTED", { acceptedType: "SCAN_ITEM" }),
            factory.create("STEP_REJECTED", {
                errorCode: "ERR_WRONG_TOTE_SCANNED",
                rejectedType: "SCAN_TOTE_VERIFY"
            })
        ];
        const score = scoreSession(eventLog, { accuracyTarget: 0.97, maxCriticalSequenceViolations: 5 });
        expect(score.pickAccuracy).toBe(0.5);
        expect(score.passed).toBe(false);
        expect(score.reasons).toContain("ACCURACY_BELOW_TARGET");
    });
});
