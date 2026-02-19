import { DEFAULT_CERTIFICATION_CONFIG } from "./scoring";
export const DEFAULT_CERTIFICATION_GATE_CONFIG = {
    requiredConsecutive: 3,
    scoring: DEFAULT_CERTIFICATION_CONFIG
};
export function createInitialCertificationProgress(config) {
    const requiredConsecutive = config?.requiredConsecutive ?? DEFAULT_CERTIFICATION_GATE_CONFIG.requiredConsecutive;
    return {
        consecutivePassed: 0,
        requiredConsecutive,
        isCertified: false,
        lastScores: []
    };
}
export function updateCertificationProgress(prev, score, config) {
    const requiredConsecutive = config?.requiredConsecutive ?? DEFAULT_CERTIFICATION_GATE_CONFIG.requiredConsecutive;
    const consecutivePassed = score.passed ? prev.consecutivePassed + 1 : 0;
    const nextLastScores = [...prev.lastScores, score].slice(-requiredConsecutive);
    return {
        consecutivePassed,
        requiredConsecutive,
        isCertified: consecutivePassed >= requiredConsecutive,
        lastScores: nextLastScores
    };
}
