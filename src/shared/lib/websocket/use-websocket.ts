'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { IMessage, IFrame } from '@stomp/stompjs';
import type {
  WebSocketOptions,
  WebSocketState,
  SubscriptionOptions,
  STOMPMessage,
} from '@/shared/types/websocket';
import { WebSocketService } from '@/shared/lib/websocket/websocket.service';

/**
 * React Hook for WebSocket connection management
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isConnected, subscribe, send, state } = useWebSocket({
 *     endpoint: 'http://localhost:8080/ws',
 *     onConnect: () => console.log('Connected!'),
 *     onError: (error) => console.error(error),
 *   });
 *
 *   useEffect(() => {
 *     if (isConnected) {
 *       const unsubscribe = subscribe({
 *         destination: '/topic/messages',
 *         onMessage: (msg) => console.log(JSON.parse(msg.body)),
 *       });
 *       return unsubscribe;
 *     }
 *   }, [subscribe, isConnected]);
 *
 *   return <div>State: {state}</div>;
 * }
 * ```
 */
export function useWebSocket(
  options: WebSocketOptions & {
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: Error | IFrame) => void;
    onMessage?: (message: IMessage) => void;
    token?: string;
  }
) {
  const serviceRef = useRef<WebSocketService | null>(null);
  const [state, setState] = useState<WebSocketState>('idle');
  const [isConnected, setIsConnected] = useState(false);

  // Initialize service AND connect — both in same effect
  // When token changes (undefined → real token after login), service
  // needs to be recreated with the new token AND reconnected.
  useEffect(() => {
    // CRITICAL: Don't connect without auth token
    // If we connect unauthenticated, subscriptions won't work properly
    // because Spring Security won't know which user to route messages to
    if (!options.token) {
      console.log('[useWebSocket] Waiting for auth token before connecting');
      return;
    }

    const service = new WebSocketService({
      ...options,
      onConnect: () => {
        setState('connected');
        setIsConnected(true);
        options.onConnect?.();
      },
      onDisconnect: () => {
        setState('disconnected');
        setIsConnected(false);
        options.onDisconnect?.();
      },
      onError: (error) => {
        setState('disconnected');
        setIsConnected(false);
        options.onError?.(error);
      },
      onMessage: options.onMessage,
    });

    serviceRef.current = service;
    service.connect();

    return () => {
      service.disconnect();
      serviceRef.current = null;
    };
    // Re-initialize AND reconnect when token changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.token]);

  const subscribe = useCallback((subscriptionOptions: SubscriptionOptions) => {
    if (!serviceRef.current) {
      console.warn('[useWebSocket] Cannot subscribe - service not initialized');
      return () => {};
    }
    // The service will check if connected and handle appropriately
    return serviceRef.current.subscribe(subscriptionOptions);
  }, []);

  const unsubscribe = useCallback((destinationOrId: string) => {
    serviceRef.current?.unsubscribe(destinationOrId);
  }, []);

  const send = useCallback((message: STOMPMessage) => {
    if (!serviceRef.current) {
      console.warn('[useWebSocket] Cannot send - service not initialized');
      return;
    }
    serviceRef.current.send(message);
  }, []);

  const disconnect = useCallback(() => {
    serviceRef.current?.disconnect();
  }, []);

  const getState = useCallback(() => {
    return serviceRef.current?.getState() ?? 'idle';
  }, []);

  return {
    state,
    isConnected,
    subscribe,
    unsubscribe,
    send,
    disconnect,
    getState,
  };
}

export default useWebSocket;
