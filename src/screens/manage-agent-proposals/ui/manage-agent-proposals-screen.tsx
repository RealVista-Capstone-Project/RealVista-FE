'use client';

import * as React from 'react';
import { Search, Plus, FileText, TrendingUp, Award, ChevronRight, Trash2, X, UserCheck, Briefcase, BarChart3, Clock } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useMyProposalsQuery, useCancelProposalMutation } from '@/features/agent-proposal/hooks/use-agent-proposal';
import { AgentProposalStatus, AgentProposal } from '@/entities/agent-proposal/model/types';
import { RealVistaPagination } from '@/shared/ui/realvista-pagination/realvista-pagination';
import { cn } from '@/shared/lib/utils';
import { useDebounce, useIsMobile } from '@/shared/lib/hooks';

/**
 * Manage Agent Proposals Screen
 * Optimized for professional CV management, search, and independent scrolling areas.
 * Height is constrained to fill only the viewport space below the dashboard header.
 */
export function ManageAgentProposalsScreen() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(0);
  const size = 10;

  const isMobile = useIsMobile();
  const locale = useLocale();

  const { data, isLoading } = useMyProposalsQuery(page, size);
  const deleteMutation = useCancelProposalMutation();

  const proposals = React.useMemo(() => data?.content || [], [data]);

  // Handle Search Filtering
  const filteredProposals = React.useMemo(() => {
    if (!debouncedSearchQuery) return proposals;
    const query = debouncedSearchQuery.toLowerCase();
    return proposals.filter((p) =>
      p.title.toLowerCase().includes(query) ||
      p.pitch_content.toLowerCase().includes(query)
    );
  }, [proposals, debouncedSearchQuery]);

  const selectedProposal = React.useMemo(() => {
    return proposals.find((p) => p.agent_proposal_id === selectedId) || null;
  }, [proposals, selectedId]);

  const handleDelete = (id: string) => {
    if (typeof window !== 'undefined' && window.confirm('Bạn có chắc chắn muốn lưu trữ mẫu hồ sơ này?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading && page === 0) {
    return (
      <div className='flex h-[calc(100vh-80px)] items-center justify-center bg-purple-98'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-purple-92 border-t-main-primary' />
      </div>
    );
  }

  return (
    <div className='flex h-[calc(100vh-80px)] flex-col overflow-hidden bg-purple-98'>
      {/* Title Header (Sticky-like at top of the component) */}
      {(!isMobile || !selectedId) && (
        <header className='shrink-0 bg-white border-b border-purple-92/50 p-4 sm:px-8 py-5'>
           <div className='flex items-center justify-between'>
              <div className='space-y-1'>
                <h1 className='text-2xl font-black text-main-black tracking-tight flex items-center gap-3'>
                  <Briefcase className='text-main-primary' size={24} />
                  Hồ sơ CV chuyên nghiệp
                </h1>
                <p className='text-xs font-bold text-main-secondary/40 uppercase tracking-widest'>
                  Danh sách hồ sơ chuyên sâu của bạn trên hệ thống RealVista
                </p>
              </div>
              <button
                type='button'
                className='flex items-center gap-2 rounded-xl bg-main-primary px-5 py-3 text-sm font-black text-white shadow-lg shadow-main-primary/20 transition-all hover:bg-main-primary/90 hover:scale-[1.02] active:scale-[0.98]'
              >
                <Plus size={18} strokeWidth={3} />
                <span>Tạo CV mới</span>
              </button>
           </div>
        </header>
      )}

      {/* Main Container - This area DOES NOT scroll globally */}
      <div className='flex flex-1 overflow-hidden h-full'>

        {/* Left column: Scrollable List */}
        <aside
          className={cn(
            'flex flex-col h-full bg-white transition-all duration-300 border-r border-purple-92/50',
            selectedId
              ? (isMobile ? 'hidden' : 'w-[420px] lg:w-[480px]')
              : 'w-full'
          )}
        >
          {/* Search Box */}
          <div className='p-4 sm:px-8 py-4 border-b border-purple-92/50 bg-white shrink-0'>
            <div className='relative'>
              <Search className='absolute left-4 top-1/2 -translate-y-1/2 text-main-secondary/30' size={16} />
              <input
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Tìm hồ sơ...'
                className='h-11 w-full rounded-xl border border-purple-92 bg-purple-98/50 pl-11 pr-4 text-sm font-bold text-main-black placeholder:text-main-secondary/30 focus:border-main-primary focus:bg-white focus:outline-none transition-all'
              />
            </div>
          </div>

          {/* List content - INDEPENDENT SCROLL */}
          <div className='flex-1 overflow-y-auto custom-scrollbar p-4 sm:px-8 bg-purple-98/10 h-full'>
            <div className='flex flex-col gap-3 py-4'>
              {filteredProposals.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-20 opacity-20'>
                  <FileText size={48} className='mb-2' />
                  <p className='text-sm font-black uppercase'>Trống</p>
                </div>
              ) : (
                filteredProposals.map((proposal) => (
                  <ProposalRow
                    key={proposal.agent_proposal_id}
                    proposal={proposal}
                    isSelected={proposal.agent_proposal_id === selectedId}
                    isSplitView={!!selectedId}
                    onClick={() => setSelectedId(proposal.agent_proposal_id)}
                    onDelete={() => handleDelete(proposal.agent_proposal_id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Pagination */}
          {data && data.total_pages > 1 && !selectedId && (
            <div className='border-t border-purple-92/50 p-4 bg-white shrink-0'>
              <RealVistaPagination
                currentPage={page + 1}
                totalPages={data.total_pages}
                onPageChange={(p) => setPage(p - 1)}
              />
            </div>
          )}
        </aside>

        {/* Right column: Scrollable Preview */}
        {selectedId && (
          <main className={cn(
            'flex-1 flex flex-col h-full overflow-hidden bg-white',
            isMobile ? 'fixed inset-0 z-50' : 'relative animate-in slide-in-from-right-10 duration-500'
          )}>
            {selectedProposal ? (
              <div className='flex h-full flex-col overflow-hidden'>
                {/* Fixed Detail Header */}
                <header className='border-b border-purple-92/50 p-4 sm:px-8 py-5 flex items-center justify-between shrink-0 bg-white'>
                   <div className='flex items-center gap-4 overflow-hidden'>
                    <button
                      onClick={() => setSelectedId(null)}
                      className='flex h-10 w-10 items-center justify-center rounded-xl hover:bg-purple-98 text-main-secondary/50 transition-colors'
                    >
                      <X size={20} />
                    </button>
                    <div className='overflow-hidden'>
                       <h2 className='text-xl font-black text-main-black tracking-tight truncate'>{selectedProposal.title}</h2>
                       <div className='flex items-center gap-2 mt-0.5'>
                          <span className={cn(
                            'rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ring-1',
                            selectedProposal.status === AgentProposalStatus.ACTIVE
                              ? 'bg-green-50 text-green-600 ring-green-100'
                              : 'bg-amber-50 text-amber-600 ring-amber-100'
                          )}>
                            {selectedProposal.status === AgentProposalStatus.ACTIVE ? 'Hoạt động' : 'Bản nháp'}
                          </span>
                       </div>
                    </div>
                  </div>

                  <div className='flex items-center gap-2'>
                    <button
                       onClick={() => handleDelete(selectedProposal.agent_proposal_id)}
                       className='p-2.5 text-main-secondary/20 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all'
                    >
                       <Trash2 size={18} />
                    </button>
                    <button className='rounded-xl bg-main-secondary px-5 py-2.5 text-xs font-black text-white hover:bg-main-secondary/90 transition-all'>
                      Chỉnh sửa CV
                    </button>
                  </div>
                </header>

                {/* Independent Scrollable CV Area */}
                <div className='flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-10 space-y-10 bg-purple-98/10 h-full'>
                   {/* CV Header Style */}
                   <div className='rounded-3xl border border-purple-92/50 bg-white p-8 shadow-sm relative overflow-hidden'>
                      <div className='absolute top-0 right-0 w-24 h-24 bg-main-primary/5 rounded-bl-full -mr-4 -mt-4' />
                      <div className='relative z-10 flex flex-col md:flex-row gap-6 items-center'>
                         <div className='h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-purple-92 flex items-center justify-center text-main-primary'>
                            <UserCheck size={36} />
                         </div>
                         <div className='flex-1 text-center md:text-left'>
                            <p className='text-xs font-black text-main-primary uppercase tracking-widest mb-1 italic'>Hồ sơ chuyên gia xác thực</p>
                            <h3 className='text-3xl font-black text-main-black tracking-tighter leading-none mb-2'>Hồ Sơ Năng Lực Chuyên Gia</h3>
                            <p className='text-[10px] font-bold text-main-secondary/40 uppercase tracking-[0.2em]'>Đã tối ưu hóa cho công cụ tìm kiếm RealVista</p>
                         </div>
                         <div className='flex gap-3'>
                            <div className='bg-purple-98/50 border border-purple-92/30 px-5 py-3 rounded-2xl text-center min-w-[90px]'>
                               <p className='text-[9px] font-black text-main-secondary/30 uppercase mb-1'>Kinh nghiệm</p>
                               <span className='text-xl font-black text-main-black tracking-tight'>{selectedProposal.experience_years} năm</span>
                            </div>
                            <div className='bg-main-primary/5 border border-main-primary/10 px-5 py-3 rounded-2xl text-center min-w-[90px]'>
                               <p className='text-[9px] font-black text-main-primary/40 uppercase mb-1'>Hoa hồng</p>
                               <span className='text-xl font-black text-main-primary tracking-tight'>{selectedProposal.commission_rate}%</span>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Pitch Area */}
                   <div className='space-y-4'>
                      <div className='flex items-center gap-3 ml-2'>
                        <div className='h-1.5 w-1.5 rounded-full bg-main-primary' />
                        <span className='text-[10px] font-black text-main-black uppercase tracking-[0.2em]'>Giới thiệu & Thuyết minh chiến lược</span>
                      </div>
                      <div className='rounded-[32px] border border-purple-92/50 bg-white p-8 sm:p-12 shadow-sm leading-relaxed text-main-black text-lg font-medium italic relative overflow-hidden'>
                         <span className='absolute top-4 left-6 text-8xl text-purple-98 font-serif leading-none select-none'>&quot;</span>
                         <p className='relative z-10 whitespace-pre-wrap'>{selectedProposal.pitch_content}</p>
                      </div>
                   </div>

                   {/* Operations Stats */}
                   <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
                      <OperationItem value='12' label='Lượt đề xuất' icon={BarChart3} />
                      <OperationItem value='4' label='Đang thương thảo' icon={Clock} />
                      <OperationItem value='4.8/5' label='Đánh giá' icon={Award} />
                      <OperationItem value='98%' label='Tin cậy' icon={TrendingUp} />
                   </div>
                </div>

                {/* Fixed Footer */}
                <footer className='shrink-0 bg-white border-t border-purple-92/50 p-6 flex items-center justify-between'>
                   <p className='text-[10px] font-bold text-main-secondary/40 uppercase tracking-widest'>
                     Lần cuối cập nhật: {new Date(selectedProposal.updated_at).toLocaleString(locale)}
                   </p>
                   <div className='flex items-center gap-3'>
                      <button className='px-6 py-2.5 rounded-xl border border-purple-92 text-xs font-black text-main-black hover:bg-purple-98 transition-all'>Sao chép</button>
                      <button className='px-6 py-2.5 rounded-xl bg-main-primary text-xs font-black text-white shadow-lg shadow-main-primary/10 hover:bg-main-primary/90 transition-all'>Sử dụng ngay</button>
                   </div>
                </footer>
              </div>
            ) : null}
          </main>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
}

/**
 * Proposal Card/Row Component
 */
function ProposalRow({ proposal, isSelected, isSplitView, onClick, onDelete }: {
  proposal: AgentProposal;
  isSelected: boolean;
  isSplitView: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative flex flex-col p-5 cursor-pointer transition-all duration-300 rounded-2xl border bg-white overflow-hidden',
        isSelected
          ? 'border-main-primary shadow-xl bg-indigo-50/10 ring-4 ring-main-primary/5 translate-x-1'
          : 'border-purple-92/40 hover:border-main-primary/30 hover:shadow-lg'
      )}
    >
      {/* Side bar indicator */}
      {isSelected && <div className='absolute inset-y-0 left-0 w-1 bg-main-primary' />}

      <div className='flex items-start gap-4'>
        {/* Icon Square */}
        <div className={cn(
          'flex size-12 shrink-0 items-center justify-center rounded-2xl transition-all',
          isSelected ? 'bg-main-primary text-white shadow-md' : 'bg-purple-98 text-main-secondary/40 group-hover:bg-indigo-50 group-hover:text-main-primary'
        )}>
           <FileText size={22} />
        </div>

        {/* Text Content */}
        <div className='flex-1 overflow-hidden'>
          <div className='flex items-center justify-between gap-2 mb-1'>
            <h3 className={cn(
              'text-base font-black leading-tight tracking-tight line-clamp-1 transition-colors',
              isSelected ? 'text-main-primary' : 'text-main-black group-hover:text-main-primary'
            )}>
              {proposal.title}
            </h3>
            <span className={cn(
              'text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg',
              proposal.status === AgentProposalStatus.ACTIVE ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
            )}>
              {proposal.status === AgentProposalStatus.ACTIVE ? 'Active' : 'Draft'}
            </span>
          </div>

          <div className='flex items-center gap-4 text-[11px] font-bold text-main-secondary/30'>
            <span className='flex items-center gap-1.5'><Award size={13} /> {proposal.experience_years} năm</span>
            <span className='flex items-center gap-1.5'><TrendingUp size={13} /> {proposal.commission_rate}%</span>
          </div>
        </div>

        {/* Basic Action (Trash) */}
        {!isSplitView && (
           <div className='flex items-center gap-2'>
             <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className='p-2.5 text-main-secondary/10 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100'
             >
                <Trash2 size={16} />
             </button>
             <ChevronRight size={18} className={cn('transition-all', isSelected ? 'text-main-primary' : 'text-main-secondary/10 group-hover:text-main-primary')} />
           </div>
        )}
      </div>
    </div>
  );
}

/**
 * Statistics Component
 */
function OperationItem({ value, label, icon: Icon }: { value: string; label: string; icon: React.ElementType }) {
  return (
    <div className='flex flex-col p-5 bg-white rounded-3xl border border-purple-92/40 shadow-sm hover:shadow-md transition-shadow'>
      <div className='flex items-center gap-2 mb-3'>
         <div className='size-8 rounded-lg bg-purple-98 flex items-center justify-center text-main-secondary/40'>
            <Icon size={16} />
         </div>
         <p className='text-[10px] font-black uppercase tracking-widest text-main-secondary/30 leading-none'>{label}</p>
      </div>
      <p className='text-3xl font-black text-main-black tracking-tighter leading-none'>{value}</p>
    </div>
  );
}
