import errorsDocument from "../../docs/contracts/errors.json";

const CANONICAL_ERROR_CODES = [
  "ERR_SEQUENCE_TOTE_BEFORE_ITEM",
  "ERR_SEQUENCE_QTY_BEFORE_ITEM",
  "ERR_SEQUENCE_QTY_MISSING",
  "ERR_SEQUENCE_CTRL_E_TOO_EARLY",
  "ERR_SEQUENCE_CTRL_A_TOO_EARLY",
  "ERR_SEQUENCE_SETUP_INCOMPLETE",
  "ERR_WRONG_ITEM_SCANNED",
  "ERR_ITEM_NOT_RECOGNIZED",
  "ERR_WRONG_TOTE_SCANNED",
  "ERR_TOTE_DUPLICATE_IN_SETUP",
  "ERR_TOTE_SLOT_MISMATCH",
  "ERR_TOTE_ALREADY_ALLOCATED",
  "ERR_CART_ALREADY_CREATED",
  "ERR_SHORT_INVENTORY",
  "ERR_DAMAGED_ITEM",
  "ERR_INVALID_ITEM"
] as const;

function ensureCanonicalCodes(): readonly string[] {
  const fromDoc = [...errorsDocument.errorCodes];
  const expected = [...CANONICAL_ERROR_CODES];

  if (
    fromDoc.length !== expected.length
    || fromDoc.some((code) => !expected.includes(code as ErrorCode))
  ) {
    throw new Error("docs/contracts/errors.json no longer matches canonical error code list in src/contracts/errors.ts");
  }

  return Object.freeze(fromDoc);
}

export type ErrorCode = (typeof CANONICAL_ERROR_CODES)[number];
export const ERROR_CODES: readonly ErrorCode[] = ensureCanonicalCodes() as readonly ErrorCode[];

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === "string" && (ERROR_CODES as readonly string[]).includes(value);
}
