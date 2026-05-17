importScripts(
  "https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js",
);

// service worker can not read the .env variables, so we need to hardcode the values
firebase.initializeApp({
  apiKey: "AIzaSyAG8ZpFnOasmiXnXX_ONoha44PopYqTQRY",
  projectId: "medicoz-88168",
  messagingSenderId: "410305164280",
  appId: "1:410305164280:web:d33cba55bc07be2f70dc0d",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.data?.title ?? "New message";
  const body = payload.data?.body ?? "";

  self.registration.showNotification(title, {
    body,
    icon: "medicoz.png",
    sound: "/sounds/medicoz-notification-tune.mp3",
    vibrate: [200, 100, 200],
    badge: "medicoz.png",
    actions: [
      {
        action: "view",
        title: "View",
        icon: "medicoz.png",
      },
    ],
    renotify: true,
    requireInteraction: true,
    tag: "medicoz-notification",
    silent: false,
    timestamp: Date.now(),
    renotify: true,
    requireInteraction: true,
    tag: "medicoz-notification",
    silent: false,
    data: {
      url: payload.data.url,
    },
  });
});
