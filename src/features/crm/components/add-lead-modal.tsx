import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { StickyNote } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { listingQueries } from '@/entities/listing/api';
import { ListingStatus } from '@/screens/dashboard/managed-listings/types/managed-listing';
import type { UserSearchResponse } from '@/entities/user/model/types';
import { useUserSearch } from '@/entities/user/api/use-user-search';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import type { CreateLeadRequest } from '../types/api';
import type { Lead } from '../types/lead';

const LEAD_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

const PRIORITY_LABELS: Record<NonNullable<Lead['priority']>, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
  URGENT: 'Khẩn cấp',
};

const createLeadSchema = z.object({
  fullName: z.string().trim().min(1, 'Vui lòng nhập tên khách hàng'),
  phone: z.string().optional(),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  listingId: z.string().min(1, 'Vui lòng chọn bất động sản'),
  priority: z.enum(LEAD_PRIORITIES),
  note: z.string().optional(),
});

const addNoteSchema = z.object({
  leadId: z.string().min(1, 'Vui lòng chọn khách hàng'),
  content: z.string().min(1, 'Vui lòng nhập nội dung ghi chú'),
});

type CreateLeadValues = z.infer<typeof createLeadSchema>;
type AddNoteValues = z.infer<typeof addNoteSchema>;

interface AddLeadModalProps {
  open: boolean;
  onClose: () => void;
  prefillLead?: Lead | null;
  leads: Lead[];
  onCreateLead: (data: CreateLeadRequest) => void;
  onAddNote: (leadId: string, content: string) => void;
}

