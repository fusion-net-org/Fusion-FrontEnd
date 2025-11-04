/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyA2GVoGiJL0S5DJvXVK4eUUb68kyPoB46Q',
  authDomain: 'fusion-18214.firebaseapp.com',
  projectId: 'fusion-18214',
  storageBucket: 'fusion-18214.firebasestorage.app',
  messagingSenderId: '130323105827',
  appId: '1:130323105827:web:6f33d2ee07118f568f4996',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.png',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
