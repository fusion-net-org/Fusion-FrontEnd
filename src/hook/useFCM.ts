/* eslint-disable @typescript-eslint/no-unused-vars */
// useFCM.ts
import { useEffect } from 'react';
import { messaging, onMessage } from '@/Firebase';
import { toast } from 'react-toastify';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useFCMListener = (onNewNotification: any) => {
  useEffect(() => {
    onMessage(messaging, (payload) => {
      //   toast.info(payload.notification?.title ?? 'New notification!');
      console.log('Foreground message:', payload);

      if (onNewNotification) {
        onNewNotification();
      }
    });
  }, []);
};
