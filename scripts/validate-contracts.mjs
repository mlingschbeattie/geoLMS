import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contractFiles = [
  path.join(root, "docs", "contracts", "events.schema.json"),
  path.join(root, "docs", "contracts", "errors.json"),
  path.join(root, "docs", "contracts", "scenario.schema.json")
];

let hasError = false;

for (const filePath of contractFiles) {
  if (!fs.existsSync(filePath)) {
    process.stderr.write(`Missing contract file: ${filePath}\n`);
    hasError = true;
    continue;
  }

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Invalid JSON in ${filePath}: ${message}\n`);
    hasError = true;
  }
}

if (hasError) {
  process.exit(1);
}
