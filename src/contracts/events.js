import eventsSchemaDocument from "../../docs/contracts/events.schema.json";
const CANONICAL_EVENT_TYPES = [
    "RF_LOGIN",
    "RF_MENU_SELECT",
    "RF_KEY_CTRL_T",
    "RF_TASK_GROUP_SET",
    "RF_ZONE_SELECTED",
    "SCAN_CART_LABEL",
    "SCAN_TOTE_ASSIGN",
    "RF_KEY_CTRL_E",
    "PICK_ASSIGN",
    "ARRIVE_LOCATION",
    "SCAN_ITEM",
    "ENTER_QUANTITY",
    "SCAN_TOTE_VERIFY",
    "RF_END_OF_TOTE_SHOWN",
    "RF_KEY_CTRL_A",
    "TOTE_PLACED_ON_CONVEYOR",
    "RF_KEY_CTRL_W",
    "RF_KEY_CTRL_K",
    "EXCEPTION_TOTE_ALLOCATED",
    "EXCEPTION_CART_ALREADY_CREATED",
    "EXCEPTION_INCORRECT_LOCATION",
    "EXCEPTION_INCORRECT_TOTE",
    "EXCEPTION_INVALID_ITEM_LAST",
    "EXCEPTION_INVALID_ITEM_NOT_LAST",
    "EXCEPTION_SHORT_INVENTORY",
    "EXCEPTION_DAMAGED_ITEM",
    "STEP_ACCEPTED",
    "STEP_REJECTED",
    "ERROR"
];
function ensureCanonicalEventTypes() {
    const enumValues = eventsSchemaDocument.properties.type.enum;
    const expected = [...CANONICAL_EVENT_TYPES];
    if (enumValues.length !== expected.length
        || enumValues.some((value) => !expected.includes(value))) {
        throw new Error("docs/contracts/events.schema.json no longer matches canonical event type list in src/contracts/events.ts");
    }
    return Object.freeze([...enumValues]);
}
export const EVENT_TYPES = ensureCanonicalEventTypes();
export function createEvent(event) {
    const { eventId, timestamp, type, traineeId, sessionId, payload, cartSessionId, cartId, roundNumber, pickTaskId } = event;
    const base = {
        eventId,
        timestamp,
        type,
        traineeId,
        sessionId,
        payload: Object.freeze({ ...payload })
    };
    if (cartSessionId !== undefined) {
        base.cartSessionId = cartSessionId;
    }
    if (cartId !== undefined) {
        base.cartId = cartId;
    }
    if (roundNumber !== undefined) {
        base.roundNumber = roundNumber;
    }
    if (pickTaskId !== undefined) {
        base.pickTaskId = pickTaskId;
    }
    return Object.freeze(base);
}
