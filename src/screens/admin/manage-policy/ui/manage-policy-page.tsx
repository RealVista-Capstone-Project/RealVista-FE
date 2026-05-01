'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import {
  Plus,
  Search,
  FileText,
  ShieldCheck,
  Save,
  Trash2,
  Power,
  AlertCircle,
  Calendar,
  Eye,
  Edit3,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ExternalLink,
  History,
  Info
} from 'lucide-react';

import { policyApi, Policy } from '@/entities/policy/api/policy.api';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Separator } from '@/shared/ui/separator';
import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';

import { cn } from '@/shared/lib/utils';
import { format } from 'date-fns';

export function ManagePolicyPage() {
  const t = useTranslations('ManagePolicy');
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<'edit' | 'preview'>('edit');
  const [searchTerm, setSearchTerm] = React.useState('');

  // Form State
  const [formData, setFormData] = React.useState<Partial<Policy>>({
    title: '',
    slug: '',
    content: ''
  });

  const { data: policies, isLoading } = useQuery({
    queryKey: ['admin', 'policies'],
    queryFn: () => policyApi.getAllPolicies(),
  });

  const policyList = policies?.payload.data || [];
  const selectedPolicy = policyList.find((p: Policy) => p.policy_id === selectedId);
  const filteredPolicies = policyList.filter((p: Policy) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  React.useEffect(() => {
    if (selectedPolicy) {
      setFormData({
        title: selectedPolicy.title,
        slug: selectedPolicy.slug,
        content: selectedPolicy.content
      });
      setTab('preview');
    } else {
      setFormData({ title: '', slug: '', content: '' });
      setTab('edit');
    }
  }, [selectedPolicy, selectedId]);

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Policy>) =>
      selectedId
        ? policyApi.updatePolicy(selectedId, data)
        : policyApi.createPolicy(data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'policies'] });
      const savedPolicy = res.payload.data;
      setSelectedId(savedPolicy.policy_id);
      toast.success('Policy saved successfully');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to save policy');
    }
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => policyApi.activatePolicy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'policies'] });
      toast.success('Policy activated');
    }
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => policyApi.deactivatePolicy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'policies'] });
      toast.success('Policy deactivated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => policyApi.deletePolicy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'policies'] });
      setSelectedId(null);
      toast.success('Policy deleted');
    }
  });

  const handleCreateNew = () => {
    setSelectedId(null);
    setFormData({ title: '', slug: '', content: '' });
    setTab('edit');
  };

  const hasUnsavedChanges = selectedPolicy && (
    formData.title !== selectedPolicy.title ||
    formData.slug !== selectedPolicy.slug ||
    formData.content !== selectedPolicy.content
  );

  return (
    <div className='flex h-[calc(100vh-80px)] gap-6 p-8 overflow-hidden bg-slate-50/50 dark:bg-slate-950'>
      {/* Sidebar: Policy List */}
      <div className='w-80 flex flex-col shrink-0 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden dark:bg-slate-950 dark:border-slate-800'>
        <div className='p-4 border-b border-slate-100 dark:border-slate-800 space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2'>
                <ShieldCheck className='h-5 w-5 text-slate-500' />
                {t('sidebar.title')}
              </h2>
            </div>
            <Button
              size='icon'
              variant='outline'
              className='h-8 w-8'
              onClick={handleCreateNew}
            >
              <Plus className='h-4 w-4' />
            </Button>
          </div>

          <div className='relative'>
            <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500' />
            <Input
              placeholder={t('sidebar.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='h-9 pl-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            />
          </div>
        </div>

        <div className='flex-1 p-2 overflow-y-auto custom-scrollbar space-y-1'>
          {filteredPolicies?.map((p: Policy, index: number) => (
            <button
              key={p.policy_id || `policy-${index}`}
              onClick={() => setSelectedId(p.policy_id)}
              className={cn(
                'w-full text-left p-3 rounded-md transition-colors group flex items-start gap-3',
                selectedId === p.policy_id
                  ? 'bg-slate-100 dark:bg-slate-800'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
              )}
            >
              <FileText className={cn('h-4 w-4 mt-0.5', selectedId === p.policy_id ? 'text-slate-900 dark:text-slate-50' : 'text-slate-500')} />

              <div className='flex-1 min-w-0 pr-4'>
                <div className='font-medium text-sm tracking-tight text-slate-900 dark:text-slate-50'>{p.title}</div>
                <div className='text-xs text-slate-500 truncate mt-0.5'>
                  /{p.slug}
                </div>
              </div>

              <div className='flex flex-col items-end pt-1'>
                {p.is_active ? (
                  <div className='h-2 w-2 rounded-full bg-emerald-500' />
                ) : (
                  <div className='h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600' />
                )}
              </div>
            </button>
          ))}

          {(!filteredPolicies || filteredPolicies.length === 0) && !isLoading && (
            <div className='text-center py-12'>
              <p className='text-slate-500 text-sm'>{t('sidebar.empty')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Area: Editor */}
      <div className='flex-1 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden dark:bg-slate-950 dark:border-slate-800'>
        <header className='px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between'>
          <div className='flex items-center gap-6'>
            <div className='flex flex-col'>
              <div className='flex items-center gap-3'>
                <h1 className='text-xl font-semibold text-slate-900 dark:text-slate-50 tracking-tight'>
                  {selectedId ? t('editor.header.edit') : t('editor.header.create')}
                </h1>
                {selectedPolicy?.is_active ? (
                  <Badge className='bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-50'>
                    <CheckCircle2 className='h-3 w-3 mr-1' /> {t('editor.header.published')}
                  </Badge>
                ) : selectedId ? (
                  <Badge variant='outline' className='text-slate-500'>
                    <XCircle className='h-3 w-3 mr-1' /> {t('editor.header.draft')}
                  </Badge>
                ) : null}
              </div>

              {selectedPolicy && (
                <div className='flex items-center gap-4 mt-2'>
                  <div className='flex items-center gap-1.5 text-xs text-slate-500'>
                    <History className='h-3.5 w-3.5' />
                    {t('editor.header.version')} {selectedPolicy.version}
                  </div>
                  <div className='flex items-center gap-1.5 text-xs text-slate-500'>
                    <Calendar className='h-3.5 w-3.5' />
                    {t('editor.header.lastUpdated')} {selectedPolicy.updated_at && !isNaN(new Date(selectedPolicy.updated_at).getTime())
                        ? format(new Date(selectedPolicy.updated_at), 'PPp')
                        : '---'}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className='flex items-center gap-3'>
            {selectedPolicy && (
              <>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-9 w-9 text-slate-500 hover:text-red-600'
                  onClick={() => deleteMutation.mutate(selectedPolicy.policy_id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
                <div className='h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1' />
                <Button
                  variant='outline'
                  className='h-9 text-xs'
                  onClick={() => selectedPolicy.is_active
                    ? deactivateMutation.mutate(selectedPolicy.policy_id)
                    : activateMutation.mutate(selectedPolicy.policy_id)
                  }
                  disabled={activateMutation.isPending || deactivateMutation.isPending}
                >
                  <Power className='h-3.5 w-3.5 mr-2' />
                  {selectedPolicy.is_active ? t('editor.actions.deactivate') : t('editor.actions.activate')}
                </Button>
              </>
            )}
            <Button
              className='h-9 text-xs shadow-sm'
              onClick={() => saveMutation.mutate(formData)}
              disabled={saveMutation.isPending || !formData.title || !formData.slug || (!!selectedId && !hasUnsavedChanges)}
            >
              <Save className='h-3.5 w-3.5 mr-2' />
              {t('editor.actions.save')}
            </Button>
          </div>
        </header>

        <div className='px-6 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between'>
          <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
            <TabsList className='h-9'>
              <TabsTrigger value='preview' className='text-xs px-4'>
                <Eye className='h-3.5 w-3.5 mr-2' /> {t('editor.tabs.preview')}
              </TabsTrigger>
              <TabsTrigger value='edit' className='text-xs px-4'>
                <Edit3 className='h-3.5 w-3.5 mr-2' /> {t('editor.tabs.edit')}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className='flex items-center gap-4 text-slate-500'>
            {hasUnsavedChanges && (
              <div className='flex items-center gap-1.5 text-amber-600'>
                <AlertCircle className='h-3.5 w-3.5' />
                <span className='text-xs font-medium'>{t('editor.unsaved')}</span>
              </div>
            )}
          </div>
        </div>

        <div className='flex-1 overflow-hidden flex flex-col'>
          {tab === 'edit' ? (
            <div className='p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar bg-slate-50/30 dark:bg-slate-900/30'>
              <div className='grid grid-cols-2 gap-6'>
                <div className='space-y-2'>
                  <label className='text-xs font-medium text-slate-700 dark:text-slate-300'>{t('editor.title')}</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        title: val,
                        slug: !selectedId ? val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : prev.slug
                      }));
                    }}
                    placeholder={t('placeholders.title')}
                    className='h-9 bg-white dark:bg-slate-950'
                  />
                </div>
                <div className='space-y-2'>
                  <label className='text-xs font-medium text-slate-700 dark:text-slate-300'>{t('editor.slug')}</label>
                  <div className='relative'>
                    <div className='absolute left-3 top-1/2 -translate-y-1/2 flex items-center text-slate-400 font-medium pointer-events-none'>
                      /
                    </div>
                    <Input
                      value={formData.slug}
                      onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                      placeholder={t('placeholders.slug')}
                      className='h-9 pl-6 bg-white dark:bg-slate-950 font-mono text-sm'
                    />
                  </div>
                </div>
              </div>

              <div className='space-y-2 flex-1 flex flex-col min-h-0'>
                <div className='flex items-center justify-between'>
                  <label className='text-xs font-medium text-slate-700 dark:text-slate-300'>{t('editor.content')}</label>
                </div>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder={t('placeholders.content')}
                  className='flex-1 min-h-[450px] bg-white dark:bg-slate-950 resize-none font-mono text-sm'
                />
              </div>
            </div>
          ) : (
            <div className='flex-1 overflow-y-auto p-8 custom-scrollbar bg-white dark:bg-slate-950'>
              <div className='max-w-[800px] mx-auto'>
                <div className='mb-8'>
                  <h1 className='text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight mb-2'>
                    {formData.title || 'Untitled Document'}
                  </h1>
                  <div className='flex items-center gap-2 text-slate-500 text-sm'>
                    <span>{t('editor.preview.updated')}: {format(new Date(), 'PPPP')}</span>
                    <span>•</span>
                    <span>{t('editor.slug')}: /{formData.slug}</span>
                  </div>
                  <Separator className='mt-6 mb-2' />
                </div>

                <article className='prose prose-slate dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:underline'>
                  {formData.content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                      {formData.content}
                    </ReactMarkdown>
                  ) : (
                    <div className='flex flex-col items-center justify-center py-24 text-slate-400'>
                      <Edit3 className='h-12 w-12 mb-4 opacity-20' />
                      <p className='text-lg'>{t('editor.preview.empty')}</p>
                    </div>
                  )}
                </article>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
