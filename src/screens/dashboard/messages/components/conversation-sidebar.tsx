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
      <div className='border-b border-slate-100 px-5 py-4'>
        <div className='flex items-center justify-between mb-3'>
          <h2 className='text-base font-bold text-slate-800'>{t('title')}</h2>
          <button className='flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600'>
            <Search className='size-4' />
          </button>
        </div>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-300' />
          <input
            type='text'
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className='w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100'
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className='flex-1 overflow-y-auto'>
        {/* Pinned */}
        {filteredPinned.length > 0 && (
          <div className='border-b border-slate-100'>
            <div className='flex items-center gap-1.5 px-4 pt-4 pb-2'>
              <Pin className='size-3 text-amber-400' />
              <span className='text-[11px] font-semibold uppercase tracking-wider text-slate-400'>
                {t('pinnedMessages')}
              </span>
            </div>
            <div className='px-2 pb-2'>
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
          <div>
            <div className='flex items-center gap-1.5 px-4 pt-4 pb-2'>
              <span className='text-[11px] font-semibold uppercase tracking-wider text-slate-400'>
                {t('allMessages')}
              </span>
            </div>
            <div className='px-2 pb-4'>
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
