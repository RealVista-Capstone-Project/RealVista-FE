'use client';

import { useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { conversationQueries, useSendMessage } from '@/entities/conversation';
import type { ConversationListItemResponse } from '@/entities/conversation';
import { useWebSocketState } from '@/shared/lib/websocket';
import type { Conversation } from './types';
import { ChatHeader } from './components/chat-header';
import { ChatMessages } from './components/chat-messages';
import { ConversationDetailPanel } from './components/conversation-detail-panel';
import { ConversationSidebar } from './components/conversation-sidebar';
import { MessageInput } from './components/message-input';
import { MOCK_CONVERSATION_DETAIL } from './mock-data';

// ── Mapper ─────────────────────────────────────────────────────────────────────

function mapConversation(item: ConversationListItemResponse): Conversation {
  const name = item.other_user?.name ?? 'Unknown';

  // Derive initials from the name (up to 2 chars)
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  // Format the timestamp to a short time/date label
  const timeLabel = item.last_message_time
    ? formatRelativeTime(item.last_message_time)
    : item.created_at
      ? formatRelativeTime(item.created_at)
      : '';

  return {
    id: item.conversation_id,
    otherUserId: item.other_user?.user_id ?? '',
    name,
    avatar: item.other_user?.avatar_url ?? undefined,
    initials: initials || '?',
    avatarBg: stringToAvatarBg(name),
    lastMessage: item.last_message ?? '',
    time: timeLabel,
    unread: item.unread_count > 0 ? item.unread_count : undefined,
    isPinned: false,
  };
}

/** Simple relative-time formatter — e.g. "now", "5m", "2h", "Mon", "Jan 3" */
function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return date.toLocaleDateString('en', { weekday: 'short' });
  return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

/** Deterministic avatar background colour derived from name */
const AVATAR_COLORS = [
  'bg-violet-200',
  'bg-indigo-200',
  'bg-blue-200',
  'bg-cyan-200',
  'bg-teal-200',
  'bg-emerald-200',
  'bg-amber-200',
  'bg-rose-200',
];

function stringToAvatarBg(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function MessagesPage() {
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetail, setShowDetail] = useState(false);

  // ── Read WS connection state from global Zustand store.
  //    The single WS connection is owned by ChatWindowRenderer in DashboardLayout.
  //    useChatWebSocket() there already invalidates query cache on new messages,
  //    so ChatMessages re-renders in real-time without owning its own connection.
  const { isConnected } = useWebSocketState();

  // ── HTTP send mutation ────────────────────────────────────────────────────
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();

  // ── Fetch real conversations ──────────────────────────────────────────────
  const { data: convData, isLoading } = useQuery(conversationQueries.list());

  const conversations: Conversation[] = useMemo(() => {
    // http.get returns HttpResponse<ApiResponse<T>>, so conversations are at payload.data
    const raw = (convData as any)?.payload?.data ?? (convData as any)?.data ?? [];
    if (!Array.isArray(raw)) return [];
    return raw.map(mapConversation);
  }, [convData]);

  // Default to the most recent conversation (first in list — sorted by BE)
  const [activeConvId, setActiveConvId] = useState<string>('');
  const effectiveActiveId = activeConvId || conversations[0]?.id || '';
  const activeConv = conversations.find((c) => c.id === effectiveActiveId) ?? conversations[0];

  // ── Send handler ──────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    const content = messageInput.trim();
    if (!content || !activeConv?.otherUserId) return;

    sendMessage(
      {
        recipient_user_id: activeConv.otherUserId,
        message_type: 'TEXT',
        content,
      },
      {
        onSuccess: () => setMessageInput(''),
      }
    );
  }, [messageInput, activeConv, sendMessage]);

  if (isLoading) {
    return (
      <div className='flex h-[calc(100vh-6rem)] items-center justify-center rounded-2xl border border-purple-92/50 bg-white shadow-sm'>
        <Loader2 className='h-6 w-6 animate-spin text-main-primary/60' />
      </div>
    );
  }

  return (
    <div className='flex h-[calc(100vh-6rem)] overflow-hidden rounded-2xl border border-purple-92/50 bg-white shadow-sm'>
      {/* ── Left Sidebar ─────────────────────────────────────────────────── */}
      <ConversationSidebar
        conversations={conversations}
        activeConvId={effectiveActiveId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectConversation={setActiveConvId}
      />

      {/* ── Chat Panel ───────────────────────────────────────────────────── */}
      <div className='flex flex-1 flex-col bg-purple-98/40'>
        {activeConv && (
          <>
            <ChatHeader
              conversation={activeConv}
              showDetail={showDetail}
              onToggleDetail={() => setShowDetail((v) => !v)}
            />

            <ChatMessages conversationId={effectiveActiveId} />

            <MessageInput
              value={messageInput}
              onChange={setMessageInput}
              onSubmit={handleSubmit}
              isSending={isSending}
              isConnected={isConnected}
            />
          </>
        )}

        {!activeConv && !isLoading && (
          <div className='flex flex-1 items-center justify-center text-sm text-main-secondary/50'>
            Select a conversation to start chatting
          </div>
        )}
      </div>

      {/* ── Detail Panel ─────────────────────────────────────────────────── */}
      {showDetail && (
        <ConversationDetailPanel
          detail={MOCK_CONVERSATION_DETAIL}
          onClose={() => setShowDetail(false)}
        />
      )}
    </div>
  );
}
