import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCPCrumJoDOWMJBe_t3_Q34AGcIX3am5k0",
  authDomain: "bak55-c5816.firebaseapp.com",
  projectId: "bak55-c5816",
  storageBucket: "bak55-c5816.firebasestorage.app",
  messagingSenderId: "1051483476412",
  appId: "1:1051483476412:web:c846eb828285ff14585bb9",
  measurementId: "G-HN8WGSF0RB",
};

const VAPID_KEY = "BD9v7_HOxVIE7ft6_BuIXGrkoB1ORPkflUTi1yt3R_Sp4rzKgvSYQJ-4zLvdw8rdZ0xSdCPJawusn6Lndv34oYw";

const app = initializeApp(firebaseConfig);

let messagingInstance: ReturnType<typeof getMessaging> | null = null;

export async function getFirebaseMessaging() {
  if (messagingInstance) return messagingInstance;
  const supported = await isSupported();
  if (!supported) {
    console.warn("Firebase Messaging is not supported in this browser");
    return null;
  }
  messagingInstance = getMessaging(app);
  return messagingInstance;
}

export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission denied");
      return null;
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js"),
    });

    return token;
  } catch (error) {
    console.error("Error getting notification permission:", error);
    return null;
  }
}

export async function setupForegroundListener(callback: (payload: any) => void) {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log("Foreground message received:", payload);
    callback(payload);
  });
}

export { VAPID_KEY };