function getInitials(name?: string | null) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return '?';

  return parts
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export const AddLeadModal = React.memo(function AddLeadModal({
  open,
  onClose,
  prefillLead,
  leads,
  onCreateLead,
  onAddNote,
}: AddLeadModalProps) {
  const isNote = !!prefillLead;
  const [matchedBuyer, setMatchedBuyer] = React.useState<UserSearchResponse | null>(null);
  const { data: managedListingsPage } = useQuery(
    listingQueries.managed({ page: 0, size: 100, status: ListingStatus.PUBLISHED })
  );
  const managedListings = React.useMemo(
    () => managedListingsPage?.content ?? [],
    [managedListingsPage]
  );

  const leadForm = useForm<CreateLeadValues>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      listingId: '',
      priority: 'MEDIUM',
      note: '',
    },
  });

  const noteForm = useForm<AddNoteValues>({
    resolver: zodResolver(addNoteSchema),
    defaultValues: { leadId: prefillLead?.id ?? '', content: '' },
  });

  const emailValue = (leadForm.watch('email') ?? '').trim();
  const { data: searchedBuyer } = useUserSearch(emailValue);

  React.useEffect(() => {
    if (searchedBuyer) {
      setMatchedBuyer(searchedBuyer);
      if (searchedBuyer.full_name) {
        leadForm.setValue('fullName', searchedBuyer.full_name, { shouldValidate: true });
      }
      if (searchedBuyer.phone) {
        leadForm.setValue('phone', searchedBuyer.phone, { shouldValidate: true });
      }
      return;
    }

    setMatchedBuyer(null);
  }, [searchedBuyer, leadForm]);

  React.useEffect(() => {
    if (open) {
      if (prefillLead) {
        noteForm.reset({ leadId: prefillLead.id, content: '' });
      } else {
        leadForm.reset({
          fullName: '',
          phone: '',
          email: '',
          listingId: '',
          priority: 'MEDIUM',
          note: '',
        });
        setMatchedBuyer(null);
      }
    }
  }, [open, prefillLead]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleCreateLead(values: CreateLeadValues) {
    onCreateLead({
      full_name: values.fullName,
      phone: values.phone?.trim() || undefined,
      email: values.email?.trim() || undefined,
      source: 'MANUAL',
      listing_id: values.listingId,
      buyer_id: matchedBuyer?.user_id,
      priority: values.priority,
      note: values.note?.trim() || undefined,
    });
  }

  function handleAddNote(values: AddNoteValues) {
    onAddNote(values.leadId, values.content);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className='border-border/70 bg-background shadow-2xl sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <StickyNote className='size-4 text-primary' />
            {isNote ? 'Thêm ghi chú lead' : 'Thêm khách hàng mới'}
          </DialogTitle>
        </DialogHeader>

        {!isNote ? (
          <Form {...leadForm}>
            <form
              onSubmit={leadForm.handleSubmit(handleCreateLead)}
              className='flex flex-col gap-4 py-2'
            >
              <FormField
                control={leadForm.control}
                name='fullName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor='crm-name'>
                      Tên khách hàng <span className='text-destructive'>*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        id='crm-name'
                        placeholder='Nguyễn Văn A'
                        className='border-border/80 bg-background shadow-sm'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <FormField
                  control={leadForm.control}
                  name='phone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor='crm-phone'>Số điện thoại</FormLabel>
                      <FormControl>
                        <Input
                          id='crm-phone'
                          placeholder='0901 234 567'
                          className='border-border/80 bg-background shadow-sm'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={leadForm.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor='crm-email'>Email</FormLabel>
                      <FormControl>
                        <Input
                          id='crm-email'
                          type='email'
                          placeholder='email@example.com'
                          className='border-border/80 bg-background shadow-sm'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {matchedBuyer && (
                <div className='flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5'>
                  <Avatar className='size-9'>
                    <AvatarImage src={matchedBuyer.avatar_url} alt={matchedBuyer.full_name} />
                    <AvatarFallback className='bg-primary/10 text-primary font-semibold'>
                      {getInitials(matchedBuyer.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-medium truncate'>{matchedBuyer.full_name}</p>
                    <p className='text-xs text-muted-foreground truncate'>{matchedBuyer.email}</p>
                  </div>
                </div>
              )}

              <FormField
                control={leadForm.control}
                name='listingId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Bất động sản quan tâm <span className='text-destructive'>*</span>
                    </FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className='w-full min-w-0 border-border/80 bg-background shadow-sm'>
                          <SelectValue placeholder='Chọn bất động sản' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {managedListings.map((listing) => (
                              <SelectItem key={listing.listing_id} value={listing.listing_id}>
                                {listing.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={leadForm.control}
                name='priority'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Mức ưu tiên <span className='text-destructive'>*</span>
                    </FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className='w-full min-w-0 border-border/80 bg-background shadow-sm'>
                          <SelectValue placeholder='Chọn mức ưu tiên' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {LEAD_PRIORITIES.map((priority) => (
                              <SelectItem key={priority} value={priority}>
                                {PRIORITY_LABELS[priority]}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={leadForm.control}
                name='note'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor='crm-note'>Ghi chú</FormLabel>
                    <FormControl>
                      <Textarea
                        id='crm-note'
                        placeholder='Ghi chú ban đầu...'
                        rows={3}
                        className='resize-none border-border/80 bg-background shadow-sm'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type='button' variant='outline' onClick={onClose}>
                  Hủy
                </Button>
                <Button type='submit'>Thêm khách hàng</Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <Form {...noteForm}>
            <form
              onSubmit={noteForm.handleSubmit(handleAddNote)}
              className='flex flex-col gap-4 py-2'
            >
              <FormField
                control={noteForm.control}
                name='leadId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Khách hàng <span className='text-destructive'>*</span>
                    </FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className='border-border/80 bg-background shadow-sm'>
                          <SelectValue placeholder='Chọn khách hàng' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {leads.map((l) => (
                              <SelectItem key={l.id} value={l.id}>
                                {l.customerName}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={noteForm.control}
                name='content'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor='crm-note-content'>
                      Ghi chú <span className='text-destructive'>*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        id='crm-note-content'
                        placeholder='Khách kêu T3 đi xem, hẹn 9h sáng...'
                        rows={3}
                        className='resize-none border-border/80 bg-background shadow-sm'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type='button' variant='outline' onClick={onClose}>
                  Hủy
                </Button>
                <Button type='submit'>Lưu ghi chú</Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
});
