'use client';

import { useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { conversationQueries } from '@/entities/conversation';
import type { MessageResponse } from '@/entities/conversation';
import { useAuthSession } from '@/features/auth/model';
import type { Message, Participant } from '../types';
import type { ChatListingData } from '@/entities/contact';
import { MessageBubble } from './message-bubble';

interface ChatMessagesProps {
  conversationId: string;
  onListingClick?: (listing: ChatListingData) => void;
  onCreateContract?: (listing: ChatListingData) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
}

function toDateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateLabel(iso: string, t: (key: string) => string): string {
  const d = new Date(iso);
  const now = new Date();
  const todayKey = toDateKey(now.toISOString());
  const msgKey = toDateKey(iso);

  if (msgKey === todayKey) return t('today');

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (msgKey === toDateKey(yesterday.toISOString())) return 'Yesterday';

  return d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
}

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

// Extended message type that keeps the ISO timestamp for date grouping
interface MappedMessage extends Message {
  _isoCreatedAt: string;
}

function mapMessageResponse(raw: MessageResponse, currentUserId?: string): MappedMessage {
  const isMe = raw.sender.user_id === currentUserId;

  const sender: Participant = {
    id: isMe ? 'me' : raw.sender.user_id,
    name: raw.sender.name,
    avatar: raw.sender.avatar_url ?? undefined,
    initials: raw.sender.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join(''),
    avatarBg: stringToAvatarBg(raw.sender.name),
  };

  let listing: ChatListingData | undefined;
  if (raw.message_type === 'LISTING_CARD' && raw.metadata) {
    try {
      listing = JSON.parse(raw.metadata) as ChatListingData;
    } catch {
      // malformed metadata — skip card
    }
  }

  return {
    id: raw.message_id,
    sender,
    text: raw.content ?? '',
    time: formatTime(raw.created_at),
    isLink: !!raw.content?.includes('https://'),
    listing,
    _isoCreatedAt: raw.created_at,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ChatMessages({ conversationId, onListingClick, onCreateContract }: ChatMessagesProps) {
  const t = useTranslations('Messages');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch messages for this conversation
  const { data: messagesResponse, isLoading: messagesLoading } = useQuery(
    conversationQueries.messages(conversationId)
  );

  // Get the current user to determine "isMe"
  const { data: session } = useAuthSession();
  const currentUserId: string | undefined = session?.user?.id;

  // Map API responses to local Message type
  const messages = useMemo<MappedMessage[]>(() => {
    const raw: MessageResponse[] =
      (messagesResponse?.payload as any)?.messages ??
      (messagesResponse?.payload as any)?.data?.messages ??
      [];

    if (!Array.isArray(raw)) return [];

    // API returns newest-first; reverse for chronological display
    return [...raw].reverse().map((r) => mapMessageResponse(r, currentUserId));
  }, [messagesResponse, currentUserId]);

  // Group messages by calendar day to render date dividers
  type GroupEntry = { dateKey: string; dateLabel: string; msgs: MappedMessage[] };
  const groups = useMemo<GroupEntry[]>(() => {
    const result: GroupEntry[] = [];
    const map = new Map<string, GroupEntry>();

    for (const msg of messages) {
      const dateKey = toDateKey(msg._isoCreatedAt);
      if (!map.has(dateKey)) {
        const entry: GroupEntry = {
          dateKey,
          dateLabel: formatDateLabel(msg._isoCreatedAt, t),
          msgs: [],
        };
        map.set(dateKey, entry);
        result.push(entry);
      }
      map.get(dateKey)!.msgs.push(msg);
    }

    return result;
  }, [messages, t]);

  // Scroll to bottom when the latest message changes
  const lastMessageId = messages.at(-1)?.id;
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lastMessageId]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (messagesLoading) {
    return (
      <div className='flex flex-1 items-center justify-center'>
        <Loader2 className='size-5 animate-spin text-main-primary/50' />
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (messages.length === 0) {
    return (
      <div className='flex flex-1 items-center justify-center'>
        <p className='text-sm text-grey-400'>{t('noMessages')}</p>
      </div>
    );
  }

  // ── Messages ───────────────────────────────────────────────────────────────
  return (
    <div className='flex-1 overflow-y-auto px-6 py-5'>
      <div className='space-y-5'>
        {groups.map((group) => (
          <div key={group.dateKey} className='space-y-5'>
            {/* Date divider */}
            <div className='flex items-center gap-3'>
              <div className='h-px flex-1 bg-purple-92' />
              <span className='text-xs font-medium text-grey-400'>{group.dateLabel}</span>
              <div className='h-px flex-1 bg-purple-92' />
            </div>

            {group.msgs.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                onListingClick={onListingClick}
                onCreateContract={onCreateContract}
              />
            ))}
          </div>
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
