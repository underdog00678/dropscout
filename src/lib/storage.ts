import type { ValidationResult } from "./types";

export type SavedProduct = {
  id: string;
  productText: string;
  createdAt: string;
  result: ValidationResult;
};

const STORAGE_KEY = "dropscout_library_v1";

const isBrowser = () => typeof window !== "undefined";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isScoreBreakdown = (value: unknown) => {
  if (!isRecord(value)) return false;
  return (
    typeof value.demand === "number" &&
    typeof value.competition === "number" &&
    typeof value.margin === "number" &&
    typeof value.shipping === "number" &&
    typeof value.trend === "number" &&
    typeof value.brandability === "number"
  );
};

const isDecision = (value: unknown) =>
  value === "green" || value === "yellow" || value === "red";

const isValidationResult = (value: unknown): value is ValidationResult =>
  isRecord(value) &&
  isDecision(value.decision) &&
  typeof value.summary === "string" &&
  isScoreBreakdown(value.scores) &&
  isStringArray(value.warnings) &&
  isStringArray(value.reasons);

const isSavedProduct = (value: unknown): value is SavedProduct =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.productText === "string" &&
  typeof value.createdAt === "string" &&
  isValidationResult(value.result);

const coerceLibrary = (value: unknown): SavedProduct[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(isSavedProduct);
};

const persistLibrary = (items: SavedProduct[]) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

const hashString = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

const generateId = (seed: string) => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `sp_${hashString(seed)}`;
};

export const createSavedProduct = (
  productText: string,
  result: ValidationResult,
): SavedProduct => {
  const createdAt = new Date().toISOString();
  const cleanedText = productText.trim();
  return {
    id: generateId(`${cleanedText}|${createdAt}`),
    productText: cleanedText,
    createdAt,
    result,
  };
};

export const loadLibrary = (): SavedProduct[] => {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return coerceLibrary(JSON.parse(raw));
  } catch {
    return [];
  }
};

export const saveToLibrary = (item: SavedProduct): SavedProduct[] => {
  const items = loadLibrary();
  const next = [item, ...items.filter((entry) => entry.id !== item.id)];
  persistLibrary(next);
  return next;
};

export const removeFromLibrary = (id: string): SavedProduct[] => {
  const items = loadLibrary();
  const next = items.filter((entry) => entry.id !== id);
  persistLibrary(next);
  return next;
};

export const clearLibrary = () => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEY);
};
