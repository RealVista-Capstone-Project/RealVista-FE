'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import {
  ArrowLeft,
  User,
  Star,
  MapPin,
  Briefcase,
  Home,
  UserCheck,
  FileText,
  MessageSquare,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/shared/ui/button';
import { Link } from '@/shared/config/i18n/navigation';
import { Badge } from '@/shared/ui/badge';
import { Textarea } from '@/shared/ui/textarea';
import { Input } from '@/shared/ui/input';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/shared/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/shared/ui/dialog';
import { cn } from '@/shared/lib/utils';
import { useDebounce } from '@/shared/lib/hooks/use-debounce';
import { agentProfileQueries } from '@/entities/agent-profile';
import { propertyQueries } from '@/entities/property';
import { agentEngagementApi } from '@/entities/agent-engagement/api/agent-engagement.api';
import type { AgentListItem, AgentReview } from '@/entities/agent-profile';

const ENGAGEMENT_STATUS_BADGE: Record<string, { cls: string }> = {
  SUBMITTED: { cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  ACCEPTED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED: { cls: 'bg-red-50 text-red-600 border-red-200' },
  CANCELLED: { cls: 'bg-slate-100 text-slate-500 border-slate-200' },
  FINISHED: { cls: 'bg-blue-50 text-blue-700 border-blue-200' },
};

function StarRating({ value }: { value: number }) {
  return (
    <div className='flex items-center gap-0.5'>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            'h-3.5 w-3.5',
            i <= Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'
          )}
        />
      ))}
    </div>
  );
}

function AgentCard({
  agent,
  isSelected,
  onClick,
  t,
}: {
  agent: AgentListItem;
  isSelected: boolean;
  onClick: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const isAccepted = agent.engagement_status === 'ACCEPTED';
  const engagementBadge = agent.engagement_status
    ? ENGAGEMENT_STATUS_BADGE[agent.engagement_status]
    : null;

  const specialtyChips = agent.specialties
    ? agent.specialties.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 2)
    : [];

  return (
    <button
      type='button'
      onClick={isAccepted ? undefined : onClick}
      disabled={isAccepted}
      className={cn(
        'relative flex flex-col items-center text-center rounded-2xl border transition-all duration-200 p-4 gap-2.5 w-full',
        isSelected
          ? 'border-primary shadow-md bg-purple-50/60 ring-1 ring-primary/20'
          : 'border-slate-200 bg-white hover:border-primary/50 hover:shadow-md',
        isAccepted && 'cursor-not-allowed opacity-80'
      )}
    >
      {/* Engagement badge — top right */}
      {engagementBadge && (
        <span
          className={cn(
            'absolute top-2.5 right-2.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md border',
            engagementBadge.cls
          )}
        >
          {t(`status${agent.engagement_status}` as Parameters<typeof t>[0])}
        </span>
      )}

      {/* Avatar */}
      <div className='h-14 w-14 rounded-full bg-slate-100 overflow-hidden ring-2 ring-white shadow flex-shrink-0'>
        {agent.avatar_url ? (
          <Image
            src={agent.avatar_url}
            alt={agent.full_name ?? ''}
            width={56}
            height={56}
            className='object-cover w-full h-full'
          />
        ) : (
          <div className='h-full w-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100'>
            <User className='h-6 w-6 text-indigo-300' />
          </div>
        )}
      </div>

      {/* Name */}
      <p className='text-sm font-bold text-slate-800 leading-tight line-clamp-2 w-full px-1'>
        {agent.full_name ?? '—'}
      </p>

      {/* Rating */}
      {agent.rating != null ? (
        <div className='flex items-center gap-1'>
          <Star className='h-3.5 w-3.5 text-amber-400 fill-amber-400' />
          <span className='text-xs font-semibold text-slate-700'>
            {typeof agent.rating === 'number' ? agent.rating.toFixed(1) : agent.rating}
          </span>
          {agent.years_of_experience != null && (
            <span className='text-[11px] text-slate-400'>
              · {agent.years_of_experience} {t('agentExperience')}
            </span>
          )}
        </div>
      ) : agent.years_of_experience != null ? (
        <span className='text-[11px] text-slate-400'>
          {agent.years_of_experience} {t('agentExperience')}
        </span>
      ) : null}

      {/* Specialty chips */}
      {specialtyChips.length > 0 && (
        <div className='flex flex-wrap gap-1 justify-center'>
          {specialtyChips.map((chip) => (
            <span
              key={chip}
              className='text-[10px] bg-purple-50 text-primary border border-purple-100 rounded-md px-1.5 py-0.5 font-medium'
            >
              {chip}
            </span>
          ))}
        </div>
      )}

      {/* Accepted overlay */}
      {isAccepted && (
        <div className='absolute inset-0 rounded-2xl bg-white/70 flex items-center justify-center pointer-events-none'>
          <div className='flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 shadow-sm'>
            <UserCheck className='h-4 w-4 text-emerald-600' />
            <span className='text-xs font-bold text-emerald-700'>{t('alreadyHired')}</span>
          </div>
        </div>
      )}
    </button>
  );
}

