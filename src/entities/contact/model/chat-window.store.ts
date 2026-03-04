import { create } from 'zustand';
import type { ChatWindowState, ConversationParticipant, ChatListingData } from '@/entities/contact';

/**
 * Chat Window Store
 * Global state management for floating chat windows using Zustand
 */
interface ChatWindowStore {
  /**
   * Currently open windows
   */
  windows: ChatWindowState[];
  /**
   * Maximum number of windows allowed
   */
  maxWindows: number;

  /**
   * Open a new chat window or bring an existing one to focus
   */
  openWindow: (
    conversationId: string,
    participant: ConversationParticipant,
    listing?: ChatListingData
  ) => void;
  /**
   * Close a specific chat window
   */
  closeWindow: (windowId: string) => void;
  /**
   * Toggle minimize state of a window
   */
  toggleMinimize: (windowId: string) => void;
  /**
   * Close all windows at once
   */
  closeAllWindows: () => void;
}

export const useChatWindowStore = create<ChatWindowStore>((set) => ({
  windows: [],
  maxWindows: 3,

  openWindow: (conversationId, participant, listing) =>
    set((state) => {
      // Check if window already exists
      const existingIndex = state.windows.findIndex((w) => w.conversationId === conversationId);

      if (existingIndex !== -1) {
        // Bring existing window to front and expand it
        const updated = [...state.windows];
        updated[existingIndex] = {
          ...updated[existingIndex],
          isMinimized: false,
        };
        // Move to end (rightmost position)
        const [window] = updated.splice(existingIndex, 1);
        updated.push(window);
        return { windows: updated };
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
      if (state.windows.length >= state.maxWindows) {
        return { windows: [...state.windows.slice(1), newWindow] };
      }

      return { windows: [...state.windows, newWindow] };
    }),

  closeWindow: (windowId) =>
    set((state) => ({
      windows: state.windows.filter((w) => w.id !== windowId),
    })),

  toggleMinimize: (windowId) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === windowId ? { ...w, isMinimized: !w.isMinimized } : w
      ),
    })),

  closeAllWindows: () => set({ windows: [] }),
}));
