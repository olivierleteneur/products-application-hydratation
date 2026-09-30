// Pure logic of the tracker: no DOM, no clock, no storage access (tested with node:test).
// Every function that depends on the time takes `now` as a parameter.

export const GOAL_ML = 2000;
export const VOLUMES = [125, 250, 330, 400, 500];
export const REMINDER_START = 7; // first reminder hour, inclusive
export const REMINDER_END = 22;  // last reminder hour, exclusive
export const STORAGE_KEY = "hydration_v2";
const MAX_ENTRY_ML = 10000;

const pad = (n) => String(n).padStart(2, "0");

export function dayKey(now) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function emptyState(now) {
  return { date: dayKey(now), entries: [] };
}

const isValidEntry = (e) =>
  e !== null && typeof e === "object" && Number.isInteger(e.id)
  && typeof e.vol === "number" && e.vol > 0 && e.vol <= MAX_ENTRY_ML && Number.isFinite(e.at);

/** Today's state from the raw stored string; anything unreadable or from another day starts fresh. */
export function parseState(raw, now) {
  try {
    const data = JSON.parse(raw);
    if (data?.date === dayKey(now) && Array.isArray(data.entries)) {
      return { date: data.date, entries: data.entries.filter(isValidEntry) };
    }
  } catch {
    // unreadable data: start fresh below
  }
  return emptyState(now);
}

export function rollover(state, now) {
  return state.date === dayKey(now) ? state : emptyState(now);
}

export function addEntry(state, vol, now) {
  if (typeof vol !== "number" || !(vol > 0 && vol <= MAX_ENTRY_ML)) {
    throw new RangeError(`Volume invalide : ${vol}`);
  }
  const current = rollover(state, now);
  const id = Math.max(0, ...current.entries.map((e) => e.id)) + 1;
  return { ...current, entries: [...current.entries, { id, vol, at: now.getTime() }] };
}

export function removeEntry(state, id) {
  const entries = state.entries.filter((e) => e.id !== id);
  return entries.length === state.entries.length ? state : { ...state, entries };
}

export function total(state) {
  return state.entries.reduce((sum, e) => sum + e.vol, 0);
}

export function progress(consumed, goal = GOAL_ML) {
  return {
    pct: Math.min(100, Math.round((consumed / goal) * 100)),
    remaining: Math.max(0, goal - consumed),
    reached: consumed >= goal,
  };
}

export function isReminderHour(hour) {
  return hour >= REMINDER_START && hour < REMINDER_END;
}

export function msUntilNextHour(now) {
  const next = new Date(now);
  next.setHours(now.getHours() + 1, 0, 0, 0);
  return next - now;
}

export function formatMl(ml) {
  return `${ml.toLocaleString("fr-FR")} ml`;
}

export function reminderText(consumed, goal = GOAL_ML) {
  const { pct, remaining, reached } = progress(consumed, goal);
  return reached
    ? `Objectif atteint avec ${formatMl(consumed)}, bravo ! 🎉`
    : `${formatMl(consumed)} bus · encore ${formatMl(remaining)} (${pct} %)`;
}

/**
 * Wraps browser storage. `getStorage` is a function because merely reading `localStorage`
 * throws in some contexts (blocked cookies, some private modes): the app must still start.
 */
export function createStore(getStorage, key = STORAGE_KEY) {
  return {
    load(now) {
      try {
        return parseState(getStorage().getItem(key), now);
      } catch {
        return emptyState(now);
      }
    },
    save(state) {
      try {
        getStorage().setItem(key, JSON.stringify(state));
        return true;
      } catch {
        return false;
      }
    },
  };
}
