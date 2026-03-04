'use client';

import { useChatWindowStore } from '@/entities/contact';
import { useChatWebSocket } from '@/features/chat';
import { ConnectedChatWindow } from '@/features/chat/ui/connected-chat-window';

/**
 * ChatWindowRenderer
 *
 * Global component that renders all active floating chat windows.
 * It integrates the global WebSocket connection and passes it to each window.
 * Should be placed once in the main layout (e.g., PublicLayout).
 */
export function ChatWindowRenderer() {
  const { windows, closeWindow, toggleMinimize } = useChatWindowStore();
  const { isConnected, sendMessage, typingState } = useChatWebSocket();

  if (windows.length === 0) return null;

  return (
    <>
      {windows.map((window, index) => {
        // Get typing user name if any (excluding self, although typingState tracks by userId)
        // We assume typingState keys are userIds.
        // We just grab the first one that is typing in this conversation.
        const typingUsers = typingState[window.conversationId] || {};
        // Actually typingState tracks WHO is typing.
        // If I am chatting with 'participant', I want to know if 'participant' is typing.
        // So check if typingUsers[window.participant.id] exists.
        const typingUserName = typingUsers[window.participant.id];

        // Determine position index (reverse visual order or just index?)
        // Context maintains order. 0 is rightmost?
        // Let's assume index 0 is rightmost.

        return (
          <ConnectedChatWindow
            key={window.id}
            window={window}
            position={index}
            onClose={closeWindow}
            onMinimize={toggleMinimize}
            wsSendMessage={sendMessage}
            wsIsConnected={isConnected}
            typingUserName={typingUserName}
          />
        );
      })}
    </>
  );
}
