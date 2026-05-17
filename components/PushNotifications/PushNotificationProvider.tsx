// components/PushNotificationProvider.tsx - reason- this is a wrapper component for the usePushNotifications hook, since we can't use it in the app/layout.tsx file because it's a server component
'use client';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export const PushNotificationProvider = () => {
  usePushNotifications();
  return null;  // renders nothing, just runs the hook
};