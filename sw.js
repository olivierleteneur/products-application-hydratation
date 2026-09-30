// Service worker: only needed so Android Chrome can display notifications.
// No cache and no push: the app itself schedules the reminders while it is open.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const [client] = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    return client ? client.focus() : self.clients.openWindow("./");
  })());
});
