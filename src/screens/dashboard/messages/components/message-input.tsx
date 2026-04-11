import { Smile, Paperclip, Mic } from 'lucide-react';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function MessageInput({ value, onChange, onSubmit }: MessageInputProps) {
  return (
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
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value.trim()) {
              onSubmit();
            }
          }}
          className='flex-1 bg-transparent text-sm text-main-black placeholder:text-grey-400 focus:outline-none'
        />
        <button className='shrink-0 text-grey-400 transition-colors hover:text-main-primary'>
          <Mic className='size-5' />
        </button>
      </div>
    </div>
  );
}
