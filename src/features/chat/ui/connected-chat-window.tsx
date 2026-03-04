'use client';

import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useChatWindowStore } from '@/entities/contact';
import { useAuthSession } from '@/features/auth/model';
import { conversationQueries, useSendMessage } from '@/entities/conversation';
import { conversationKeys } from '@/entities/conversation/api/keys';
import { FloatingChatWindow } from '@/widgets/floating-chat-window';
import type { ChatWindowState, ChatMessageData } from '@/entities/contact';
import type { ChatWebSocketMessage } from '../model/types';
import type { ApiResponse, HttpResponse } from '@/shared/types/api';
import { unwrapApiResponse } from '@/shared/types/api';
import type {
  MessagePaginationResponse,
  MessageResponse,
} from '@/entities/conversation/model/types';

interface ConnectedChatWindowProps {
  window: ChatWindowState;
  position: number;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  wsSendMessage: (
    msg: Omit<ChatWebSocketMessage, 'recipient_user_id'> & { recipientUserId: string }
  ) => void;
  wsIsConnected: boolean;
  typingUserName?: string;
}

export function ConnectedChatWindow({
  window: chatWindow,
  position,
  onClose,
  onMinimize,
  typingUserName,
}: ConnectedChatWindowProps) {
  const { data: session } = useAuthSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  // Fetch messages
  const { data: messagesData } = useQuery(conversationQueries.messages(chatWindow.conversationId));

  // HTTP mutation for sending
  const { mutateAsync: sendMessageMutation } = useSendMessage();

  const messagesResponse = messagesData as
    | HttpResponse<ApiResponse<MessagePaginationResponse>>
    | undefined;
  const messageData = messagesResponse ? unwrapApiResponse(messagesResponse) : null;

  const messages: ChatMessageData[] = useMemo(() => {
    if (!messageData?.messages) return [];

    return messageData.messages
      .slice()
      .reverse()
      .map((msg: MessageResponse) => ({
        id: msg.message_id,
        content: msg.content || '',
        senderId: msg.sender.user_id,
        senderName: msg.sender.name,
        timestamp: new Date(msg.created_at),
        isOwn: msg.sender.user_id === userId,
        listing: msg.metadata ? tryParseMetadata(msg.metadata) : undefined,
      }));
  }, [messageData, userId]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !userId) return;

    // Always use HTTP for reliable delivery
    // WebSocket send() silently fails when disconnected
    try {
      await sendMessageMutation({
        recipient_user_id: chatWindow.participant.id,
        message_type: 'TEXT',
        content,
      });
      // Refresh messages and conversation list after send
      queryClient.invalidateQueries({
        queryKey: conversationKeys.messages(chatWindow.conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: conversationKeys.list(),
      });
    } catch (error) {
      console.error('[Chat] Failed to send message:', error);
      throw error; // Re-throw so FloatingChatWindow doesn't clear input
    }
  };

  return (
    <FloatingChatWindow
      id={chatWindow.id}
      participant={chatWindow.participant}
      messages={messages}
      listing={chatWindow.listing}
      isMinimized={chatWindow.isMinimized}
      position={position}
      onClose={() => onClose(chatWindow.id)}
      onMinimize={() => onMinimize(chatWindow.id)}
      onSendMessage={handleSendMessage}
      className={typingUserName ? 'border-main-primary' : undefined}
    />
  );
}

function tryParseMetadata(metadata: string) {
  try {
    return JSON.parse(metadata);
  } catch {
    return undefined;
  }
}
