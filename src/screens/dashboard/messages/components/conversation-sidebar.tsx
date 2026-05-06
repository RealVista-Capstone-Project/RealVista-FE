import { Search, Pin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Conversation } from '../types';
import { ConversationItem } from './conversation-item';

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConvId: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectConversation: (id: string) => void;
}

export function ConversationSidebar({
  conversations,
  activeConvId,
  searchQuery,
  onSearchChange,
  onSelectConversation,
}: ConversationSidebarProps) {
  const t = useTranslations('Messages');
  const pinnedConvs = conversations.filter((c) => c.isPinned);
  const allConvs = conversations.filter((c) => !c.isPinned);

  const filteredPinned = pinnedConvs.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredAll = allConvs.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className='flex w-80 shrink-0 flex-col border-r border-slate-200 bg-white'>
      {/* Header */}
      <div className='flex items-center justify-between px-5 py-4 border-b border-slate-100'>
        <h1 className='text-xl font-bold text-slate-800'>{t('title')}</h1>
      </div>

      {/* Conversation List */}
      <div className='flex-1 overflow-y-auto'>
        {/* Pinned */}
        {filteredPinned.length > 0 && (
          <div className='mb-2'>
            <div className='mb-1 flex items-center gap-1.5 px-5 py-2'>
              <Pin className='size-3 text-amber-400' />
              <span className='text-[11px] font-semibold uppercase tracking-wider text-slate-400'>
                {t('pinnedMessages')}
              </span>
            </div>
            <div className='px-2 pb-2 space-y-0.5'>
              {filteredPinned.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  isActive={activeConvId === conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Messages */}
        {filteredAll.length > 0 && (
          <div className='pt-2'>
            <div className='mb-1 flex items-center px-5 py-2'>
              <span className='text-[11px] font-semibold uppercase tracking-wider text-slate-400'>
                {t('allMessages')}
              </span>
            </div>
            <div className='px-2 pb-4 space-y-0.5'>
              {filteredAll.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  isActive={activeConvId === conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
