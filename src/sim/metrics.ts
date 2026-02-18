import { ERROR_CODES, type AnyEvent, type ErrorCode } from "../contracts";

export type DerivedMetrics = {
  totalActions: number;
  totalAccepted: number;
  totalRejected: number;
  rejectedByError: Record<ErrorCode, number>;
};

export function createZeroMetrics(): DerivedMetrics {
  const rejectedByError = Object.fromEntries(ERROR_CODES.map((code) => [code, 0])) as Record<ErrorCode, number>;

  return {
    totalActions: 0,
    totalAccepted: 0,
    totalRejected: 0,
    rejectedByError
  };
}

export function computeMetrics(eventLog: readonly AnyEvent[]): DerivedMetrics {
  const metrics = createZeroMetrics();

  for (const event of eventLog) {
    if (event.type === "STEP_ACCEPTED") {
      metrics.totalAccepted += 1;
      continue;
    }

    if (event.type === "STEP_REJECTED") {
      metrics.totalRejected += 1;
      const code = event.payload.errorCode;
      if (code in metrics.rejectedByError) {
        metrics.rejectedByError[code as ErrorCode] += 1;
      }
      continue;
    }

    if (event.type === "ERROR") {
      continue;
    }

    metrics.totalActions += 1;
  }

  return metrics;
}
