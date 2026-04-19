import { Search, Pin, Plus } from 'lucide-react';
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
    <aside className='flex w-80 shrink-0 flex-col border-r border-primary/20'>
      {/* Header */}
      <div className='flex items-center justify-between px-5 py-4'>
        <h1 className='text-xl font-bold text-foreground'>{t('title')}</h1>
        <button className='flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/5 hover:text-primary'>
          <Plus className='size-5' />
        </button>
      </div>

      {/* Search */}
      <div className='px-4 pb-3'>
        <div className='flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2'>
          <Search className='size-4 shrink-0 text-muted-foreground/60' />
          <input
            type='text'
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className='w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none'
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className='flex-1 overflow-y-auto px-3 pb-4'>
        {/* Pinned */}
        {filteredPinned.length > 0 && (
          <div className='mb-3'>
            <div className='mb-2 flex items-center gap-1.5 px-2'>
              <Pin className='size-3 text-muted-foreground/60' />
              <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground/60'>
                {t('pinnedMessages')}
              </span>
            </div>
            <div className='space-y-1'>
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
            <div className='mb-2 flex items-center gap-1.5 px-2'>
              <Pin className='size-3 text-muted-foreground/60' />
              <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground/60'>
                {t('allMessages')}
              </span>
            </div>
            <div className='space-y-1'>
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
