'use client';

import {useEffect} from 'react';
import {getToken, onMessage} from 'firebase/messaging';
import { getFirebaseMessaging } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';



export const usePushNotifications = () => {

    const {token: authToken} = useAuthStore(); // get the auth token from the auth store

    useEffect(()=>{
        if(!authToken) return;

        registerPush();
    },[authToken])


    const registerPush = async () => {
        try {
            const messaging = await getFirebaseMessaging();
            if(!messaging) return;

            // request permission
            const permission = await Notification.requestPermission();
            if(permission !== 'granted') return;

            
            // register the service worker
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');


            // get FCM token
            const fcmtoken = await getToken(messaging, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
                serviceWorkerRegistration: registration,
            
            });

            
            if(!fcmtoken) return;

            
            //Send token to nestjs backend
           await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    token: fcmtoken,
                    platform: 'web',
                }),
            });


            //handle foreground messages (app is open)
            onMessage(messaging, (payload) => {
                const title = payload.data?.title ?? 'New message';
                const body = payload.data?.body ?? '';
              
                // Show browser notification manually
                new Notification(title, {
                  body,
                  icon: '/medicoz.png',
                  silent: false,
                });
              
                // Play sound
                const audio = new Audio('/sounds/medicoz-notification-tune.mp3');
                audio.play().catch(console.error);
        
            });
        } catch (error) {
            console.error('Error registering push notifications:', error);
        }
    }
}