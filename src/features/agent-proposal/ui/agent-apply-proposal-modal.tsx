import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { useApplyProposalMutation } from '../hooks/use-agent-proposal';

const applyProposalSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title is too long'),
  commissionRate: z.number().min(0.1, 'Commission must be > 0').max(100, 'Commission cannot exceed 100'),
  experienceYears: z.number().min(0, 'Experience years cannot be negative'),
  pitchContent: z.string().min(10, 'Pitch must be at least 10 characters').max(2000, 'Pitch is too long'),
});

export type ApplyProposalFormValues = z.infer<typeof applyProposalSchema>;

interface AgentApplyProposalModalProps {
  propertyId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AgentApplyProposalModal({ propertyId, isOpen, onClose }: AgentApplyProposalModalProps) {
  const mutation = useApplyProposalMutation(() => {
    reset();
    onClose();
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ApplyProposalFormValues>({
    resolver: zodResolver(applyProposalSchema),
    defaultValues: {
      title: '',
      commissionRate: 2.0,
      experienceYears: 1,
      pitchContent: '',
    }
  });

  const onSubmit = (data: ApplyProposalFormValues) => {
    mutation.mutate({
      propertyId,
      ...data
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Apply for Property</DialogTitle>
          <DialogDescription>Submit your proposal to the property owner.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='title'>Proposal Title</Label>
            <Input id='title' placeholder='e.g., Aggressive marketing plan for your home' {...register('title')} />
            {errors.title && <p className='text-sm text-red-500'>{errors.title.message}</p>}
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='commissionRate'>Commission Rate (%)</Label>
              <Input id='commissionRate' type='number' step='0.1' {...register('commissionRate', { valueAsNumber: true })} />
              {errors.commissionRate && <p className='text-sm text-red-500'>{errors.commissionRate.message}</p>}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='experienceYears'>Experience (Years)</Label>
              <Input id='experienceYears' type='number' {...register('experienceYears', { valueAsNumber: true })} />
              {errors.experienceYears && <p className='text-sm text-red-500'>{errors.experienceYears.message}</p>}
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='pitchContent'>Pitch / Cover Letter</Label>
            <Textarea 
              id='pitchContent' 
              placeholder='Explain why you are the best agent for this property...' 
              className='min-h-[120px]'
              {...register('pitchContent')} 
            />
            {errors.pitchContent && <p className='text-sm text-red-500'>{errors.pitchContent.message}</p>}
          </div>

          <div className='flex justify-end pt-4 gap-2'>
            <Button type='button' variant='outline' onClick={onClose}>Cancel</Button>
            <Button type='submit' className='bg-primary' disabled={mutation.isPending}>
              {mutation.isPending ? 'Submitting...' : 'Submit Proposal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
