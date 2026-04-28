import { create } from 'zustand';
import type { Listing } from '@/entities/listing';

interface AiChatContextState {
  currentListing: Listing | null;
  setCurrentListing: (listing: Listing | null) => void;
}

/**
 * Store to hold the context of the listing currently being viewed.
 * This allows the AI Chat Assistant to provide specialized actions
 * and context-aware analysis.
 */
export const useAiChatContext = create<AiChatContextState>((set) => ({
  currentListing: null,
  setCurrentListing: (listing) => set({ currentListing: listing }),
}));
