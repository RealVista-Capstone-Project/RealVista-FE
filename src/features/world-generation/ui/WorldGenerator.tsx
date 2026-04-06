import React, { useState, useRef } from 'react'
import { Upload, X, Box, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react'
import { useGenerate3d, AzimuthImage } from '../model/use-generate-3d'
import { MarbleModel } from '@/shared/api/marble-client'

const REQUIRED_IMAGES_COUNT = 8
const REQUIRED_AZIMUTHS = [0, 45, 90, 135, 180, 225, 270, 315]

export function WorldGenerator({
  propertyId,
  onComplete,
  pendingOperationId,
  roomName,
}: {
  propertyId: string;
  onComplete?: () => void;
  pendingOperationId?: string;
  roomName?: string;
}) {
  const { phase, progressDescription, error, uploadedCount, generate, cancel, reset, resumeOperation } = useGenerate3d(propertyId)
  const [images, setImages] = useState<AzimuthImage[]>([])
  const [selectedModel, setSelectedModel] = useState<MarbleModel>('Marble 0.1-mini')
  const fileInputRef = useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (pendingOperationId && phase === 'idle') {
      resumeOperation(pendingOperationId);
    }
  }, [pendingOperationId, phase, resumeOperation]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const newImages: AzimuthImage[] = []
    const availableSlots = REQUIRED_IMAGES_COUNT - images.length

    Array.from(files).slice(0, availableSlots).forEach((file) => {
      const usedAzimuths = new Set(images.map((img) => img.azimuth).concat(newImages.map((img) => img.azimuth)))
      const nextAzimuth = REQUIRED_AZIMUTHS.find((azi) => !usedAzimuths.has(azi)) || 0

      newImages.push({
        file,
        previewUrl: URL.createObjectURL(file),
        azimuth: nextAzimuth,
      })
    })

    setImages((prev) => [...prev, ...newImages])
  }

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => {
      const removed = prev[indexToRemove]
      URL.revokeObjectURL(removed.previewUrl)
      return prev.filter((_, i) => i !== indexToRemove)
    })
  }

  const handleGenerate = () => {
    if (images.length === REQUIRED_IMAGES_COUNT) {
      generate(images, selectedModel, `Web Gen - Prop ${propertyId}`, roomName)
    }
  }

  const renderUploadMode = () => (
    <div className='flex flex-col gap-6'>
      <div className='bg-slate-50 border border-slate-200 rounded-xl p-6'>
        <h3 className='text-lg font-semibold text-slate-900 mb-2'>Photogrammetry Upload</h3>
        <p className='text-sm text-slate-500 mb-6'>
          Upload exactly {REQUIRED_IMAGES_COUNT} images around the center of your property space. We require 8 specific angles for 360&deg; coverage.
        </p>

        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
          {REQUIRED_AZIMUTHS.map((azimuth) => {
            const capturedImg = images.find((img) => img.azimuth === azimuth)
            return (
              <div key={azimuth} className='relative aspect-square rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center bg-white overflow-hidden'>
                {capturedImg ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={capturedImg.previewUrl} alt={`Angle ${azimuth}`} className='absolute inset-0 w-full h-full object-cover' />
                    <button
                      onClick={() => {
                        const idx = images.findIndex((img) => img.azimuth === azimuth)
                        if (idx !== -1) removeImage(idx)
                      }}
                      className='absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 rounded-md text-white transition-colors'
                    >
                      <X className='w-4 h-4' />
                    </button>
                    <div className='absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs font-bold rounded'>
                      {azimuth}&deg;
                    </div>
                  </>
                ) : (
                  <div className='text-center p-3 text-slate-400'>
                    <span className='block text-xl font-bold mb-1'>{azimuth}&deg;</span>
                    <span className='text-xs font-medium'>Angle</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <input
          type='file'
          multiple
          accept='image/*'
          ref={fileInputRef}
          className='hidden'
          onChange={(e) => handleFiles(e.target.files)}
        />

        {images.length < REQUIRED_IMAGES_COUNT && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className='w-full py-4 rounded-xl border-2 border-dashed border-blue-400 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold flex items-center justify-center gap-2 transition-colors'
          >
            <Upload className='w-5 h-5' />
            Select {REQUIRED_IMAGES_COUNT - images.length} More Images
          </button>
        )}
      </div>

      <div className='flex flex-col sm:flex-row items-center gap-4 border-t pt-6'>
        <div className='flex-1 w-full'>
          <label className='block text-sm font-medium text-slate-700 mb-1'>AI Model Generation Quality</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as MarbleModel)}
            className='w-full border-slate-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500'
          >
            <option value='Marble 0.1-mini'>Marble 0.1-mini (Fast, Draft Quality)</option>
            <option value='Marble 0.1-pro'>Marble 0.1-pro (Slower, High Detail)</option>
          </select>
        </div>

        <button
          onClick={handleGenerate}
          disabled={images.length !== REQUIRED_IMAGES_COUNT}
          className='w-full sm:w-auto px-8 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-slate-900 transition-colors mt-6 sm:mt-0'
        >
          Generate 3D World
        </button>
      </div>
    </div>
  )

  const renderActiveState = () => (
    <div className='flex flex-col items-center justify-center py-16 bg-slate-50 border border-slate-200 rounded-xl px-6'>
      {phase === 'succeeded' ? (
        <div className='text-center'>
          <CheckCircle2 className='w-16 h-16 text-green-500 mx-auto mb-4' />
          <h3 className='text-xl font-bold text-slate-900 mb-2'>Generation Complete</h3>
          <p className='text-sm text-slate-600 mb-6'>Your 3D model has been generated successfully.</p>
          <button onClick={onComplete} className='px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700'>
            View 3D Property
          </button>
        </div>
      ) : phase === 'failed' ? (
        <div className='text-center'>
          <AlertTriangle className='w-16 h-16 text-red-500 mx-auto mb-4' />
          <h3 className='text-xl font-bold text-slate-900 mb-2'>Generation Failed</h3>
          <p className='text-sm text-red-600 mb-6'>{error || 'An unknown error occurred during generation.'}</p>
          <button onClick={reset} className='px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 flex items-center justify-center gap-2 mx-auto'>
            <RotateCcw className='w-4 h-4' /> Try Again
          </button>
        </div>
      ) : (
        <div className='w-full max-w-md text-center'>
          <div className='relative w-24 h-24 mx-auto mb-8'>
            <div className='absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75'></div>
            <div className='relative w-full h-full bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl'>
              <Box className='w-10 h-10 animate-bounce' />
            </div>
          </div>

          <h3 className='text-lg font-bold text-slate-900 mb-2 capitalize'>{phase}...</h3>
          <p className='text-sm text-slate-600 font-medium mb-8 min-h-[2.5rem]'>{progressDescription}</p>

          {/* Progress Bar Component */}
          <div className='w-full bg-slate-200 rounded-full h-2.5 mb-2 overflow-hidden shadow-inner'>
            <div
              className='bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out'
              style={{
                width: phase === 'uploading'
                  ? `${(uploadedCount / REQUIRED_IMAGES_COUNT) * 100}%`
                  : phase === 'requesting' ? '10%'
                  : phase === 'polling' ? '50%' : '10%'
              }}
            ></div>
          </div>

          <div className='flex justify-between text-xs font-semibold text-slate-500 mb-8 uppercase tracking-wider'>
            <span className={phase === 'uploading' ? 'text-blue-600' : 'text-green-600'}>Upload</span>
            <span className={phase === 'requesting' ? 'text-blue-600' : phase === 'polling' ? 'text-green-600' : ''}>Initialize</span>
            <span className={phase === 'polling' ? 'text-blue-600 animate-pulse' : ''}>Processing</span>
          </div>

          <button onClick={cancel} className='text-sm text-slate-500 hover:text-slate-900 font-medium underline'>
            Cancel Operation
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className='w-full max-w-4xl mx-auto'>
      {phase === 'idle' ? renderUploadMode() : renderActiveState()}
    </div>
  )
}
