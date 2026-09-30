// DOM wiring: every computation lives in hydration.js.
import {
  GOAL_ML, REMINDER_END, REMINDER_START, VOLUMES, addEntry, createStore, formatMl, isReminderHour,
  msUntilNextHour, progress, reminderText, removeEntry, rollover, total,
} from "./hydration.js";

const ICONS = { 125: "🥛", 250: "🥤", 330: "🫗", 400: "🧃", 500: "🍶" };
const $ = (id) => document.getElementById(id);
const store = createStore(() => window.localStorage);
let state = store.load(new Date());

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function commit(next) {
  state = next;
  store.save(state);
  render();
}

const timeOf = (entry) =>
  new Date(entry.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

function historyItem(entry) {
  const item = el("div", "history-item");
  const del = el("button", "del-btn", "×");
  del.type = "button";
  del.setAttribute("aria-label", `Supprimer ${entry.vol} ml ajoutés à ${timeOf(entry)}`);
  del.addEventListener("click", () => commit(removeEntry(state, entry.id)));
  item.append(el("span", "time", timeOf(entry)), el("span", "amount", `+${entry.vol} ml`), del);
  return item;
}

function render() {
  const now = new Date();
  const current = rollover(state, now);
  if (current !== state) commit(current);

  const consumed = total(state);
  const { pct, remaining, reached } = progress(consumed);
  $("dateLabel").textContent = now.toLocaleDateString("fr-FR",
    { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  $("currentMl").textContent = formatMl(consumed);
  $("barFill").style.width = `${pct}%`;
  $("bar").setAttribute("aria-valuenow", String(pct));
  $("barPct").textContent = pct >= 12 ? `${pct}%` : "";
  const remainingLabel = $("remainingLabel");
  remainingLabel.textContent = reached ? "✓ Objectif atteint !" : `${formatMl(remaining)} restants`;
  remainingLabel.classList.toggle("goal-achieved", reached);

  const list = $("historyList");
  if (state.entries.length === 0) {
    const empty = el("div", "empty-state", "Aucune consommation enregistrée.");
    empty.append(document.createElement("br"), "Ajoutez votre première gorgée !");
    list.replaceChildren(empty);
  } else {
    list.replaceChildren(...[...state.entries].reverse().map(historyItem));
  }
}

function buildButtons() {
  for (const vol of VOLUMES) {
    const btn = el("button", "vol-btn");
    btn.type = "button";
    btn.setAttribute("aria-label", `Ajouter ${vol} ml`);
    btn.append(el("div", "glass", ICONS[vol] ?? "💧"), el("div", "num", String(vol)), el("div", "unit", "ml"));
    btn.addEventListener("click", () => {
      commit(addEntry(state, vol, new Date()));
      btn.classList.add("added");
      setTimeout(() => btn.classList.remove("added"), 350);
    });
    $("volGrid").append(btn);
  }
}

/* Reminders. Android Chrome only shows notifications through a service worker
   (`new Notification()` throws there). Without a push server, reminders can only
   fire while the page is open: the banner says so. */
const HOURS = `${REMINDER_START} h – ${REMINDER_END} h`;
const worker = "serviceWorker" in navigator
  ? navigator.serviceWorker.register("sw.js").then(() => navigator.serviceWorker.ready).catch(() => null)
  : Promise.resolve(null);

function showBanner(text, askButton) {
  $("notifBanner").hidden = false;
  $("notifText").textContent = text;
  $("notifBtn").hidden = !askButton;
}

function updateBanner() {
  const permission = Notification.permission;
  if (permission === "granted") showBanner(`Rappels toutes les heures (${HOURS}) tant que l'appli est ouverte`, false);
  else if (permission === "denied") showBanner("Rappels bloqués dans les réglages du navigateur", false);
  else showBanner(`Activez les rappels horaires (${HOURS}, appli ouverte)`, true);
}

async function notify(title, body) {
  try {
    const registration = await worker;
    if (registration) await registration.showNotification(title, { body, tag: "hydration" });
    else new Notification(title, { body });
  } catch {
    showBanner("Rappels indisponibles sur ce navigateur", false);
  }
}

function scheduleReminder() {
  setTimeout(() => {
    const now = new Date();
    if (Notification.permission === "granted" && isReminderHour(now.getHours())) {
      notify("💧 Pensez à boire !", reminderText(total(rollover(state, now))));
    }
    scheduleReminder();
  }, msUntilNextHour(new Date()));
}

function initReminders() {
  if (!("Notification" in window)) return;
  updateBanner();
  $("notifBtn").addEventListener("click", async () => {
    const permission = await Notification.requestPermission();
    updateBanner();
    if (permission === "granted") notify("💧 Hydration", "Rappels activés ! Pensez à boire de l'eau.");
  });
  scheduleReminder();
}

/* Init */
$("goalMl").textContent = `/ ${formatMl(GOAL_ML)}`;
$("resetBtn").addEventListener("click", () => {
  if (state.entries.length > 0 && confirm("Remettre à zéro la consommation du jour ?")) {
    commit({ ...state, entries: [] });
  }
});
buildButtons();
render();
initReminders();
setInterval(render, 60_000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });
