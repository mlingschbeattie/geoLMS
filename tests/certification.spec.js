import { describe, expect, it } from "vitest";
import { ERROR_CODES } from "../src/contracts";
import { createInitialCertificationProgress, updateCertificationProgress } from "../src/sim";
function emptyRejectedMap() {
    return Object.fromEntries(ERROR_CODES.map((code) => [code, 0]));
}
function buildScore(overrides) {
    return {
        pickAccuracy: 1,
        totalRejected: 0,
        criticalSequenceViolations: 0,
        rejectedByError: emptyRejectedMap(),
        passed: true,
        reasons: [],
        ...overrides
    };
}
describe("updateCertificationProgress", () => {
    it("certifies on three consecutive passed sessions", () => {
        let progress = createInitialCertificationProgress({ requiredConsecutive: 3 });
        progress = updateCertificationProgress(progress, buildScore({ passed: true }));
        progress = updateCertificationProgress(progress, buildScore({ passed: true }));
        progress = updateCertificationProgress(progress, buildScore({ passed: true }));
        expect(progress.consecutivePassed).toBe(3);
        expect(progress.isCertified).toBe(true);
    });
    it("resets consecutive counter on failure", () => {
        let progress = createInitialCertificationProgress({ requiredConsecutive: 3 });
        progress = updateCertificationProgress(progress, buildScore({ passed: true }));
        progress = updateCertificationProgress(progress, buildScore({ passed: false, reasons: ["ACCURACY_BELOW_TARGET"] }));
        progress = updateCertificationProgress(progress, buildScore({ passed: true }));
        expect(progress.consecutivePassed).toBe(1);
        expect(progress.isCertified).toBe(false);
    });
    it("caps lastScores length deterministically to requiredConsecutive", () => {
        let progress = createInitialCertificationProgress({ requiredConsecutive: 3 });
        progress = updateCertificationProgress(progress, buildScore({ pickAccuracy: 0.95 }));
        progress = updateCertificationProgress(progress, buildScore({ pickAccuracy: 0.96 }));
        progress = updateCertificationProgress(progress, buildScore({ pickAccuracy: 0.97 }));
        progress = updateCertificationProgress(progress, buildScore({ pickAccuracy: 0.98 }));
        expect(progress.lastScores).toHaveLength(3);
        expect(progress.lastScores.map((score) => score.pickAccuracy)).toEqual([0.96, 0.97, 0.98]);
    });
});
