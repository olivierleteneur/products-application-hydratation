# 💧 Hydration Tracker

A lightweight, single-file web app to track your daily water intake. No dependencies, no build step, no backend — just drop `index.html` on any static web host and you're good to go.

![HTML](https://img.shields.io/badge/HTML-single%20file-blue) ![Vanilla JS](https://img.shields.io/badge/JavaScript-vanilla-yellow) ![No dependencies](https://img.shields.io/badge/dependencies-none-brightgreen)

---

## Features

- **Daily progress bar** — displays your cumulative intake against a 2,000 ml goal, with percentage and remaining volume
- **One-tap logging** — five volume buttons (125, 250, 330, 400, 500 ml) with a satisfying tap animation
- **Hourly reminders** — browser push notifications every hour between 07:00 and 22:00, showing current progress
- **Automatic midnight reset** — the day's data clears at 00:00 without any user action
- **Entry history** — a scrollable log of every drink added today, with individual delete buttons
- **Persistent storage** — data survives page refreshes via `localStorage`; stale data from previous days is discarded automatically
- **Dark mode** — adapts to the system colour scheme via `prefers-color-scheme`
- **Fully responsive** — works on desktop, tablet, and mobile; optimised for one-handed phone use

---

## Getting Started

No installation or build process required.

### Option 1 — Open locally

```bash
# Clone the repo
git clone https://github.com/olivierleteneur/products-application-OVH-landingpage.git

# Open in your browser
open index.html
```

> Push notifications require a secure context (HTTPS). They will not fire when opening the file directly from the filesystem (`file://`). Use a local server (e.g. `npx serve .`) or deploy to a host for full functionality.

### Option 2 — Deploy to a static host

Upload `index.html` to the root (or any subfolder) of your web host. The app is entirely self-contained — no additional files needed.

**OVH shared hosting example:**

1. Connect to your hosting via FTP (e.g. FileZilla) or through the OVH file manager
2. Upload `index.html` to the `www/` directory (or a subdirectory such as `www/hydration/`)
3. Access the app at `https://your-domain.ovh/` or `https://your-domain.ovh/hydration/`

The app works on any static host: GitHub Pages, Netlify, Vercel, Cloudflare Pages, etc.

---

## Push Notifications

Hourly reminders are opt-in. On first visit, a banner appears at the top of the app with an **Activate** button. The browser will then request permission.

- Notifications fire once per hour, on the hour, between **07:00 and 22:00**
- Each notification shows the total volume consumed and the amount remaining
- Notifications require HTTPS and a browser that supports the [Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)

**iOS note:** Safari on iOS only supports web push notifications for sites added to the Home Screen. To enable reminders on iPhone or iPad, tap **Share → Add to Home Screen**, then open the app from the Home Screen icon and accept the notification prompt.

---

## Customisation

All key values are defined as constants at the top of the `<script>` block in `index.html` and are easy to change:

| Constant | Default | Description |
|---|---|---|
| `GOAL_ML` | `2000` | Daily intake goal in millilitres |
| `VOLUMES` | `[125, 250, 330, 400, 500]` | Volume buttons (ml) |
| `REMINDER_START` | `7` | First reminder hour (inclusive) |
| `REMINDER_END` | `22` | Last reminder hour (exclusive) |

---

## Browser Support

| Browser | Notifications | Storage |
|---|---|---|
| Chrome / Edge | ✅ | ✅ |
| Firefox | ✅ | ✅ |
| Safari 16.4+ (HTTPS) | ✅ | ✅ |
| Safari on iOS (Home Screen) | ✅ | ✅ |
| Safari on iOS (in-browser) | ❌ | ✅ |

The app is fully functional on all modern browsers. Push notifications are the only feature with limited support.

---

## Project Structure

```
index.html   # The entire application — HTML, CSS, and JS in one file
README.md    # This file
```

---

## License

MIT — free to use, modify, and distribute.
