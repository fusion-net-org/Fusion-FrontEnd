import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { toast } from 'react-toastify';

const firebaseConfig = {
  apiKey: 'AIzaSyA2GVoGiJL0S5DJvXVK4eUUb68kyPoB46Q',
  authDomain: 'fusion-18214.firebaseapp.com',
  projectId: 'fusion-18214',
  storageBucket: 'fusion-18214.firebasestorage.app',
  messagingSenderId: '130323105827',
  appId: '1:130323105827:web:6f33d2ee07118f568f4996',
  measurementId: 'G-L11L7NVK8Z',
  vapidKey:
    'BKGxVy-5JU19T2nlb4GdSJT3YdE8WuHBQ2Ob2FCWgnmV0bBdn8N91LSRIm-5mDR7URzS_yN-t8VWvNPKuX5EDo0',
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
