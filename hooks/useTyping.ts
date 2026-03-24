'use client';

import { useRef, useCallback } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';

// ─────────────────────────────────────────────────────────────────────────────
// useTyping
//
// Sends typing_start once per 2s while the user is typing,
// and typing_stop 2s after they stop. This keeps WS traffic low
// while still giving a smooth "is typing" experience to recipients.
// ─────────────────────────────────────────────────────────────────────────────



export function useTyping(roomId: string) {
    const {send, subscribe} = useWebSocket();
    const isTypingRef = useRef(false);
    const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const startTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    //call this on every time the keystroke in the input
    const onKeyStroke = useCallback(()=>{
        //send typing start - but throttled to once every 2s
        if(!isTypingRef.current){
            isTypingRef.current = true;
            send('typing_start', { roomId });

            // After 2s, allow sending typing_start again
            startTimerRef.current = setTimeout(()=>{
                isTypingRef.current = false;
            }, 2000);
        }

        //reset the stop timer on every keystroke
        clearTimeout(stopTimerRef.current as ReturnType<typeof setTimeout>);
        stopTimerRef.current = setTimeout(()=>{
            isTypingRef.current = false;
            send('typing_stop', { roomId });
        }, 2000);
    },[roomId, send]);

    // Call this when the input is cleared or the message is sent
  const onStopTyping = useCallback(() => {
    clearTimeout(stopTimerRef.current as ReturnType<typeof setTimeout>);
    clearTimeout(startTimerRef.current as ReturnType<typeof setTimeout>);
    if (isTypingRef.current) {
      send('typing_stop', { roomId });
      isTypingRef.current = false;
    }
  }, [roomId, send]);
 
  return { onKeyStroke, onStopTyping };
}