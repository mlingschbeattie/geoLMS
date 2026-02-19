import fs from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import scenarioSchemaDocument from "../../docs/contracts/scenario.schema.json";

export type ScenarioMode = "guided" | "assisted" | "timed" | "certification";

export type PickTask = {
  pickTaskId: string;
  locationCode: string;
  itemBarcode: string;
  expectedToteSlot: number;
  quantityRequired: number;
  notes?: string;
};

export type Scenario = {
  version: string;
  id: string;
  mode: ScenarioMode;
  rulesetVersion?: string;
  seed?: number;
  buildCart: {
    requiredToteCount: number;
  };
  pickTasks: readonly PickTask[];
};

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validator = ajv.compile(scenarioSchemaDocument);

export function validateScenario(obj: unknown): { ok: boolean; errors?: string[] } {
  const ok = validator(obj);
  if (ok) {
    return { ok: true };
  }

  const errors = (validator.errors ?? []).map((error) => {
    const at = error.instancePath || "root";
    return `${at} ${error.message ?? "validation error"}`;
  });

  return { ok: false, errors };
}

export function loadScenarioFromFile(filePath: string): Scenario {
  const absolutePath = path.resolve(filePath);
  const raw = fs.readFileSync(absolutePath, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  const validation = validateScenario(parsed);

  if (!validation.ok) {
    throw new Error(`Scenario validation failed for ${absolutePath}: ${(validation.errors ?? []).join(" | ")}`);
  }

  return parsed as Scenario;
}
