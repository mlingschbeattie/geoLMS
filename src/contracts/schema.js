import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import eventsSchemaDocument from "../../docs/contracts/events.schema.json";
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validator = ajv.compile(eventsSchemaDocument);
export function validateEvent(event) {
    const ok = validator(event);
    if (ok) {
        return { ok: true };
    }
    const errors = (validator.errors ?? []).map((error) => {
        const path = error.instancePath || "root";
        return `${path} ${error.message ?? "validation error"}`;
    });
    return { ok: false, errors };
}
