/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCPCrumJoDOWMJBe_t3_Q34AGcIX3am5k0",
  authDomain: "bak55-c5816.firebaseapp.com",
  projectId: "bak55-c5816",
  storageBucket: "bak55-c5816.firebasestorage.app",
  messagingSenderId: "1051483476412",
  appId: "1:1051483476412:web:c846eb828285ff14585bb9",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Background message:", payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || "BAK55 Talent";
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || "",
    icon: "/favicon.png",
    badge: "/favicon.png",
    data: {
      url: payload.data?.link || "/",
    },
    vibrate: [100, 50, 100],
    tag: payload.data?.notification_type || "default",
    renotify: true,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
