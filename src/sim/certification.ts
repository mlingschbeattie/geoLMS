import {
  DEFAULT_CERTIFICATION_CONFIG,
  type CertificationConfig,
  type ProficiencyScore
} from "./scoring";

export const DEFAULT_CERTIFICATION_GATE_CONFIG = {
  requiredConsecutive: 3,
  scoring: DEFAULT_CERTIFICATION_CONFIG
} as const;

export type CertificationProgress = {
  consecutivePassed: number;
  requiredConsecutive: number;
  isCertified: boolean;
  lastScores: readonly ProficiencyScore[];
};

export type CertificationGateConfig = {
  requiredConsecutive: number;
  scoring: CertificationConfig;
};

export function createInitialCertificationProgress(
  config?: Partial<CertificationGateConfig>
): CertificationProgress {
  const requiredConsecutive = config?.requiredConsecutive ?? DEFAULT_CERTIFICATION_GATE_CONFIG.requiredConsecutive;

  return {
    consecutivePassed: 0,
    requiredConsecutive,
    isCertified: false,
    lastScores: []
  };
}

export function updateCertificationProgress(
  prev: CertificationProgress,
  score: ProficiencyScore,
  config?: Partial<CertificationGateConfig>
): CertificationProgress {
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
