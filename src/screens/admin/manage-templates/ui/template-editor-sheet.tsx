'use client';

import * as React from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { templateApi, NotificationTemplate } from '@/shared/api/template.api';
import { Sheet, SheetContent } from '@/shared/ui/sheet';
import { Badge } from '@/shared/ui/badge';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { TemplatePreview } from './template-preview';
import Editor from '@monaco-editor/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';

// SRP Components
import { EditorHeader } from './editor-header';
import { ConfigSection } from './config-section';

interface TemplateEditorSheetProps {
  template: NotificationTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateEditorSheet({ template, open, onOpenChange }: TemplateEditorSheetProps) {
  const t = useTranslations('ManageTemplates');
  const queryClient = useQueryClient();
  const editorRef = React.useRef<any>(null);
  const monacoRef = React.useRef<any>(null);
  const decorationsRef = React.useRef<any>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = React.useState(false);

  const [formData, setFormData] = React.useState<Partial<NotificationTemplate>>({
    template_key: '',
    name: '',
    type: 'EMAIL',
    language: 'vi',
    title: '',
    content_body: '',
  });

  React.useEffect(() => {
    if (template) {
      setFormData(template);
    } else {
      setFormData({
        template_key: '',
        name: '',
        type: 'EMAIL',
        language: 'vi',
        title: '',
        content_body: '',
      });
    }
  }, [template, open]);

  const { data: schemaData } = useQuery({
    queryKey: ['admin', 'templates', 'schema', formData.template_key],
    queryFn: () => templateApi.getSchema(formData.template_key || 'DEFAULT'),
    enabled: !!formData.template_key,
  });

  const mutation = useMutation({
    mutationFn: (data: Partial<NotificationTemplate>) => {
      if (template) {
        const updateData = {
          name: data.name,
          title: data.title,
          content_body: data.content_body,
        };
        return templateApi.update(template.template_id, updateData);
      }
      const createData = {
        template_key: data.template_key?.toUpperCase() || '',
        name: data.name || '',
        type: data.type || 'EMAIL',
        language: data.language || 'vi',
        title: data.title || '',
        content_body: data.content_body || '',
      };
      return templateApi.create(createData as any);
    },
    onSuccess: () => {
      toast.success(template ? t('actions.updateSuccess') : t('actions.createSuccess'), {
        className: 'bg-white border-primary/20 text-slate-800 font-bold',
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'templates'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || '';
      if (msg.includes('already exists')) {
        toast.error(t('errors.keyExists'), {
           className: 'bg-red-50 text-red-600 border-red-200 font-medium'
         });
      } else {
        toast.error(t('errors.default'), {
           className: 'bg-red-50 text-red-600 border-red-200 font-medium'
         });
      }
    },
  });

  const isFormDirty = React.useMemo(() => {
    if (!template) {
       return formData.template_key !== '' || formData.name !== '' || formData.title !== '' || formData.content_body !== '';
    }
    return formData.name !== template.name ||
           formData.title !== template.title ||
           formData.content_body !== template.content_body ||
           formData.type !== template.type ||
           formData.language !== template.language;
  }, [formData, template]);

  const handleOpenChange = (openStatus: boolean) => {
    if (!openStatus && isFormDirty) {
      setShowUnsavedDialog(true);
      return;
    }
    onOpenChange(openStatus);
  };

  const handleSubmit = React.useCallback(() => {
    // 1. Extract variables from content using Regex
    const content = formData.content_body || '';
    const title = formData.title || '';
    const combinedContent = `${title} ${content}`;
    const variableRegex = /\${(.*?)}/g;
    const usedVariables = new Set<string>();
    let match;

    while ((match = variableRegex.exec(combinedContent)) !== null) {
      usedVariables.add(match[1]);
    }

    // 2. Validate against schema
    const schemaVars = schemaData?.variables || [];
    const missingRequired = schemaVars
      .filter((v) => v.required)
      .filter((v) => !usedVariables.has(v.name));

    const invalidUsed = Array.from(usedVariables)
      .filter((v) => !schemaVars.some((sv) => sv.name === v));

    if (missingRequired.length > 0) {
      toast.error(t('errors.missingRequired', { vars: missingRequired.map((v) => v.name).join(', ') }), {
        className: 'bg-red-50 text-red-600 border-red-200 font-medium'
      });
      return;
    }

    if (invalidUsed.length > 0) {
      toast.error(t('errors.invalidUsed', { vars: invalidUsed.join(', ') }), {
        className: 'bg-red-50 text-red-600 border-red-200 font-medium'
      });
      return;
    }

    mutation.mutate(formData);
  }, [formData, mutation, schemaData, t]);

  // Keyboard Shortcuts for Power Users
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Quick Save (Cmd/Ctrl + S)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        if (open) {
          e.preventDefault();
          handleSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleSubmit]); // Rebind when dependencies change

  // Monaco Variable Highlighting Logic
  const updateDecorations = React.useCallback((content: string) => {
    if (!editorRef.current || !monacoRef.current) return;

    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const variableRegex = /\${([^}]+)}/g;
    const matches = [];
    let match;

    while ((match = variableRegex.exec(content)) !== null) {
      const startPos = editor.getModel().getPositionAt(match.index);
      const endPos = editor.getModel().getPositionAt(match.index + match[0].length);
      matches.push({
        range: new monaco.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column),
        options: { inlineClassName: 'monaco-variable-highlight' }
      });
    }

    if (!decorationsRef.current) {
      decorationsRef.current = editor.createDecorationsCollection([]);
    }
    decorationsRef.current.set(matches);
  }, []);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    // Initial highlight
    setTimeout(() => updateDecorations(formData.content_body || ''), 100);
  };

  const handleContentChange = (value: string | undefined) => {
    const content = value || '';
    setFormData({ ...formData, content_body: content });
    updateDecorations(content);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .monaco-variable-highlight {
          background-color: rgba(79, 70, 229, 0.15) !important;
          color: #4F46E5 !important;
          font-weight: 700 !important;
          border-radius: 4px;
          padding: 0 2px;
          box-shadow: 0 0 0 1px rgba(79, 70, 229, 0.3) inset;
        }
      `}} />
      <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side='right' className='sm:max-w-none p-0 border-none flex flex-col h-full bg-white w-full xl:w-[1100px]'>
        <EditorHeader
          isEdit={!!template}
          templateKey={template?.template_key}
          onCancel={() => handleOpenChange(false)}
          onSubmit={handleSubmit}
          isPending={mutation.isPending}
        />

        <div className='flex flex-1 overflow-hidden'>
          {/* Form Content */}
          <div className='flex-1 overflow-y-auto p-8 bg-white border-r border-slate-100 custom-scrollbar'>
            <div className='max-w-2xl mx-auto space-y-8'>
              <ConfigSection
                formData={formData}
                setFormData={setFormData}
                isEdit={!!template}
              />

              <div className='space-y-4'>
                <Label htmlFor='title' className='text-sm font-bold text-slate-700 uppercase tracking-tight'>
                  {t('form.title')}
                </Label>
                <Input
                  id='title'
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t('form.titlePlaceholder')}
                  className='h-12 rounded-xl border-slate-200 bg-slate-50/30 focus:bg-white transition-all text-base'
                />
              </div>

              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                   <Label className='text-sm font-bold text-slate-700 uppercase tracking-tight'>{t('form.contentBody')}</Label>
                   <Badge variant='outline' className='text-[10px] font-black uppercase tracking-widest px-2 py-0.5 text-primary bg-primary/5 border-primary/10'>
                     {formData.type === 'EMAIL' ? 'HTML' : 'TEXT'}
                   </Badge>
                </div>

                {formData.type === 'EMAIL' ? (
                  <div className='rounded-2xl border-2 border-slate-100 overflow-hidden bg-white shadow-sm'>
                    <Editor
                      height="450px"
                      language="html"
                      theme="light"
                      onMount={handleEditorDidMount}
                      value={formData.content_body || ''}
                      onChange={handleContentChange}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineHeight: 22,
                        wordWrap: 'on',
                        padding: { top: 20, bottom: 20 },
                        scrollBeyondLastLine: false,
                        fontFamily: 'JetBrains Mono, monospace',
                        renderLineHighlight: 'none',
                      }}
                    />
                  </div>
                ) : (
                  <textarea
                    id='contentBody'
                    value={formData.content_body}
                    onChange={(e) => setFormData({ ...formData, content_body: e.target.value })}
                    className='w-full min-h-[300px] rounded-2xl border-2 border-slate-100 p-6 text-base font-medium focus:border-primary/20 focus:outline-none resize-none transition-all shadow-sm'
                    placeholder={t('form.placeholdersHint')}
                    required
                  />
                )}
              </div>
            </div>
          </div>

          {/* Fixed Preview Panel */}
          <div className='w-[450px] bg-slate-50/50 flex flex-col border-l border-slate-100'>
            <div className='p-6 flex items-center justify-between border-b border-slate-100 bg-white/80'>
              <h3 className='font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]'>
                 {t('form.livePreview')}
              </h3>

              {formData.type === 'EMAIL' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[11px] font-bold px-3 bg-white text-primary shadow-sm border border-slate-200 hover:bg-slate-50"
                  onClick={() => {
                    toast.promise(
                      templateApi.testSend({
                        type: formData.type as string,
                        title: formData.title as string,
                        content_body: formData.content_body as string
                      }),
                      {
                        loading: t('form.test.loading'),
                        success: () => t('form.test.success'),
                        error: (err: any) => err?.response?.data?.message || t('form.test.error')
                      }
                    )
                  }}
                >
                  {t('form.test.button')}
                </Button>
              )}
            </div>

            <div className='flex-1 flex items-center justify-center p-8 overflow-hidden'>
              <TemplatePreview
                type={formData.type as any}
                language={formData.language || 'vi'}
                title={formData.title}
                contentBody={formData.content_body || ''}
                className='shadow-2xl rounded-3xl border border-slate-200 bg-white scale-95'
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>

    <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
      <DialogContent className='sm:max-w-md bg-white border border-slate-200'>
        <DialogHeader>
          <DialogTitle className='text-lg font-bold text-slate-900'>{t('dialog.unsavedTitle')}</DialogTitle>
        </DialogHeader>
        <div className='text-sm text-slate-500 py-3'>
          {t('dialog.unsavedDesc')}
        </div>
        <div className='flex items-center justify-end gap-3 mt-4'>
          <Button variant='outline' onClick={() => setShowUnsavedDialog(false)}>
            {t('dialog.continueEditing')}
          </Button>
          <Button variant='destructive' onClick={() => {
            setShowUnsavedDialog(false);
            onOpenChange(false);
          }}>
            {t('dialog.discardChanges')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </>
  );
}
