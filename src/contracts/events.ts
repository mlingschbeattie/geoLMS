import eventsSchemaDocument from "../../docs/contracts/events.schema.json";
import type { ErrorCode } from "./errors";

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
] as const;

function ensureCanonicalEventTypes(): readonly string[] {
  const enumValues = eventsSchemaDocument.properties.type.enum;
  const expected = [...CANONICAL_EVENT_TYPES];

  if (
    enumValues.length !== expected.length
    || enumValues.some((value) => !expected.includes(value as EventType))
  ) {
    throw new Error("docs/contracts/events.schema.json no longer matches canonical event type list in src/contracts/events.ts");
  }

  return Object.freeze([...enumValues]);
}

export type EventType = (typeof CANONICAL_EVENT_TYPES)[number];
export const EVENT_TYPES: readonly EventType[] = ensureCanonicalEventTypes() as readonly EventType[];

export type KeyPayloads = {
  RF_MENU_SELECT: { value: string };
  RF_ZONE_SELECTED: { zoneOrTaskGroupCode: string };
  SCAN_CART_LABEL: { barcode: string };
  SCAN_TOTE_ASSIGN: { barcode: string; slotIndex: number };
  SCAN_ITEM: { barcode: string };
  ENTER_QUANTITY: { quantity: number };
  SCAN_TOTE_VERIFY: { barcode: string };
  STEP_REJECTED: { errorCode: ErrorCode };
  ERROR: { errorCode: ErrorCode; details?: Record<string, unknown> };
};

export type EventPayload<T extends EventType> = T extends keyof KeyPayloads
  ? KeyPayloads[T]
  : Record<string, unknown>;

export type BaseEvent<T extends EventType = EventType> = {
  eventId: string;
  timestamp: string;
  type: T;
  traineeId: string;
  sessionId: string;
  payload: EventPayload<T>;
  cartSessionId?: string;
  cartId?: string;
  roundNumber?: number;
  pickTaskId?: string;
};

export type AnyEvent = BaseEvent<EventType>;

export function createEvent<T extends EventType>(event: BaseEvent<T>): Readonly<BaseEvent<T>> {
  return Object.freeze({
    ...event,
    payload: Object.freeze({ ...event.payload }) as EventPayload<T>
  });
}
