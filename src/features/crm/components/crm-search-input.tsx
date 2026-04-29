import * as React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/shared/ui/input';

interface CrmSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const CrmSearchInput = React.memo(function CrmSearchInput({
  value,
  onChange,
}: CrmSearchInputProps) {
  const [draft, setDraft] = React.useState(value);

  React.useEffect(() => {
    setDraft(value);
  }, [value]);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      onChange(draft);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [draft, onChange]);

  return (
    <div className='relative flex-1 min-w-[200px] max-w-[340px]'>
      <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50' />
      <Input
        placeholder='Tìm theo tên, SĐT, BĐS...'
        className='pl-9'
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
    </div>
  );
});
