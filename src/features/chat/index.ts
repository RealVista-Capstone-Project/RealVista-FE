// Chat feature - Real-time messaging with Spring Boot WebSocket

// Types
export type { ChatMessage, ChatRoom, TypingIndicator } from './model/types';

// API
export { useChatWebSocket } from './hooks/use-chat-websocket';

// UI Component - use named import to avoid conflict with ChatRoom type
export { ChatRoom as ChatRoomComponent } from './ui/chat-room';
