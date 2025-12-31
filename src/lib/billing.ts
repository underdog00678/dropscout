type Plan = "free" | "pro";

type PlanRecord = {
  plan: Plan;
};

type UsageRecord = {
  weekStartISO: string;
  count: number;
};

const PLAN_KEY = "dropscout_plan_v1";
const USAGE_KEY = "dropscout_generate_usage_v1";

const defaultPlan: PlanRecord = {
  plan: "free",
};

const isBrowser = () => typeof window !== "undefined";

const isPlan = (value: unknown): value is Plan =>
  value === "free" || value === "pro";

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getWeekStartISO = (date = new Date()) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = (day + 6) % 7;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - diff);
  return formatLocalDate(start);
};

const loadPlan = (): PlanRecord => {
  if (!isBrowser()) return defaultPlan;
  const raw = window.localStorage.getItem(PLAN_KEY);
  if (!raw) return defaultPlan;
  try {
    const parsed = JSON.parse(raw) as PlanRecord;
    if (isPlan(parsed.plan)) {
      return parsed;
    }
    return defaultPlan;
  } catch {
    return defaultPlan;
  }
};

const savePlan = (plan: Plan) => {
  if (!isBrowser()) return;
  const next: PlanRecord = { plan };
  window.localStorage.setItem(PLAN_KEY, JSON.stringify(next));
};

const loadUsage = (): UsageRecord => {
  const currentWeek = getWeekStartISO();
  if (!isBrowser()) {
    return { weekStartISO: currentWeek, count: 0 };
  }
  const raw = window.localStorage.getItem(USAGE_KEY);
  if (!raw) {
    return { weekStartISO: currentWeek, count: 0 };
  }
  try {
    const parsed = JSON.parse(raw) as UsageRecord;
    if (
      typeof parsed.weekStartISO === "string" &&
      typeof parsed.count === "number"
    ) {
      if (parsed.weekStartISO !== currentWeek) {
        return { weekStartISO: currentWeek, count: 0 };
      }
      return parsed;
    }
    return { weekStartISO: currentWeek, count: 0 };
  } catch {
    return { weekStartISO: currentWeek, count: 0 };
  }
};

const saveUsage = (usage: UsageRecord) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
};

export const getPlan = (): Plan => loadPlan().plan;

export const setPlan = (plan: Plan) => {
  savePlan(plan);
};

export const isPro = () => getPlan() === "pro";

export const getWeeklyGenerateCount = () => loadUsage().count;

export const incrementWeeklyGenerateCount = () => {
  const currentWeek = getWeekStartISO();
  const usage = loadUsage();
  const next: UsageRecord = {
    weekStartISO: currentWeek,
    count: usage.weekStartISO === currentWeek ? usage.count + 1 : 1,
  };
  saveUsage(next);
  return next.count;
};

export const canGenerateNow = (limit: number) => {
  if (isPro()) {
    return { ok: true, remaining: Number.MAX_SAFE_INTEGER };
  }
  const count = getWeeklyGenerateCount();
  const remaining = Math.max(0, limit - count);
  return { ok: remaining > 0, remaining };
};

export const canSaveNow = (savedCount: number, limit: number) => {
  if (isPro()) {
    return { ok: true, remaining: Number.MAX_SAFE_INTEGER };
  }
  const remaining = Math.max(0, limit - savedCount);
  return { ok: remaining > 0, remaining };
};
