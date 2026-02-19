import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadScenarioFromFile, validateScenario } from "../src/sim/scenario";
const fixturesDir = path.resolve("docs/fixtures/scenarios");
describe("scenario schema validation", () => {
    it("accepts minimal valid fixture", () => {
        const scenario = loadScenarioFromFile(path.join(fixturesDir, "scenario.minimal.pick.json"));
        expect(scenario.buildCart.requiredToteCount).toBe(1);
        expect(scenario.pickTasks.length).toBe(1);
    });
    it("accepts two-totes end-of-tote fixture", () => {
        const scenario = loadScenarioFromFile(path.join(fixturesDir, "scenario.two-totes.end-of-tote.json"));
        expect(scenario.buildCart.requiredToteCount).toBe(2);
        expect(scenario.pickTasks.length).toBeGreaterThanOrEqual(3);
    });
    it("rejects invalid missing-fields fixture", () => {
        const invalidPath = path.join(fixturesDir, "scenario.invalid.missing-fields.json");
        expect(() => loadScenarioFromFile(invalidPath)).toThrowError(/Scenario validation failed/);
    });
    it("rejects extra top-level field", () => {
        const candidate = {
            version: "v1",
            id: "scenario-extra-top-level",
            mode: "guided",
            buildCart: { requiredToteCount: 1 },
            pickTasks: [
                {
                    pickTaskId: "PT-X",
                    locationCode: "LOC-X",
                    itemBarcode: "ITEM-X",
                    expectedToteSlot: 1,
                    quantityRequired: 1
                }
            ],
            unexpectedTopLevelField: true
        };
        const result = validateScenario(candidate);
        expect(result.ok).toBe(false);
    });
    it("rejects extra pickTask field", () => {
        const candidate = {
            version: "v1",
            id: "scenario-extra-task-field",
            mode: "guided",
            buildCart: { requiredToteCount: 1 },
            pickTasks: [
                {
                    pickTaskId: "PT-Y",
                    locationCode: "LOC-Y",
                    itemBarcode: "ITEM-Y",
                    expectedToteSlot: 1,
                    quantityRequired: 1,
                    extraField: "not-allowed"
                }
            ]
        };
        const result = validateScenario(candidate);
        expect(result.ok).toBe(false);
    });
});
