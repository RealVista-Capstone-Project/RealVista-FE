'use client';

import { useQuery } from '@tanstack/react-query';
import { conversationQueries } from '@/entities/conversation';
import type { ConversationListItemResponse } from '@/entities/conversation';
import type { Conversation } from '@/entities/contact';
import { ChatDropdown } from './chat-dropdown';
import { useChatWindows } from '@/shared/context/chat-window-context';
import { useIsMobile } from '@/shared/lib/hooks/use-mobile';
import { useRouter, useParams } from 'next/navigation';

/**
 * Maps API response to the UI Conversation type
 */
function mapToConversation(item: ConversationListItemResponse): Conversation {
  return {
    id: item.conversation_id,
    participant: {
      id: item.other_user.user_id,
      name: item.other_user.name,
      avatar: item.other_user.avatar_url,
    },
    lastMessage: item.last_message ?? '',
    lastMessageTime: item.last_message_time
      ? new Date(item.last_message_time)
      : new Date(item.created_at),
    unreadCount: item.unread_count,
  };
}

/**
 * Smart ChatDropdown wrapper that fetches conversations from API
 * and opens a FloatingChatWindow on conversation click
 */
export function ChatDropdownContainer() {
  const { data, isLoading } = useQuery(conversationQueries.list());
  const { openWindow } = useChatWindows();
  const isMobile = useIsMobile();
  const router = useRouter();
  const params = useParams();

  // http returns { status, payload } where payload is ApiResponse { success, message, data }
  const items = (data?.payload as any)?.data ?? [];
  const conversations: Conversation[] = items.map(mapToConversation);
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  if (isLoading) {
    return (
      <button
        type='button'
        className='relative flex size-10 items-center justify-center rounded-lg bg-purple-98 text-main-black'
        disabled
      >
        <span className='h-5 w-5 animate-pulse rounded bg-grey-200' />
      </button>
    );
  }

  return (
    <ChatDropdown
      conversations={conversations}
      unreadCount={totalUnread}
      onConversationClick={(conversation) => {
        if (isMobile) {
          const locale = params.locale;
          router.push(`/${locale}/messages/${conversation.id}`);
        } else {
          openWindow(conversation.id, conversation.participant);
        }
      }}
    />
  );
}
