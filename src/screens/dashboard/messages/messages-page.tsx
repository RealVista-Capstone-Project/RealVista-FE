'use client';

import { useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import { conversationQueries, useSendMessage } from '@/entities/conversation';
import type { ConversationListItemResponse, MessageResponse } from '@/entities/conversation';
import type { ChatListingData } from '@/entities/contact';
import { useWebSocketState } from '@/shared/lib/websocket';
import { useAuthSession } from '@/features/auth/model';
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

  /**
   * Listing that was clicked via the per-card "Create Contract" button.
   * Passed to <MessageInput> which auto-opens the confirmation modal pre-selecting it.
   * Reset to null once the modal has consumed it.
   */
  const [pendingContractListing, setPendingContractListing] = useState<ChatListingData | null>(null);

  const locale = useLocale();

  // ── Current user ──────────────────────────────────────────────────────────
  const { data: session } = useAuthSession();
  const currentUserId: string | undefined = (session?.user as any)?.id;
  const backendRoles: string[] = session?.user?.backendRoles ?? [];
  const canCreateContract = backendRoles.includes('OWNER') || backendRoles.includes('AGENT');

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

  // ── Extract ALL unique listings from active conversation messages ─────────
  //    Use useQuery (same key as ChatMessages) so this re-computes reactively
  //    when messages are fetched. The old useMemo+getQueryData pattern never
  //    re-ran because queryClient is a stable singleton reference.
  const { data: messagesResponse } = useQuery({
    ...conversationQueries.messages(effectiveActiveId),
    enabled: !!effectiveActiveId,
  });

  const activeListings = useMemo<ChatListingData[]>(() => {
    const msgs: MessageResponse[] =
      (messagesResponse?.payload as any)?.messages ??
      (messagesResponse?.payload as any)?.data?.messages ??
      [];

    if (!Array.isArray(msgs)) return [];

    // Collect all unique LISTING_CARD entries (de-duped by listing id)
    const seen = new Set<string>();
    const result: ChatListingData[] = [];
    for (const m of msgs) {
      if (m.message_type === 'LISTING_CARD' && m.metadata) {
        try {
          const parsed = JSON.parse(m.metadata) as ChatListingData;
          if (parsed.id && !seen.has(parsed.id)) {
            seen.add(parsed.id);
            result.push(parsed);
          }
        } catch {
          // malformed metadata — skip
        }
      }
    }
    return result;
  }, [messagesResponse]);

  /**
   * Subset of activeListings eligible for the "Create Contract" modal picker:
   * - owned by the current user (ownerId or agentId match)
   * - status is PUBLISHED (available)
   * Legacy cards without ownerId/agentId/listingStatus are included as a safe fallback.
   */
  const ownedListings = useMemo<ChatListingData[]>(() => {
    if (!currentUserId || !canCreateContract) return [];
    return activeListings.filter((l) => {
      console.log('l', l);
      const ownerSet = !!l.ownerId;
      const agentSet = !!l.agentId;
      if (ownerSet || agentSet) {
        const ownerMatch = ownerSet && l.ownerId === currentUserId;
        const agentMatch = agentSet && l.agentId === currentUserId;
        if (!ownerMatch && !agentMatch) return false;
      }
      if (l.listingStatus && l.listingStatus !== 'PUBLISHED') return false;
      return true;
    });
  }, [activeListings, currentUserId, canCreateContract]);

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

  // ── Send listing card handler ─────────────────────────────────────────────
  const handleSubmitListingCard = useCallback(
    (listing: ChatListingData) => {
      if (!activeConv?.otherUserId) return;

      sendMessage(
        {
          recipient_user_id: activeConv.otherUserId,
          message_type: 'LISTING_CARD',
          content: '',
          metadata: JSON.stringify(listing),
        },
        {
          onSuccess: () => setMessageInput(''),
        }
      );
    },
    [activeConv, sendMessage]
  );

  // ── Listing card click — navigate to listing detail page ─────────────────
  const handleListingClick = useCallback(
    (listing: ChatListingData) => {
      const slug = listing.slug ?? listing.id;
      window.open(`/${locale}/listing/${slug}`, '_blank', 'noopener,noreferrer');
    },
    [locale]
  );

  // ── "Create Contract" button clicked directly on a listing card ──────────
  const handleCreateContractFromCard = useCallback((listing: ChatListingData) => {
    setPendingContractListing(listing);
  }, []);

  if (isLoading) {
    return (
      <div className='flex h-[calc(100vh-6rem)] items-center justify-center rounded-2xl border border-primary/20 bg-white shadow-sm'>
        <Loader2 className='h-6 w-6 animate-spin text-primary/60' />
      </div>
    );
  }

  return (
    <div className='flex h-[calc(100vh-6rem)] overflow-hidden rounded-2xl border border-primary/20 bg-white shadow-sm'>
      {/* ── Left Sidebar ─────────────────────────────────────────────────── */}
      <ConversationSidebar
        conversations={conversations}
        activeConvId={effectiveActiveId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectConversation={setActiveConvId}
      />

      {/* ── Chat Panel ───────────────────────────────────────────────────── */}
      <div className='flex flex-1 flex-col bg-primary/5'>
        {activeConv && (
          <>
            <ChatHeader
              conversation={activeConv}
              showDetail={showDetail}
              onToggleDetail={() => setShowDetail((v) => !v)}
            />

            <ChatMessages
              conversationId={effectiveActiveId}
              onListingClick={handleListingClick}
              onCreateContract={canCreateContract ? handleCreateContractFromCard : undefined}
              currentUserId={currentUserId}
            />

            <MessageInput
              value={messageInput}
              onChange={setMessageInput}
              onSubmit={handleSubmit}
              onSubmitListingCard={handleSubmitListingCard}
              isSending={isSending}
              isConnected={isConnected}
              otherUserId={activeConv?.otherUserId}
              otherUserName={activeConv?.name}
              listings={ownedListings}
              pendingListing={pendingContractListing}
              onPendingListingConsumed={() => setPendingContractListing(null)}
            />
          </>
        )}

        {!activeConv && !isLoading && (
          <div className='flex flex-1 items-center justify-center text-sm text-muted-foreground/70'>
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
