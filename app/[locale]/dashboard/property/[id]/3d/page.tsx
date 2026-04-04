'use client';

import React, { use, useState, useEffect } from 'react';
import { WorldGenerator } from '@/features/world-generation/ui/WorldGenerator';
import { SparkViewer } from '@/widgets/spark-viewer/SparkViewer';
import { usePropertyDetail, useProperty3dOperations } from '@/entities/property';
import { ArrowLeft, RefreshCw, Layers } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Property3DPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default function Property3DPage({ params }: Property3DPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const propertyId = resolvedParams.id;
  const locale = resolvedParams.locale;

  // We fetch existing 3D operations for this property to see if there's a successful one
  // or a pending one managed by another device
  const {
    data: operations,
    isLoading,
    refetch: refetchOperations,
  } = useProperty3dOperations(propertyId);

  // To check if there's actual media created, we can call the property detail endpoint
  const { data: propertyDetail, refetch: refetchDetail } = usePropertyDetail(propertyId);

  const activeThreeDMedia = propertyDetail?.media?.find((m) => m.media_type === 'THREE_D');
  const activeMediaUrl = activeThreeDMedia?.media_url;
  const pendingOperation = operations?.find(
    (op: any) => op.status === 'PENDING' || op.status === 'GENERATING'
  );
  const isGenerating = !!pendingOperation;

  const [viewMode, setViewMode] = useState<'VIEWER' | 'GENERATOR'>(
    activeMediaUrl ? 'VIEWER' : 'GENERATOR'
  );

  useEffect(() => {
    if (activeMediaUrl && viewMode === 'GENERATOR' && !isGenerating) {
      setViewMode('VIEWER');
    }
  }, [activeMediaUrl, isGenerating]);

  return (
    <div className='w-full h-[calc(100vh-80px)] flex flex-col bg-slate-50'>
      {/* Header */}
      <div className='flex-none bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <button
            onClick={() => router.push(`/${locale}/dashboard/property/${propertyId}/edit`)}
            className='p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600'
          >
            <ArrowLeft className='w-5 h-5' />
          </button>
          <div className='w-px h-6 bg-slate-200'></div>
          <div>
            <h1 className='text-xl font-bold tracking-tight text-slate-900'>3D Visualization</h1>
            <p className='text-sm text-slate-500 font-medium tracking-wide'>ID: {propertyId}</p>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          {activeMediaUrl && viewMode === 'GENERATOR' && (
            <button
              onClick={() => setViewMode('VIEWER')}
              className='px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium rounded-lg transition-colors flex items-center gap-2'
            >
              <Layers className='w-4 h-4' /> View Current Model
            </button>
          )}
          {activeMediaUrl && viewMode === 'VIEWER' && (
            <button
              onClick={() => setViewMode('GENERATOR')}
              className='px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium rounded-lg transition-colors flex items-center gap-2'
            >
              <RefreshCw className='w-4 h-4' /> Generate New Model
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className='flex-1 overflow-auto'>
        {isLoading ? (
          <div className='w-full h-full flex flex-col items-center justify-center text-slate-400'>
            <RefreshCw className='w-8 h-8 animate-spin mb-4' />
            <p>Scanning property status...</p>
          </div>
        ) : viewMode === 'VIEWER' && activeMediaUrl ? (
          <div className='w-full h-full p-4 md:p-6 bg-slate-900'>
            <SparkViewer
              spzUrl={activeMediaUrl}
              metadata={activeThreeDMedia?.metadata}
              className='w-full h-full shadow-2xl rounded-2xl border border-slate-800'
            />
          </div>
        ) : (
          <div className='max-w-5xl mx-auto py-10 px-4 md:px-8'>
            <div className='mb-10'>
              <h2 className='text-3xl font-extrabold text-slate-900 tracking-tight mb-2'>
                Create 3D World
              </h2>
              <p className='text-slate-600'>
                Transform standard property photos into an immersive, navigable 3D environment.
              </p>
            </div>

            <WorldGenerator
              propertyId={propertyId}
              pendingOperationId={(pendingOperation as Record<string, string>)?.operation_id}
              onComplete={() => {
                refetchOperations();
                refetchDetail();
                setViewMode('VIEWER');
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
