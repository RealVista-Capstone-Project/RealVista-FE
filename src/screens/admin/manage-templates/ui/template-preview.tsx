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

  if (type === 'EMAIL') {
    return (
      <div className={cn('flex flex-col h-full bg-slate-50 rounded-lg border border-slate-200 overflow-hidden', className)}>
        {/* Browser Top Bar */}
        <div className='bg-white px-3 py-2 border-b flex items-center gap-3'>
          <div className='flex gap-1'>
            <div className='w-2.5 h-2.5 rounded-full bg-slate-200' />
            <div className='w-2.5 h-2.5 rounded-full bg-slate-200' />
            <div className='w-2.5 h-2.5 rounded-full bg-slate-200' />
          </div>
          <div className='flex-1 bg-slate-50 rounded border border-slate-100 h-6 flex items-center px-2 gap-1.5'>
            <Globe className='h-3 w-3 text-slate-400' />
            <span className='text-[10px] text-slate-500 font-medium truncate'>mail.realvista.com</span>
          </div>
        </div>

        {/* Email Content Area */}
        <div className='flex-1 overflow-y-auto bg-white m-4 rounded border border-slate-200 flex flex-col shadow-sm'>
          <div className='p-4 border-b border-slate-100'>
            <div className='flex items-center gap-3 mb-2'>
              <div className='w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0'>
                <Mail className='h-4 w-4 text-primary' />
              </div>
              <div className='flex-1 min-w-0'>
                <h4 className='text-sm font-semibold text-slate-900 truncate'>{title || (language === 'vi' ? 'Không có chủ đề' : 'No Subject')}</h4>
                <p className='text-[11px] text-slate-500'>From: <span className='text-slate-700'>RealVista Support</span></p>
              </div>
            </div>
          </div>

          <div className='p-6 text-sm text-slate-600 leading-relaxed flex-1 prose prose-slate max-w-none prose-p:my-2'>
            {processedContent ? (
              <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                {processedContent}
              </ReactMarkdown>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: emptyContent }} />
            )}
          </div>

          <div className='p-4 bg-slate-50 border-t border-slate-100 text-center'>
            <p className='text-[10px] text-slate-500'>© 2026 RealVista Inc.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full items-center justify-center bg-slate-50 rounded-lg border border-slate-200 p-8', className)}>
      {/* Mobile Mockup */}
      <div className='relative w-[260px] h-[520px] bg-slate-950 rounded-[32px] border-[6px] border-slate-800 shadow-xl flex flex-col items-center overflow-hidden'>
        {/* Notch */}
        <div className='w-20 h-5 bg-slate-800 absolute top-0 rounded-b-xl z-20' />

        {/* Screen Background */}
        <div className='absolute inset-0 bg-slate-900' />

        {/* Status Bar */}
        <div className='w-full px-5 pt-3 pb-1 flex justify-between items-center z-10 text-slate-400 text-[10px]'>
          <span>9:41</span>
        </div>

        {/* Notification Overlay */}
        <div className='mt-6 w-full px-3 z-10'>
          <div className='bg-white rounded-xl p-3 shadow-md border border-slate-100'>
            <div className='flex items-center gap-2 mb-1.5'>
              <div className='w-5 h-5 rounded bg-primary flex items-center justify-center'>
                <Bell className='h-3 w-3 text-white' />
              </div>
              <span className='text-[10px] font-bold text-slate-900 uppercase'>RealVista</span>
              <span className='text-[10px] text-slate-400 ml-auto'>{language === 'vi' ? 'vừa xong' : 'just now'}</span>
            </div>
            <h4 className='text-xs font-semibold text-slate-900 mb-1 truncate'>{title || (language === 'vi' ? 'Thông báo mới' : 'New Notification')}</h4>
            <div className='relative overflow-hidden max-h-[60px]'>
              <div className='text-[11px] text-slate-600 leading-tight'>
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
        </div>

        {/* Home Indicator */}
        <div className='w-20 h-1 bg-slate-800 absolute bottom-1.5 rounded-full z-20' />
      </div>

      <div className='mt-4'>
        <p className='text-xs text-slate-500 uppercase tracking-widest flex items-center gap-2 justify-center'>
          <Smartphone className='h-3 w-3' />
          {t('form.appPreview')}
        </p>
      </div>
    </div>
  );
}
