import { useTranslations } from 'next-intl';
import type { Message } from '../types';
import { MessageBubble } from './message-bubble';

interface ChatMessagesProps {
  messages: Message[];
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  const t = useTranslations('Messages');
  const beforeDivider = messages.slice(0, 1);
  const afterDivider = messages.slice(1);

  return (
    <div className='flex-1 overflow-y-auto px-6 py-5'>
      <div className='space-y-5'>
        {beforeDivider.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {/* Date divider */}
        <div className='flex items-center gap-3'>
          <div className='h-px flex-1 bg-purple-92' />
          <span className='text-xs font-medium text-grey-400'>{t('today')}</span>
          <div className='h-px flex-1 bg-purple-92' />
        </div>

        {afterDivider.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
      </div>
    </div>
  );
}
