'use client';

import { useState } from 'react';
import { MOCK_CONVERSATION_DETAIL, MOCK_CONVERSATIONS, MOCK_MESSAGES } from './mock-data';
import { ChatHeader } from './components/chat-header';
import { ChatMessages } from './components/chat-messages';
import { ConversationDetailPanel } from './components/conversation-detail-panel';
import { ConversationSidebar } from './components/conversation-sidebar';
import { MessageInput } from './components/message-input';

export function MessagesPage() {
  const [activeConvId, setActiveConvId] = useState<string>('c1');
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetail, setShowDetail] = useState(false);

  const activeConv = MOCK_CONVERSATIONS.find((c) => c.id === activeConvId)!;

  return (
    <div className='flex h-[calc(100vh-6rem)] overflow-hidden rounded-2xl border border-purple-92/50 bg-white shadow-sm'>
      {/* ── Left Sidebar ─────────────────────────────────────────────────── */}
      <ConversationSidebar
        conversations={MOCK_CONVERSATIONS}
        activeConvId={activeConvId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectConversation={setActiveConvId}
      />

      {/* ── Chat Panel ───────────────────────────────────────────────────── */}
      <div className='flex flex-1 flex-col bg-purple-98/40'>
        <ChatHeader
          conversation={activeConv}
          showDetail={showDetail}
          onToggleDetail={() => setShowDetail((v) => !v)}
        />

        <ChatMessages messages={MOCK_MESSAGES} />

        <MessageInput
          value={messageInput}
          onChange={setMessageInput}
          onSubmit={() => setMessageInput('')}
        />
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
