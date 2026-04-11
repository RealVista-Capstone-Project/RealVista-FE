'use client';

import { useState } from 'react';
import {
  Search,
  Phone,
  Video,
  MoreHorizontal,
  Smile,
  Paperclip,
  Mic,
  Plus,
  Pin,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  initials?: string;
  avatarBg?: string;
}

interface Message {
  id: string;
  sender: Participant;
  text: string;
  time: string;
  reactions?: { emoji: string; count: number }[];
  isLink?: boolean;
}

interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  initials?: string;
  avatarBg?: string;
  lastMessage: string;
  time: string;
  unread?: number;
  isTyping?: boolean;
  isPinned?: boolean;
  participants?: Participant[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_PARTICIPANTS: Participant[] = [
  { id: 'p1', name: 'Nick Jo', initials: 'NJ', avatarBg: 'bg-slate-500' },
  { id: 'p2', name: 'Dimas Eza', initials: 'DE', avatarBg: 'bg-purple-500' },
  { id: 'p3', name: 'Ellaslls', initials: 'EL', avatarBg: 'bg-pink-400' },
  { id: 'p4', name: 'Nopals', initials: 'NO', avatarBg: 'bg-orange-400' },
];

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    name: 'Matriks Studio',
    initials: 'M',
    avatarBg: 'bg-main-primary',
    lastMessage: 'Dimas Eza Typing...',
    time: '4.30 PM',
    unread: 2,
    isTyping: true,
    isPinned: true,
    participants: MOCK_PARTICIPANTS,
  },
  {
    id: 'c2',
    name: 'Matriks Lab',
    initials: 'ML',
    avatarBg: 'bg-slate-400',
    lastMessage: 'Boleh di cek untuk email hari...',
    time: '4.30 PM',
    unread: 2,
    isPinned: true,
  },
  {
    id: 'c3',
    name: 'Work, Work, Work',
    initials: 'WW',
    avatarBg: 'bg-slate-700',
    lastMessage: 'Siap pak, noted! thank...',
    time: '4.30 PM',
  },
  {
    id: 'c4',
    name: 'Hisyam',
    initials: 'HI',
    avatarBg: 'bg-emerald-500',
    lastMessage: 'Design gua udah selesai ya',
    time: '4.30 PM',
  },
  {
    id: 'c5',
    name: 'Dimas Eza',
    initials: 'DE',
    avatarBg: 'bg-purple-500',
    lastMessage: 'Redesign udah siap nihh, kira kira ...',
    time: '4.30 PM',
  },
  {
    id: 'c6',
    name: 'Nick Jo',
    initials: 'NJ',
    avatarBg: 'bg-slate-500',
    lastMessage: 'Udah ada nih referensinya',
    time: '4.30 PM',
  },
  {
    id: 'c7',
    name: 'Ellaslls',
    initials: 'EL',
    avatarBg: 'bg-pink-400',
    lastMessage: 'udah aku invite figma design yaa',
    time: '4.30 PM',
  },
  {
    id: 'c8',
    name: 'Dips',
    initials: 'DI',
    avatarBg: 'bg-blue-500',
    lastMessage: 'Udah siap riset buat next proj...',
    time: '4.30 PM',
  },
  {
    id: 'c9',
    name: 'Nopals',
    initials: 'NO',
    avatarBg: 'bg-orange-400',
    lastMessage: 'Wahhh gaskeun ini mahh 🔥',
    time: '4.30 PM',
  },
];

const MOCK_MESSAGES: Message[] = [
  {
    id: 'm1',
    sender: { id: 'p1', name: 'Nick Jo', initials: 'NJ', avatarBg: 'bg-slate-500' },
    text: 'Happy Weekend gaisss see you on next week keep spirit and dont forget to chill 🙌',
    time: '4.30 PM',
    reactions: [{ emoji: '👋', count: 2 }],
  },
  {
    id: 'm2',
    sender: { id: 'p2', name: 'Dimas Eza', initials: 'DE', avatarBg: 'bg-purple-500' },
    text: 'Ngedesign dashboard yu gais gaskeun ga sih?',
    time: '4.30 PM',
  },
  {
    id: 'm3',
    sender: { id: 'me', name: 'Me', initials: 'ME', avatarBg: 'bg-main-primary' },
    text: 'Wahhh boleh tuh dashboard design 👍',
    time: '4.30 PM',
  },
  {
    id: 'm4',
    sender: { id: 'p3', name: 'Ellaslls', initials: 'EL', avatarBg: 'bg-pink-400' },
    text: 'Cusssss berangkat ngedesign!!!',
    time: '4.30 PM',
  },
  {
    id: 'm5',
    sender: { id: 'p1', name: 'Nick Jo', initials: 'NJ', avatarBg: 'bg-slate-500' },
    text: 'Ada referensi nihh https://dribbble.com/shots/20709999-Myproject-Task-Management-Dashboard',
    time: '4.30 PM',
    isLink: true,
  },
  {
    id: 'm6',
    sender: { id: 'p4', name: 'Nopals', initials: 'NO', avatarBg: 'bg-orange-400' },
    text: 'Wahhh gaskeun ini mahh 🔥',
    time: '4.30 PM',
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function AvatarCircle({
  initials,
  avatarBg,
  size = 'md',
}: {
  initials?: string;
  avatarBg?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClass = {
    sm: 'size-7 text-xs',
    md: 'size-10 text-sm',
    lg: 'size-12 text-base',
  }[size];

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        avatarBg ?? 'bg-grey-400',
        sizeClass,
      )}
    >
      {initials}
    </div>
  );
}

