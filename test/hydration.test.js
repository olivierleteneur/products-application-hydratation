import { test } from "node:test";
import assert from "node:assert/strict";
import {
  GOAL_ML, addEntry, createStore, dayKey, emptyState, formatMl, isReminderHour, msUntilNextHour,
  parseState, progress, reminderText, removeEntry, rollover, total,
} from "../js/hydration.js";

// Fixed local dates: tests never depend on the real clock.
const MORNING = new Date(2026, 0, 5, 9, 30);
const EVENING = new Date(2026, 0, 5, 21, 0);
const NEXT_DAY = new Date(2026, 0, 6, 0, 1);

// --- dayKey ------------------------------------------------------------------------

test("dayKey donne la date locale au format ISO", () => {
  assert.equal(dayKey(new Date(2026, 0, 5, 23, 59)), "2026-01-05");
  assert.equal(dayKey(new Date(2026, 10, 1)), "2026-11-01");
});

// --- parseState ----------------------------------------------------------------------

test("parseState sans donnée enregistrée part d'une journée vide", () => {
  assert.deepEqual(parseState(null, MORNING), emptyState(MORNING));
});

test("parseState ignore un JSON illisible", () => {
  assert.deepEqual(parseState("{pas du json", MORNING), emptyState(MORNING));
});

test("parseState ignore les données d'un autre jour", () => {
  const raw = JSON.stringify({ date: "2026-01-04", entries: [{ id: 1, vol: 250, at: 0 }] });
  assert.deepEqual(parseState(raw, MORNING), emptyState(MORNING));
});

test("parseState garde les entrées valides du jour et écarte les autres", () => {
  const raw = JSON.stringify({
    date: "2026-01-05",
    entries: [
      { id: 1, vol: 250, at: 1 },
      { id: 2, vol: -10, at: 2 },
      { id: 3, vol: "500", at: 3 },
      { id: 4, at: 4 },
      null,
      { id: 5, vol: 330, at: 5 },
    ],
  });
  assert.deepEqual(parseState(raw, MORNING).entries.map((e) => e.id), [1, 5]);
});

test("parseState rejette une structure inattendue", () => {
  for (const raw of ['"texte"', "[]", '{"date":"2026-01-05","entries":"x"}']) {
    assert.deepEqual(parseState(raw, MORNING), emptyState(MORNING), raw);
  }
});

// --- addEntry / removeEntry / rollover ---------------------------------------------------

test("addEntry ajoute sans modifier l'état d'origine, avec un identifiant croissant", () => {
  const start = emptyState(MORNING);
  const one = addEntry(start, 250, MORNING);
  const two = addEntry(one, 500, EVENING);
  assert.deepEqual(start.entries, []);
  assert.deepEqual(two.entries, [
    { id: 1, vol: 250, at: MORNING.getTime() },
    { id: 2, vol: 500, at: EVENING.getTime() },
  ]);
});

test("addEntry après minuit repart d'une nouvelle journée", () => {
  const yesterday = addEntry(emptyState(EVENING), 500, EVENING);
  const today = addEntry(yesterday, 250, NEXT_DAY);
  assert.equal(today.date, "2026-01-06");
  assert.deepEqual(today.entries.map((e) => e.vol), [250]);
});

test("addEntry refuse un volume invalide", () => {
  for (const vol of [0, -250, Number.NaN, 10001, "250"]) {
    assert.throws(() => addEntry(emptyState(MORNING), vol, MORNING), RangeError, String(vol));
  }
});

test("removeEntry retire l'entrée demandée, et rien si l'identifiant est inconnu", () => {
  const state = addEntry(addEntry(emptyState(MORNING), 250, MORNING), 500, MORNING);
  assert.deepEqual(removeEntry(state, 1).entries.map((e) => e.id), [2]);
  assert.deepEqual(removeEntry(state, 99), state);
});

test("rollover ne change rien le même jour et vide la journée le lendemain", () => {
  const state = addEntry(emptyState(MORNING), 250, MORNING);
  assert.equal(rollover(state, EVENING), state);
  assert.deepEqual(rollover(state, NEXT_DAY), emptyState(NEXT_DAY));
});

// --- total / progress --------------------------------------------------------------------

test("total additionne les volumes", () => {
  const state = addEntry(addEntry(emptyState(MORNING), 250, MORNING), 330, MORNING);
  assert.equal(total(state), 580);
  assert.equal(total(emptyState(MORNING)), 0);
});

test("progress au départ, à mi-chemin et au-delà de l'objectif", () => {
  assert.deepEqual(progress(0), { pct: 0, remaining: GOAL_ML, reached: false });
  assert.deepEqual(progress(1000), { pct: 50, remaining: 1000, reached: false });
  assert.deepEqual(progress(2500), { pct: 100, remaining: 0, reached: true });
});

test("progress arrondit le pourcentage et accepte un autre objectif", () => {
  assert.equal(progress(333, 1000).pct, 33);
  assert.equal(progress(1500, 1500).reached, true);
});

// --- reminders -----------------------------------------------------------------------------

test("isReminderHour couvre 7 h inclus à 22 h exclu", () => {
  assert.deepEqual([6, 7, 21, 22].map(isReminderHour), [false, true, true, false]);
});

test("msUntilNextHour compte jusqu'à l'heure pile suivante", () => {
  assert.equal(msUntilNextHour(new Date(2026, 0, 5, 10, 59, 30)), 30_000);
  assert.equal(msUntilNextHour(new Date(2026, 0, 5, 10, 0, 0, 0)), 3_600_000);
});

test("reminderText selon l'avancement", () => {
  assert.match(reminderText(500), /500 ml bus · encore 1\s500 ml \(25 %\)/u);
  assert.match(reminderText(2000), /Objectif atteint/);
});

test("formatMl utilise le séparateur de milliers français", () => {
  assert.equal(formatMl(2000).replace(/\s/gu, " "), "2 000 ml");
});

// --- createStore : pannes du stockage navigateur -----------------------------------------

function memoryStorage() {
  const data = new Map();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)) };
}

test("createStore enregistre puis relit l'état du jour", () => {
  const storage = memoryStorage();
  const store = createStore(() => storage);
  const state = addEntry(emptyState(MORNING), 250, MORNING);
  assert.equal(store.save(state), true);
  assert.deepEqual(store.load(EVENING), state);
});

test("createStore stockage plein : save renvoie false sans planter", () => {
  const store = createStore(() => ({
    getItem: () => null,
    setItem: () => { throw new DOMException("quota", "QuotaExceededError"); },
  }));
  assert.equal(store.save(emptyState(MORNING)), false);
});

test("createStore stockage interdit (navigation privée, cookies bloqués) : l'appli démarre quand même", () => {
  const store = createStore(() => { throw new DOMException("denied", "SecurityError"); });
  assert.deepEqual(store.load(MORNING), emptyState(MORNING));
  assert.equal(store.save(emptyState(MORNING)), false);
});
