import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runSimCli } from "../src/cli/run-sim";

describe("runSimCli", () => {
  it("returns deterministic summary for happy actions", () => {
    const result = runSimCli([
      "--scenario",
      "docs/fixtures/scenarios/scenario.minimal.pick.json",
      "--actions",
      "docs/fixtures/actions/actions.buildcart.pick.happy.json",
      "--trainee",
      "t1",
      "--session",
      "s1"
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("SCENARIO scenario-minimal-pick mode=guided");
    expect(result.stdout).toContain("FINAL mode=pick buildCart=BC_STARTED pick=PK_TOTE_VERIFIED cursor=1");
    expect(result.stdout).toContain("METRICS totalActions=17 accepted=17 rejected=0 lastError=none");
    expect(result.stdout).toContain("SCORE pickAccuracy=1.000 criticalViolations=0 passed=true reasons=none");
    expect(result.stdout).toContain("REJECTED_BY_ERROR none");
    expect(result.stdout).toContain("ACCEPTED_BY_TYPE ARRIVE_LOCATION=1 ENTER_QUANTITY=1 PICK_ASSIGN=1 RF_KEY_CTRL_E=1 RF_KEY_CTRL_T=1 RF_LOGIN=2 RF_MENU_SELECT=5 RF_ZONE_SELECTED=1 SCAN_CART_LABEL=1 SCAN_ITEM=1 SCAN_TOTE_ASSIGN=1 SCAN_TOTE_VERIFY=1");
  });

  it("returns success with deterministic reject metrics for out-of-order actions", () => {
    const result = runSimCli([
      "--scenario",
      "docs/fixtures/scenarios/scenario.minimal.pick.json",
      "--actions",
      "docs/fixtures/actions/actions.pick.out-of-order.reject.json"
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("FINAL mode=pick buildCart=BC_STARTED pick=PK_QTY_ENTERED cursor=0");
    expect(result.stdout).toContain("METRICS totalActions=17 accepted=16 rejected=1 lastError=ERR_SEQUENCE_QTY_MISSING");
    expect(result.stdout).toContain("SCORE pickAccuracy=0.667 criticalViolations=1 passed=false reasons=ACCURACY_BELOW_TARGET,CRITICAL_SEQUENCE_VIOLATIONS");
    expect(result.stdout).toContain("REJECTED_BY_ERROR ERR_SEQUENCE_QTY_MISSING=1");
  });

  it("fails with exitCode 1 when scenario file is missing", () => {
    const result = runSimCli([
      "--scenario",
      "docs/fixtures/scenarios/does-not-exist.json",
      "--actions",
      "docs/fixtures/actions/actions.buildcart.pick.happy.json"
    ]);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("Failed to read JSON file");
  });

  it("fails with exitCode 1 when actions contain schema-invalid events", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sim-cli-actions-"));
    const actionsPath = path.join(tmpDir, "invalid-actions.json");

    fs.writeFileSync(
      actionsPath,
      JSON.stringify(
        {
          actions: [
            {
              timestamp: "2026-02-18T12:00:00.000Z",
              type: "RF_LOGIN",
              traineeId: "t1",
              sessionId: "s1",
              payload: {}
            }
          ]
        },
        null,
        2
      ),
      "utf8"
    );

    const result = runSimCli([
      "--scenario",
      "docs/fixtures/scenarios/scenario.minimal.pick.json",
      "--actions",
      actionsPath
    ]);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("Actions validation:");
  });
});