function ConversationItem({
  conv,
  isActive,
  onClick,
}: {
  conv: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
        isActive ? 'bg-purple-96' : 'hover:bg-purple-98',
      )}
    >
      <AvatarCircle initials={conv.initials} avatarBg={conv.avatarBg} />
      <div className='min-w-0 flex-1'>
        <div className='flex items-center justify-between'>
          <span className='truncate text-sm font-semibold text-main-black'>{conv.name}</span>
          <span className='ml-2 shrink-0 text-xs text-grey-400'>{conv.time}</span>
        </div>
        <p
          className={cn(
            'truncate text-xs',
            conv.isTyping ? 'font-medium text-main-primary' : 'text-grey-500',
          )}
        >
          {conv.lastMessage}
        </p>
      </div>
      {!!conv.unread && (
        <span className='flex size-5 shrink-0 items-center justify-center rounded-full bg-main-primary text-xs font-bold text-white'>
          {conv.unread}
        </span>
      )}
    </button>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isMe = msg.sender.id === 'me';

  return (
    <div className={cn('flex gap-3', isMe && 'flex-row-reverse')}>
      {!isMe && <AvatarCircle initials={msg.sender.initials} avatarBg={msg.sender.avatarBg} size='md' />}

      <div className={cn('flex max-w-[65%] flex-col gap-1', isMe && 'items-end')}>
        {!isMe && (
          <span className='text-xs font-semibold text-main-black'>{msg.sender.name}</span>
        )}

        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed',
            isMe
              ? 'rounded-tr-sm bg-main-primary text-white'
              : 'rounded-tl-sm bg-white text-main-black shadow-sm',
            msg.isLink && 'break-all',
          )}
        >
          {msg.isLink ? (
            <>
              {msg.text.split('https://')[0]}
              <a
                href={`https://${msg.text.split('https://')[1]}`}
                target='_blank'
                rel='noreferrer'
                className='text-main-primary underline'
              >
                https://{msg.text.split('https://')[1]}
              </a>
            </>
          ) : (
            msg.text
          )}
        </div>

        <div className={cn('flex items-center gap-2', isMe && 'flex-row-reverse')}>
          <span className='text-xs text-grey-400'>{msg.time}</span>
          {msg.reactions?.map((r) => (
            <span
              key={r.emoji}
              className='flex items-center gap-1 rounded-full bg-purple-96 px-2 py-0.5 text-xs'
            >
              {r.emoji} {r.count}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function MessagesPage() {
  const [activeConvId, setActiveConvId] = useState<string>('c1');
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const activeConv = MOCK_CONVERSATIONS.find((c) => c.id === activeConvId)!;
  const pinnedConvs = MOCK_CONVERSATIONS.filter((c) => c.isPinned);
  const allConvs = MOCK_CONVERSATIONS.filter((c) => !c.isPinned);

  const filteredPinned = pinnedConvs.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredAll = allConvs.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className='flex h-[calc(100vh-6rem)] overflow-hidden rounded-2xl border border-purple-92/50 bg-white shadow-sm'>
      {/* ── Left Sidebar ─────────────────────────────────────────────────── */}
      <aside className='flex w-80 shrink-0 flex-col border-r border-purple-92/50'>
        {/* Sidebar Header */}
        <div className='flex items-center justify-between px-5 py-4'>
          <h1 className='text-xl font-bold text-main-black'>Messages</h1>
          <button className='flex size-8 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-purple-96 hover:text-main-primary'>
            <Plus className='size-5' />
          </button>
        </div>

        {/* Search */}
        <div className='px-4 pb-3'>
          <div className='flex items-center gap-2 rounded-xl bg-purple-98 px-3 py-2'>
            <Search className='size-4 shrink-0 text-grey-400' />
            <input
              type='text'
              placeholder='Search Messages'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full bg-transparent text-sm text-main-black placeholder:text-grey-400 focus:outline-none'
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className='flex-1 overflow-y-auto px-3 pb-4'>
          {/* Pinned */}
          {filteredPinned.length > 0 && (
            <div className='mb-3'>
              <div className='mb-2 flex items-center gap-1.5 px-2'>
                <Pin className='size-3 text-grey-400' />
                <span className='text-xs font-semibold uppercase tracking-wider text-grey-400'>
                  Pinned Messages
                </span>
              </div>
              <div className='space-y-1'>
                {filteredPinned.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conv={conv}
                    isActive={activeConvId === conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Messages */}
          {filteredAll.length > 0 && (
            <div>
              <div className='mb-2 flex items-center gap-1.5 px-2'>
                <Pin className='size-3 text-grey-400' />
                <span className='text-xs font-semibold uppercase tracking-wider text-grey-400'>
                  All Messages
                </span>
              </div>
              <div className='space-y-1'>
                {filteredAll.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conv={conv}
                    isActive={activeConvId === conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Chat Panel ───────────────────────────────────────────────────── */}
      <div className='flex flex-1 flex-col bg-purple-98/40'>
        {/* Chat Header */}
        <div className='flex items-center justify-between border-b border-purple-92/50 bg-white px-6 py-3'>
          <div className='flex items-center gap-3'>
            <AvatarCircle
              initials={activeConv.initials}
              avatarBg={activeConv.avatarBg}
              size='md'
            />
            <div>
              <p className='text-sm font-bold text-main-black'>{activeConv.name}</p>
              {activeConv.isTyping && (
                <p className='text-xs font-medium text-main-primary'>Dimas Eza Typing...</p>
              )}
            </div>
          </div>

          {/* Participant Avatars + Actions */}
          <div className='flex items-center gap-4'>
            {/* Stacked participant avatars */}
            {activeConv.participants && (
              <div className='flex items-center'>
                {activeConv.participants.slice(0, 3).map((p, i) => (
                  <div
                    key={p.id}
                    className={cn(
                      'flex size-8 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white',
                      p.avatarBg ?? 'bg-grey-400',
                    )}
                    style={{ marginLeft: i === 0 ? 0 : -8 }}
                  >
                    {p.initials}
                  </div>
                ))}
                {activeConv.participants.length > 3 && (
                  <div
                    className='flex size-8 items-center justify-center rounded-full border-2 border-white bg-main-primary text-xs font-bold text-white'
                    style={{ marginLeft: -8 }}
                  >
                    +{activeConv.participants.length - 3}
                  </div>
                )}
              </div>
            )}

            <div className='flex items-center gap-1'>
              <button className='flex size-9 items-center justify-center rounded-xl text-grey-500 transition-colors hover:bg-purple-96 hover:text-main-primary'>
                <Phone className='size-4' />
              </button>
              <button className='flex size-9 items-center justify-center rounded-xl text-grey-500 transition-colors hover:bg-purple-96 hover:text-main-primary'>
                <Video className='size-4' />
              </button>
              <button className='flex size-9 items-center justify-center rounded-xl text-grey-500 transition-colors hover:bg-purple-96 hover:text-main-primary'>
                <MoreHorizontal className='size-4' />
              </button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className='flex-1 overflow-y-auto px-6 py-5'>
          <div className='space-y-5'>
            {MOCK_MESSAGES.slice(0, 1).map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}

            {/* Date divider */}
            <div className='flex items-center gap-3'>
              <div className='h-px flex-1 bg-purple-92' />
              <span className='text-xs font-medium text-grey-400'>Hari ini</span>
              <div className='h-px flex-1 bg-purple-92' />
            </div>

            {MOCK_MESSAGES.slice(1).map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
          </div>
        </div>

        {/* Message Input */}
        <div className='border-t border-purple-92/50 bg-white px-6 py-4'>
          <div className='flex items-center gap-3 rounded-2xl border border-purple-92 bg-white px-4 py-3 shadow-sm focus-within:border-main-primary/50 focus-within:ring-2 focus-within:ring-main-primary/10'>
            <button className='shrink-0 text-grey-400 transition-colors hover:text-main-primary'>
              <Smile className='size-5' />
            </button>
            <button className='shrink-0 text-grey-400 transition-colors hover:text-main-primary'>
              <Paperclip className='size-5' />
            </button>
            <input
              type='text'
              placeholder='Type your message'
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && messageInput.trim()) {
                  setMessageInput('');
                }
              }}
              className='flex-1 bg-transparent text-sm text-main-black placeholder:text-grey-400 focus:outline-none'
            />
            <button className='shrink-0 text-grey-400 transition-colors hover:text-main-primary'>
              <Mic className='size-5' />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
