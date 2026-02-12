'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { ChatWindowState, ConversationParticipant, ChatListingData } from '@/entities/contact';

/**
 * Context value for managing floating chat windows
 */
interface ChatWindowContextValue {
  /**
   * Currently open windows
   */
  windows: ChatWindowState[];
  /**
   * Open a new chat window
   */
  openWindow: (
    conversationId: string,
    participant: ConversationParticipant,
    listing?: ChatListingData
  ) => void;
  /**
   * Close a chat window
   */
  closeWindow: (windowId: string) => void;
  /**
   * Toggle minimize state of a window
   */
  toggleMinimize: (windowId: string) => void;
  /**
   * Close all windows
   */
  closeAllWindows: () => void;
}

const ChatWindowContext = createContext<ChatWindowContextValue | null>(null);

interface ChatWindowProviderProps {
  children: ReactNode;
  /**
   * Maximum number of windows that can be open at once
   */
  maxWindows?: number;
}

/**
 * Provider for managing floating chat windows globally
 */
export function ChatWindowProvider({ children, maxWindows = 3 }: ChatWindowProviderProps) {
  const [windows, setWindows] = useState<ChatWindowState[]>([]);

  const openWindow = useCallback(
    (conversationId: string, participant: ConversationParticipant, listing?: ChatListingData) => {
      setWindows((prev) => {
        // Check if window already exists
        const existingIndex = prev.findIndex((w) => w.conversationId === conversationId);

        if (existingIndex !== -1) {
          // Bring existing window to front and expand it
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            isMinimized: false,
          };
          // Move to end (rightmost position)
          const [window] = updated.splice(existingIndex, 1);
          updated.push(window);
          return updated;
        }

        // Create new window
        const newWindow: ChatWindowState = {
          id: `chat-${conversationId}-${Date.now()}`,
          conversationId,
          participant,
          listing,
          isMinimized: false,
        };

        // Remove oldest window if at max capacity
        if (prev.length >= maxWindows) {
          return [...prev.slice(1), newWindow];
        }

        return [...prev, newWindow];
      });
    },
    [maxWindows]
  );

  const closeWindow = useCallback((windowId: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== windowId));
  }, []);

  const toggleMinimize = useCallback((windowId: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === windowId ? { ...w, isMinimized: !w.isMinimized } : w))
    );
  }, []);

  const closeAllWindows = useCallback(() => {
    setWindows([]);
  }, []);

  return (
    <ChatWindowContext.Provider
      value={{
        windows,
        openWindow,
        closeWindow,
        toggleMinimize,
        closeAllWindows,
      }}
    >
      {children}
    </ChatWindowContext.Provider>
  );
}

/**
 * Hook to access chat window manager
 */
export function useChatWindows() {
  const context = useContext(ChatWindowContext);

  if (!context) {
    throw new Error('useChatWindows must be used within ChatWindowProvider');
  }

  return context;
}
