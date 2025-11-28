import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { toast } from 'react-toastify';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestPermissionAndGetToken = async () => {
  console.log('Requesting permission...');
  const permission = await Notification.requestPermission();

  if (permission !== 'granted') {
    console.warn('Permission denied');
    return null;
  }

  // Lấy token FCM
  const token = await getToken(messaging, {
    vapidKey: firebaseConfig.vapidKey,
  });

  console.log('FCM Token:', token);
  return token;
};

export { messaging, onMessage, getToken };

export const listenForMessages = () => {
  onMessage(messaging, (payload) => {
    console.log('Foreground message:', payload);
    // toast.info(payload?.notification?.title || 'New Notification');
  });
};
