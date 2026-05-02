import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { templateApi, VariableDefinition } from '@/shared/api/template.api';
import { Skeleton } from '@/shared/ui/skeleton';
import { Database, Plus, HelpCircle, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/shared/ui/tooltip';

interface VariableLibraryProps {
  templateKey: string;
  onInsert: (key: string) => void;
}

export function VariableLibrary({ templateKey, onInsert }: VariableLibraryProps) {
  const t = useTranslations('ManageTemplates');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'templates', 'schema', templateKey],
    queryFn: () => templateApi.getSchema(templateKey),
    enabled: !!templateKey,
  });

  if (isLoading) {
    return (
      <div className='bg-slate-50/50 p-6 rounded-[2rem] border border-slate-200/60 mt-8 space-y-4 shadow-inner'>
        <Skeleton className="h-4 w-32 bg-slate-200" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-24 rounded-xl bg-slate-200" />
          <Skeleton className="h-10 w-32 rounded-xl bg-slate-200" />
          <Skeleton className="h-10 w-28 rounded-xl bg-slate-200" />
        </div>
      </div>
    );
  }

  const variables = data?.variables || [];

  return (
    <div className='bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/20 mt-8 relative overflow-hidden'>
      <div className='absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none'>
        <Database className='h-24 w-24' />
      </div>

      <div className='flex items-center justify-between mb-5'>
        <div className='flex items-center gap-2'>
           <div className='bg-indigo-50 p-1.5 rounded-lg'>
             <Database className='h-3.5 w-3.5 text-indigo-600' />
           </div>
           <span className='text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none'>{t('form.variableLibrary')}</span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
               <HelpCircle className='h-4 w-4 text-slate-300 cursor-help' />
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-slate-900 text-white border-none p-3 max-w-xs rounded-xl shadow-2xl">
               <p className='text-xs leading-relaxed'>{t('form.variableLibraryTooltip')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className='flex flex-wrap gap-2.5'>
        {variables.length > 0 ? (
          variables.map((v) => (
            <button
              key={v.name}
              type='button'
              onClick={() => onInsert(v.name)}
              className='flex items-center gap-3 px-4 py-2 bg-white hover:bg-indigo-50/50 rounded-xl text-slate-700 transition-all border border-slate-200 hover:border-indigo-200 shadow-sm active:scale-95 group relative pr-10'
              title={v.description}
            >
              <div className='flex flex-col items-start'>
                <div className='flex items-center gap-1.5'>
                   <span className='text-xs font-bold'>{v.name}</span>
                   {v.required && <span className="text-[10px] text-red-500 font-black animate-pulse">*</span>}
                </div>
                <span className='text-[9px] text-slate-400 font-bold uppercase tracking-tighter opacity-60'>{v.description}</span>
              </div>
              <div className='absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                 <Plus className='h-3 w-3 text-indigo-600' />
              </div>
            </button>
          ))
        ) : (
          <div className='flex flex-col items-center justify-center w-full py-6 gap-2'>
             <Info className='h-6 w-6 text-slate-200' />
             <span className="text-xs text-slate-400 font-medium italic">{t('form.variableLibraryEmpty')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
