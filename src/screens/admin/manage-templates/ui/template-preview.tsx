'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Mail, Smartphone, Bell, Globe, Reply, MoreHorizontal } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

interface TemplatePreviewProps {
  type: 'EMAIL' | 'IN_APP';
  language: string;
  title?: string;
  contentBody: string;
  className?: string;
}

export function TemplatePreview({ type, language, title, contentBody, className }: TemplatePreviewProps) {
  const t = useTranslations('ManageTemplates');
  // Process content to highlight variables
  const processContent = (content: string) => {
    if (!content) return '';

    // Wrap variables ($${var} or ${var}) in styled HTML spans that rehype-raw will preserve
    return content.replace(/\$?\$\{([^}]+)\}/g, (match) => {
      return `<span class="inline-block bg-primary/10 text-primary font-bold px-1 rounded mx-0.5 border border-primary/20 break-all max-w-full">${match}</span>`;
    });
  };

  const processedContent = processContent(contentBody);
  const emptyContent = `<span class='text-slate-300 italic'>${language === 'vi' ? 'Chưa có nội dung...' : 'No content yet...'}</span>`;

  return (
    <div className={cn('flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm', className)}>
      <div className='bg-slate-50 px-4 py-3 border-b flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          {type === 'EMAIL' ? (
            <Mail className='h-4 w-4 text-primary' />
          ) : (
            <Bell className='h-4 w-4 text-amber-500' />
          )}
          <span className='text-xs font-bold text-slate-700'>
            {type === 'EMAIL' ? 'Email Preview' : 'In-app Notification Preview'}
          </span>
        </div>
        <div className='flex items-center gap-1.5'>
          <div className='h-2 w-2 rounded-full bg-slate-300' />
          <span className='text-[10px] text-slate-500 font-medium uppercase'>{language}</span>
        </div>
      </div>

      <div className='p-6 flex-1 overflow-y-auto'>
        <div className='mb-6 space-y-1.5'>
          <p className='text-[10px] text-slate-400 uppercase font-bold tracking-wider'>{language === 'vi' ? 'TIÊU ĐỀ' : 'SUBJECT / TITLE'}</p>
          <h4 className='text-lg font-bold text-slate-900'>{title || (language === 'vi' ? 'Không có chủ đề' : 'No Subject')}</h4>
        </div>

        <div className='space-y-1.5'>
          <p className='text-[10px] text-slate-400 uppercase font-bold tracking-wider'>{language === 'vi' ? 'NỘI DUNG' : 'CONTENT BODY'}</p>
          <div className='p-4 rounded-lg bg-slate-50 border border-slate-100 text-sm text-slate-600 leading-relaxed prose prose-slate max-w-none'>
            {processedContent ? (
              <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                {processedContent}
              </ReactMarkdown>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: emptyContent }} />
            )}
          </div>
        </div>
      </div>

      <div className='p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-4'>
        <div className='flex items-center gap-1.5 text-[10px] text-slate-400'>
          <Globe className='h-3 w-3' />
          <span>RealVista System</span>
        </div>
      </div>
    </div>
  );
}
