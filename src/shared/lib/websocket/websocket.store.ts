import { create } from 'zustand';
import type { Message } from 'stompjs';
import type { WebSocketState, STOMPMessage } from '@/shared/types/websocket';

/**
 * WebSocket Store
 * Global WebSocket state management using Zustand
 * Manages WebSocket connection state and provides methods to interact with WebSocket
 *
 * NOTE: This store only manages state. The actual WebSocket connection
 * is managed by a WebSocketService instance (usually via a React hook or component).
 */
interface WebSocketStore {
  // State
  state: WebSocketState;
  isConnected: boolean;
  error: Error | null;

  // Actions
  setState: (state: WebSocketState) => void;
  setConnected: (isConnected: boolean) => void;
  setError: (error: Error | null) => void;
  reset: () => void;
}

export const useWebSocketStore = create<WebSocketStore>((set) => ({
  state: 'idle',
  isConnected: false,
  error: null,

  setState: (state) => set({ state }),

  setConnected: (isConnected) => set({ isConnected }),

  setError: (error) => set({ error }),

  reset: () =>
    set({
      state: 'idle',
      isConnected: false,
      error: null,
    }),
}));

/**
 * Hook to access WebSocket state globally
 * Use this to check connection status from anywhere in the app
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isConnected, state } = useWebSocketState();
 *   return <div>WebSocket: {isConnected ? 'Connected' : 'Disconnected'}</div>;
 * }
 * ```
 */
export function useWebSocketState() {
  return useWebSocketStore();
}

/**
 * Hook to update WebSocket store from a WebSocketService
 * This should be used in components that manage a WebSocket connection
 *
 * @example
 * ```tsx
 * function WebSocketManager() {
 *   const updateStore = useWebSocketUpdater();
 *   const ws = useWebSocket({
 *     endpoint: 'http://localhost:8080/ws',
 *     onConnect: () => updateStore.setState('connected'),
 *     onDisconnect: () => updateStore.setState('disconnected'),
 *   });
 *   return null;
 * }
 * ```
 */
export function useWebSocketUpdater() {
  const setState = useWebSocketStore((state) => state.setState);
  const setConnected = useWebSocketStore((state) => state.setConnected);
  const setError = useWebSocketStore((state) => state.setError);
  const reset = useWebSocketStore((state) => state.reset);

  return {
    setState,
    setConnected,
    setError,
    reset,
  };
}
