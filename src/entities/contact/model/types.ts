/**
 * Contact Feature Types
 * Types for contact modal, conversations, and chat messages
 */

/**
 * Data submitted through the contact modal form
 */
export interface ContactFormData {
  fullName: string;
  email: string;
  phone: string;
  message: string;
  listingId: string;
}

/**
 * Listing card data embedded in chat messages
 */
export interface ChatListingData {
  id: string;
  title: string;
  slug?: string;
  image: string;
  price: number;
  currency?: string;
  address: string;
  beds?: number;
  bathrooms?: number;
  area?: number;
}

/**
 * Conversation participant info
 */
export interface ConversationParticipant {
  id: string;
  name: string;
  avatar?: string;
}

/**
 * Conversation preview for chat dropdown
 */
export interface Conversation {
  id: string;
  participant: ConversationParticipant;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  listing?: ChatListingData;
}

/**
 * Individual chat message
 */
export interface ChatMessageData {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  isOwn?: boolean;
  listing?: ChatListingData;
}

/**
 * Chat window state
 */
export interface ChatWindowState {
  id: string;
  conversationId: string;
  participant: ConversationParticipant;
  listing?: ChatListingData;
  isMinimized: boolean;
}

/**
 * User profile data for pre-filling contact form
 */
export interface UserContactInfo {
  fullName: string;
  email: string;
  phone: string;
}
