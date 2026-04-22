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
  /** Current user's ID — used to gate the "Create Contract" button by listing ownership */
  currentUserId?: string;
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

export function ChatMessages({ conversationId, onListingClick, onCreateContract, currentUserId: currentUserIdProp }: ChatMessagesProps) {
  const t = useTranslations('Messages');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch messages for this conversation
  const { data: messagesResponse, isLoading: messagesLoading } = useQuery(
    conversationQueries.messages(conversationId)
  );

  // Get the current user to determine "isMe"
  const { data: session } = useAuthSession();
  const currentUserId: string | undefined = currentUserIdProp ?? session?.user?.id;

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
        <Loader2 className='size-5 animate-spin text-primary' />
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (messages.length === 0) {
    return (
      <div className='flex flex-1 flex-col items-center justify-center gap-3 py-20'>
        <div className='flex size-16 items-center justify-center rounded-full bg-muted/50'>
          <svg className='size-8 text-muted-foreground/40' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth={1.5}>
            <path strokeLinecap='round' strokeLinejoin='round' d='M20.25 8.51a11.25 11.25 0 010 6.98a11.25 11.25 0 01-5.61 5.61a11.25 11.25 0 01-6.98 0a11.25 11.25 0 01-5.61-5.61a11.25 11.25 0 010-6.98a11.25 11.25 0 016.98-5.61c1.99-.01 3.92.54 5.56 1.5a11.25 11.25 0 015.56-1.5zm-5.61 5.61a1.75 1.75 0 010 2.49a1.75 1.75 0 01-2.49 0a1.75 1.75 0 010-2.49zm4.94 4.94a1.75 1.75 0 010 2.49a1.75 1.75 0 01-2.49 0a1.75 1.75 0 010-2.49zM7.87 7.87a.75.75 0 010 1.06l-2.12 2.12h2.08a.75.75 0 010 1.5H5.75l2.12 2.12a.75.75 0 11-1.06 1.06L3.69 12.56l2.12-2.12a.75.75 0 010-1.06l2.12-2.12a.75.75 0 011.06 0zm5.12 2.12a.75.75 0 010 1.06l-2.12 2.12h2.08a.75.75 0 010 1.5H10.87l2.12 2.12a.75.75 0 11-1.06 1.06l-2.12-2.12 2.12-2.12a.75.75 0 011.06 0z' />
          </svg>
        </div>
        <div className='text-center'>
          <p className='text-sm font-medium text-foreground'>{t('noMessagesTitle')}</p>
          <p className='mt-1 text-xs text-muted-foreground'>{t('noMessages')}</p>
        </div>
      </div>
    );
  }

  // ── Messages ───────────────────────────────────────────────────────────────
  return (
    <div className='relative flex-1 overflow-y-auto bg-gradient-to-b from-slate-50/50 via-white to-slate-50/50'>
      <div className='mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8'>
        {groups.map((group) => (
          <div key={group.dateKey} className='mb-6'>
            {/* Date divider - centered badge with line */}
            <div className='relative flex items-center justify-center py-3'>
              <div className='absolute inset-x-4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent' />
              <span className='relative z-10 rounded-full bg-white px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border border-slate-100 shadow-sm'>
                {group.dateLabel}
              </span>
            </div>

            {group.msgs.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                onListingClick={onListingClick}
                onCreateContract={onCreateContract}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
