import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/ui';

interface ContractPageHeaderProps {
  label: string;
  onBack: () => void;
}

export function ContractPageHeader({ label, onBack }: ContractPageHeaderProps) {
  return (
    <div className='mb-4'>
      <Button
        type='button'
        variant='ghost'
        className='h-9 rounded-full px-3 text-secondary/70 hover:bg-white/80 hover:text-foreground'
        onClick={onBack}
      >
        <ArrowLeft className='h-4 w-4' />
        {label}
      </Button>
    </div>
  );
}
