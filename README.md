# 💧 Hydration Tracker

A lightweight web app to track your daily water intake. No dependencies, no build step, no backend: drop the files on any static web host.

![Vanilla JS](https://img.shields.io/badge/JavaScript-vanilla-yellow) ![No dependencies](https://img.shields.io/badge/dependencies-none-brightgreen) ![CSP](https://img.shields.io/badge/CSP-strict%20compatible-blue)

## Features

- **Daily progress bar**: cumulative intake against a 2,000 ml goal, with percentage and remaining volume
- **One-tap logging**: five volume buttons (125, 250, 330, 400, 500 ml)
- **Entry history**: every drink added today, each with its own delete button
- **Automatic midnight reset**: yesterday's data is discarded when the day changes
- **Persistent storage** in `localStorage`; the app still works (without saving) when storage is blocked or full
- **Hourly reminders** between 07:00 and 22:00, **while the app is open** (see below)
- **Dark mode** following the system setting, responsive, zoom allowed, labelled controls for screen readers

## Getting started

```bash
git clone https://github.com/olivierleteneur/products-application-hydratation.git
cd products-application-hydratation
npx serve .        # or any static server
```

Opening `index.html` directly (`file://`) does not work: browsers do not load ES modules or service workers from the filesystem.

### Deploy

Upload `index.html`, `style.css`, `sw.js` and the `js/` folder to any folder of a static host (OVH shared hosting, GitHub Pages, Netlify...). All paths are relative, so a subfolder such as `https://example.com/apps/hydration/` works. HTTPS is required for notifications.

The page contains no inline script, style or event handler, so it runs under a strict Content Security Policy (`default-src 'self'`).

## Reminders: what they can and cannot do

- Reminders are opt-in: the banner asks for notification permission.
- They fire on the hour, between 07:00 and 22:00, with the volume drunk and the volume left.
- They are scheduled **by the page itself**, so they only fire **while the app is open**. Mobile browsers pause background tabs, so do not count on them once the app is closed. Reminders with the app closed would need a push server (Web Push), which this project deliberately does not have.
- Notifications go through a minimal service worker (`sw.js`), which Android Chrome requires; it caches nothing.

## Customisation

Constants at the top of `js/hydration.js`:

| Constant | Default | Description |
|---|---|---|
| `GOAL_ML` | `2000` | Daily goal in millilitres |
| `VOLUMES` | `[125, 250, 330, 400, 500]` | Volume buttons (ml) |
| `REMINDER_START` | `7` | First reminder hour (inclusive) |
| `REMINDER_END` | `22` | Last reminder hour (exclusive) |

## Project structure

```
index.html        Markup only
style.css         Styles (light and dark)
js/hydration.js   Pure logic: state, totals, day change, reminder schedule, storage wrapper
js/app.js         DOM wiring and reminders
sw.js             Service worker used to display notifications
test/             node:test tests
```

## Tests

```bash
npm test
```

Node 24+, no dependency. The tests cover the logic (day change, invalid or foreign stored data, volumes, progress, reminder window), storage failures (full, blocked) and the page itself (no inline code, zoom allowed, relative paths). CI runs them on every push.

Released under the MIT License, see [LICENSE](LICENSE).
