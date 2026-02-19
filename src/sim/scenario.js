import fs from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import scenarioSchemaDocument from "../../docs/contracts/scenario.schema.json";
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validator = ajv.compile(scenarioSchemaDocument);
export function validateScenario(obj) {
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
export function loadScenarioFromFile(filePath) {
    const absolutePath = path.resolve(filePath);
    const raw = fs.readFileSync(absolutePath, "utf8");
    const parsed = JSON.parse(raw);
    const validation = validateScenario(parsed);
    if (!validation.ok) {
        throw new Error(`Scenario validation failed for ${absolutePath}: ${(validation.errors ?? []).join(" | ")}`);
    }
    return parsed;
}