function ReviewItem({ review }: { review: AgentReview }) {
  const date = new Date(review.created_at).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className='rounded-xl border border-slate-200 bg-white p-3.5 space-y-2'>
      <div className='flex items-center justify-between gap-2'>
        <StarRating value={review.rating} />
        <span className='text-[11px] text-slate-400'>{date}</span>
      </div>
      {review.comment && (
        <p className='text-sm text-slate-600 leading-relaxed'>{review.comment}</p>
      )}
    </div>
  );
}

function AgentDetailPanel({
  agent,
  propertyId,
  t,
}: {
  agent: AgentListItem;
  propertyId: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const [hireDialogOpen, setHireDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [commission, setCommission] = useState('');
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  const isAccepted = agent.engagement_status === 'ACCEPTED';
  const hasActiveEngagement =
    agent.engagement_status != null &&
    agent.engagement_status !== 'REJECTED' &&
    agent.engagement_status !== 'CANCELLED' &&
    agent.engagement_status !== 'FINISHED';

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery(
    agentProfileQueries.reviewsForAgent(agent.user_id)
  );

  const { mutate: sendInvitation, isPending } = useMutation({
    mutationFn: () =>
      agentEngagementApi.sendOwnerInvitation({
        agent_id: agent.user_id,
        property_id: propertyId,
        title: title.trim() || undefined,
        offered_commission: commission ? parseFloat(commission) : undefined,
        message: message.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-profile', 'list'] });
      setHireDialogOpen(false);
      setTitle('');
      setCommission('');
      setMessage('');
    },
  });

  const engagementBadgeCls = agent.engagement_status
    ? (ENGAGEMENT_STATUS_BADGE[agent.engagement_status]?.cls ?? '')
    : '';

  return (
    <div className='h-full overflow-y-auto p-5 space-y-5'>
      {/* Agent header */}
      <div className='flex items-center gap-4'>
        <div className='h-16 w-16 rounded-full bg-slate-100 overflow-hidden ring-2 ring-white shadow'>
          {agent.avatar_url ? (
            <Image
              src={agent.avatar_url}
              alt={agent.full_name ?? ''}
              width={64}
              height={64}
              className='object-cover w-full h-full'
            />
          ) : (
            <div className='h-full w-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50'>
              <User className='h-7 w-7 text-indigo-300' />
            </div>
          )}
        </div>
        <div className='flex-1 min-w-0'>
          <h2 className='text-base font-bold text-slate-900'>{agent.full_name ?? '—'}</h2>
          {agent.rating != null && (
            <div className='flex items-center gap-1 mt-0.5'>
              <Star className='h-4 w-4 text-amber-400 fill-amber-400' />
              <span className='text-sm font-semibold text-slate-700'>
                {typeof agent.rating === 'number' ? agent.rating.toFixed(1) : agent.rating}
              </span>
              <span className='text-sm text-slate-400'>/ 5</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className='grid grid-cols-2 gap-3'>
        {agent.years_of_experience != null && (
          <div className='rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center gap-2'>
            <Briefcase className='h-4 w-4 text-slate-400 flex-shrink-0' />
            <div>
              <p className='text-xs font-bold text-slate-800'>{agent.years_of_experience}</p>
              <p className='text-[10px] text-slate-400'>{t('agentExperience')}</p>
            </div>
          </div>
        )}
        {agent.properties_sold != null && (
          <div className='rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center gap-2'>
            <Home className='h-4 w-4 text-slate-400 flex-shrink-0' />
            <div>
              <p className='text-xs font-bold text-slate-800'>{agent.properties_sold}</p>
              <p className='text-[10px] text-slate-400'>{t('agentSold')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Bio */}
      <div className='rounded-xl border border-slate-200 bg-white p-4'>
        <p className='text-xs font-bold text-slate-500 uppercase tracking-wide mb-2'>Bio</p>
        <p className='text-sm text-slate-600 leading-relaxed'>
          {agent.bio ?? t('noBio')}
        </p>
      </div>

      {/* Specialties */}
      {agent.specialties && (
        <div>
          <p className='text-xs font-bold text-slate-500 uppercase tracking-wide mb-2'>
            {t('agentSpecialties')}
          </p>
          <p className='text-sm text-slate-700'>{agent.specialties}</p>
        </div>
      )}

      {/* Service areas */}
      {agent.service_areas && (
        <div className='flex items-start gap-2'>
          <MapPin className='h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0' />
          <div>
            <p className='text-xs font-bold text-slate-500 uppercase tracking-wide mb-1'>
              {t('agentServiceAreas')}
            </p>
            <p className='text-sm text-slate-700'>{agent.service_areas}</p>
          </div>
        </div>
      )}

      {/* Active engagement / proposal */}
      {hasActiveEngagement && (
        <div>
          <div className='flex items-center gap-2 mb-2'>
            <FileText className='h-4 w-4 text-slate-400' />
            <p className='text-xs font-bold text-slate-500 uppercase tracking-wide'>
              {t('activeProposal')}
            </p>
          </div>
          <div className={cn('rounded-xl border p-3.5 flex items-center justify-between gap-3', engagementBadgeCls)}>
            <span className='text-sm font-semibold'>
              {agent.engagement_type === 'AGENT_PROPOSAL'
                ? t('typeAgentProposal')
                : t('typeOwnerInvitation')}
            </span>
            <Badge variant='outline' className={cn('text-[10px] font-semibold', engagementBadgeCls)}>
              {t(`status${agent.engagement_status}` as Parameters<typeof t>[0])}
            </Badge>
          </div>
        </div>
      )}

      {/* Hire button */}
      {!isAccepted && (
        <div className='pt-1'>
          <Button
            className='w-full rounded-xl gap-2 bg-primary'
            onClick={() => setHireDialogOpen(true)}
          >
            <UserCheck className='h-4 w-4' />
            {t('hireButton')}
          </Button>
        </div>
      )}

      {/* Reviews */}
      <div>
        <div className='flex items-center gap-2 mb-3'>
          <MessageSquare className='h-4 w-4 text-slate-400' />
          <p className='text-xs font-bold text-slate-500 uppercase tracking-wide'>
            {t('reviews')} {reviews.length > 0 && `(${reviews.length})`}
          </p>
        </div>
        {reviewsLoading ? (
          <div className='flex justify-center py-4'>
            <div className='h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-primary' />
          </div>
        ) : reviews.length === 0 ? (
          <div className='rounded-xl border border-dashed border-slate-200 bg-slate-50 py-6 text-center'>
            <p className='text-xs text-slate-400'>{t('noReviews')}</p>
          </div>
        ) : (
          <div className='space-y-2.5'>
            {reviews.map((r) => (
              <ReviewItem key={r.review_id} review={r} />
            ))}
          </div>
        )}
      </div>

      {/* Hire dialog */}
      <Dialog open={hireDialogOpen} onOpenChange={setHireDialogOpen}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <UserCheck className='h-5 w-5 text-primary' />
              {t('hireDialogTitle')}
            </DialogTitle>
          </DialogHeader>
          <p className='text-sm text-slate-500'>{t('hireDialogDesc')}</p>
          <div className='space-y-1'>
            <label className='text-sm font-medium text-slate-700'>{t('titleLabel')}</label>
            <Input
              placeholder={t('titlePlaceholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>
          <div className='space-y-1'>
            <label className='text-sm font-medium text-slate-700'>{t('commissionLabel')}</label>
            <Input
              type='number'
              min={0}
              max={100}
              step={0.1}
              placeholder={t('commissionPlaceholder')}
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
            />
          </div>
          <Textarea
            placeholder={t('messagePlaceholder')}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className='resize-none'
            maxLength={2000}
          />
          <DialogFooter className='gap-2'>
            <DialogClose asChild>
              <Button variant='outline' size='sm' className='rounded-lg'>
                {t('cancelAction')}
              </Button>
            </DialogClose>
            <Button
              size='sm'
              className='rounded-lg bg-primary'
              disabled={isPending}
              onClick={() => sendInvitation()}
            >
              {isPending ? (
                <span className='flex items-center gap-2'>
                  <span className='h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white' />
                  {t('sending')}
                </span>
              ) : (
                t('sendInvitation')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface DelegateAgentPageProps {
  propertyId: string;
}

export default function DelegateAgentPage({ propertyId }: DelegateAgentPageProps) {
  const t = useTranslations('DelegateAgent');
  const [selectedAgent, setSelectedAgent] = useState<AgentListItem | null>(null);
  const [search, setSearch] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');

  const debouncedSearch = useDebounce(search, 400);
  const minRating = ratingFilter !== 'all' ? parseFloat(ratingFilter) : undefined;

  const { data: agents = [], isLoading } = useQuery(
    agentProfileQueries.listForProperty({
      propertyId,
      search: debouncedSearch || undefined,
      minRating,
    })
  );

  const { data: propertyTypesData } = useQuery(propertyQueries.propertyTypes());
  const propertyTypeOptions = useMemo(
    () =>
      (propertyTypesData?.payload?.data ?? [])
        .map((pt) => ({ id: pt.property_type_id, name: pt.property_type_name }))
        .filter((pt) => pt.name),
    [propertyTypesData]
  );

  // Specialty filter is client-side only (based on property type names)
  const filteredAgents = useMemo(() => {
    if (specialtyFilter === 'all') return agents;
    return agents.filter((a) =>
      a.specialties?.toLowerCase().includes(specialtyFilter.toLowerCase())
    );
  }, [agents, specialtyFilter]);

  return (
    <div className='flex flex-col h-full overflow-hidden'>
      {/* Header */}
      <div className='flex items-center gap-3 px-5 py-4 border-b border-slate-200 bg-white flex-shrink-0'>
        <Button asChild variant='ghost' size='sm' className='rounded-lg gap-2 -ml-2'>
          <Link href='/dashboard/property'>
            <ArrowLeft className='h-4 w-4' />
            {t('backToProperty')}
          </Link>
        </Button>
        <div className='h-4 w-px bg-slate-200' />
        <h1 className='text-base font-bold text-slate-900'>{t('pageTitle')}</h1>
      </div>

      {/* Body — 7:3 layout */}
      <div className='flex flex-1 overflow-hidden'>
        {/* Left: agent grid */}
        <div className='w-[65%] border-r border-slate-200 overflow-y-auto bg-slate-50/30 flex flex-col'>
          {/* Search & filter bar */}
          <div className='px-4 py-3 border-b border-slate-100 bg-white flex-shrink-0 space-y-2.5'>
            <div className='flex items-center gap-2'>
              <p className='text-xs font-bold text-slate-500 uppercase tracking-wide flex-1'>
                {t('agentListTitle')}
                {!isLoading && (
                  <span className='ml-1.5 font-normal normal-case text-slate-400'>
                    ({filteredAgents.length})
                  </span>
                )}
              </p>
            </div>
            <div className='relative'>
              <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400' />
              <Input
                className='pl-8 h-8 text-sm rounded-lg'
                placeholder={t('searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className='flex gap-2'>
              <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                <SelectTrigger className='h-8 text-xs rounded-lg flex-1'>
                  <SlidersHorizontal className='h-3 w-3 text-slate-400 mr-1.5 flex-shrink-0' />
                  <SelectValue placeholder={t('filterSpecialty')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>{t('allSpecialties')}</SelectItem>
                  {propertyTypeOptions.map((pt) => (
                    <SelectItem key={pt.id} value={pt.name!}>{pt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger className='h-8 text-xs rounded-lg w-[130px]'>
                  <Star className='h-3 w-3 text-amber-400 fill-amber-400 mr-1.5 flex-shrink-0' />
                  <SelectValue placeholder={t('filterRating')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>{t('allRatings')}</SelectItem>
                  <SelectItem value='4'>4+ ★</SelectItem>
                  <SelectItem value='3'>3+ ★</SelectItem>
                  <SelectItem value='2'>2+ ★</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Agent grid */}
          <div className='p-4 flex-1'>
            {isLoading ? (
              <div className='flex justify-center py-10'>
                <div className='h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-primary' />
              </div>
            ) : filteredAgents.length === 0 ? (
              <div className='rounded-xl border border-dashed border-slate-200 bg-white py-10 text-center'>
                <p className='text-sm text-slate-400'>
                  {agents.length === 0 ? t('noAgents') : t('noResults')}
                </p>
              </div>
            ) : (
              <div className='grid grid-cols-2 xl:grid-cols-3 gap-3'>
                {filteredAgents.map((agent) => (
                  <AgentCard
                    key={agent.user_id}
                    agent={agent}
                    isSelected={selectedAgent?.user_id === agent.user_id}
                    onClick={() => setSelectedAgent(agent)}
                    t={t}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: agent detail — ~35% */}
        <div className='flex-1 bg-white overflow-hidden'>
          {selectedAgent ? (
            <AgentDetailPanel
              key={selectedAgent.user_id}
              agent={selectedAgent}
              propertyId={propertyId}
              t={t}
            />
          ) : (
            <div className='h-full flex flex-col items-center justify-center p-6 text-center'>
              <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-50 border border-purple-100'>
                <User className='h-7 w-7 text-primary/40' strokeWidth={1.5} />
              </div>
              <p className='text-sm text-slate-400 max-w-[200px]'>{t('selectAgentHint')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
