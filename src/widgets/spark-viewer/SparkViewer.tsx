'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Loader2,
  RotateCcw,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  HelpCircle,
  ChevronUp,
  X,
} from 'lucide-react';
import { RealVistaButton } from '@/shared/ui/realvista-button';
import { cn } from '@/shared/lib/utils';
import { toast } from 'sonner';

interface SparkViewerProps {
  metadata?: Record<string, unknown> | string;
  spzUrl?: string; // Fallback for single URL
  className?: string;
}

type SplatQuality = '100k' | '500k' | 'full_res' | 'low' | 'medium' | 'full' | 'default';

export function SparkViewer({ metadata, spzUrl, className = '' }: SparkViewerProps) {
  const t = useTranslations('SparkViewer');
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Extract URLs from metadata with nuclear-level robustness
  const spzUrls = useMemo(() => {
    const urls: Record<string, string> = {};
    const seen = new Set();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extract = (obj: any) => {
      if (!obj) return;

      // If metadata is a string, try to parse it first
      if (typeof obj === 'string') {
        try {
          const parsed = JSON.parse(obj);
          extract(parsed);
        } catch {
          /* ignore */
        }
        return;
      }

      if (typeof obj !== 'object' || seen.has(obj)) return;
      seen.add(obj);

      // 1. Fast paths for known structures (Marble AI specific)
      // Check for marble_assets.splats.spz_urls
      if (obj.marble_assets?.splats?.spz_urls) {
        Object.assign(urls, obj.marble_assets.splats.spz_urls);
      }

      // Check for assets.splats.spz_urls
      if (obj.assets?.splats?.spz_urls) {
        Object.assign(urls, obj.assets.splats.spz_urls);
      }

      // 2. Direct check for common keys
      const possibleKeys = ['spz_urls', 'spzUrls', 'urls', 'spz_url_map'];
      for (const key of possibleKeys) {
        if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          Object.assign(urls, obj[key]);
        }
      }

      // 3. Recursive search for any object that might contain spz_urls
      Object.keys(obj).forEach((key) => {
        const val = obj[key];
        if (val && typeof val === 'object') {
          extract(val);
        } else if (
          typeof val === 'string' &&
          (key.toLowerCase().includes('metadata') || key.toLowerCase().includes('assets'))
        ) {
          try {
            const parsed = JSON.parse(val);
            extract(parsed);
          } catch {
            /* ignore */
          }
        }
      });
    };

    extract(metadata);
    return urls;
  }, [metadata]);

  // Available qualities
  const availableQualities = useMemo(() => {
    const qualities = Object.keys(spzUrls) as SplatQuality[];
    return qualities;
  }, [spzUrls]);

  // Default quality selection
  const initialQuality = useMemo(() => {
    // Priority order for quality
    if (spzUrls['100k']) return '100k';
    if (spzUrls['low']) return 'low' as SplatQuality;
    if (spzUrls['500k']) return '500k';
    if (spzUrls['medium']) return 'medium' as SplatQuality;
    if (spzUrls['full_res']) return 'full_res';
    if (spzUrls['full']) return 'full' as SplatQuality;

    if (availableQualities.length > 0) return availableQualities[0];
    return 'default';
  }, [spzUrls, availableQualities]);

  const [quality, setQuality] = useState<SplatQuality>(initialQuality);

  // Sync quality state when initialQuality changes (essential for dynamic metadata)
  useEffect(() => {
    setQuality(initialQuality);
  }, [initialQuality]);

  // Current URL
  const currentUrl = useMemo(() => {
    if (quality === 'default') return spzUrl || '';
    return spzUrls[quality] || spzUrl || '';
  }, [quality, spzUrls, spzUrl]);

  // Messaging functions
  const sendCommand = useCallback((type: string, payload?: Record<string, unknown>) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type, ...payload }, '*');
    }
  }, []);

  const handleResetView = () => {
    sendCommand('SPARK_RESET_VIEW');
    toast.success(t('cameraReset'));
  };

  const handleToggleRotate = () => {
    const nextState = !isRotating;
    setIsRotating(nextState);
    sendCommand('SPARK_TOGGLE_ROTATE', { enabled: nextState });
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        toast.error(t('fullscreenError', { error: err.message }));
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const htmlContent = useMemo(
    () => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: transparent; }
    canvas { display: block; width: 100%; height: 100%; touch-action: none; outline: none; }
    #loading {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      display: flex; flex-direction: column;
      justify-content: center; align-items: center;
      background: rgba(11, 15, 25, 0.9); color: #9CA3AF;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      z-index: 100; opacity: 1; transition: opacity 0.5s ease;
    }
    #loading.hidden { opacity: 0; pointer-events: none; }
    .spinner {
      width: 40px; height: 40px;
      border: 3px solid #1F2937; border-top-color: var(--primary, #7065f0);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div id="loading">
    <div class="spinner"></div>
  </div>

  <script type="importmap">
    {
      "imports": {
        "three": "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.178.0/three.module.js",
        "three/addons/": "https://unpkg.com/three@0.178.0/examples/jsm/",
        "@sparkjsdev/spark": "https://sparkjs.dev/releases/spark/0.1.10/spark.module.js"
      }
    }
  </script>
  <script type="module">
    import * as THREE from "three";
    import { OrbitControls } from "three/addons/controls/OrbitControls.js";
    import { SplatMesh } from "@sparkjsdev/spark";

    const loadingEl = document.getElementById("loading");

    let scene, camera, renderer, controls, splatMesh;
    let isRotating = ${isRotating};

    function init() {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 1000);
      camera.position.set(2, 1, 2);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      document.body.appendChild(renderer.domElement);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.autoRotate = isRotating;
      controls.autoRotateSpeed = 2.0;

      const spzUrl = "${currentUrl}";
      if (spzUrl) {
        splatMesh = new SplatMesh({ url: spzUrl });
        splatMesh.quaternion.set(1, 0, 0, 0);
        splatMesh.position.set(0, 0, 0);
        scene.add(splatMesh);
      }

      window.addEventListener("resize", onWindowResize);
      window.addEventListener("message", onMessage);

      // Notify parent
      window.parent.postMessage({ type: 'SPARK_LOADED' }, '*');
      
      // Auto-hide loading after some time
      setTimeout(() => loadingEl.classList.add("hidden"), 3000);

      animate();
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function onMessage(e) {
      const { type, enabled } = e.data;
      switch (type) {
        case 'SPARK_RESET_VIEW':
          controls.reset();
          camera.position.set(2, 1, 2);
          break;
        case 'SPARK_TOGGLE_ROTATE':
          controls.autoRotate = enabled;
          break;
      }
    }

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }

    init();
  </script>
</body>
</html>
  `,
    [currentUrl, isRotating]
  );

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'SPARK_LOADED') {
        setLoading(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // When quality changes, reset loading state
  useEffect(() => {
    setLoading(true);
  }, [quality]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full h-full rounded-xl overflow-hidden group/viewer',
        isFullscreen && 'rounded-none',
        className
      )}
    >
      {loading && (
        <div className='absolute inset-0 z-10 flex flex-col items-center justify-center  text-white'>
          <Loader2 className='w-8 h-8 animate-spin text-primary mb-4' />
          <p className='text-sm font-medium text-muted-foreground'>{t('loading')}</p>
        </div>
      )}

      {/* Control Bar Overlay */}
      <div
        className={cn(
          'absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 rounded-full',
          'bg-background/40 backdrop-blur-xl border border-white/10 shadow-2xl',
          'opacity-0 group-hover/viewer:opacity-100 transition-all duration-300 transform translate-y-2 group-hover/viewer:translate-y-0'
        )}
      >
        {/* Interaction Controls */}
        <div className='flex items-center gap-1 border-r border-white/10 pr-3'>
          <abbr title={t('resetView')}>
            <RealVistaButton
              size='small'
              onClick={handleResetView}
              className='!bg-transparent !border-transparent !p-2 hover:!bg-white/10 !rounded-full'
            >
              <RotateCcw className='size-4 text-white' />
            </RealVistaButton>
          </abbr>

          <abbr title={isRotating ? t('stopRotation') : t('autoRotate')}>
            <RealVistaButton
              size='small'
              onClick={handleToggleRotate}
              className={cn(
                '!bg-transparent !border-transparent !p-2 hover:!bg-white/10 !rounded-full transition-colors',
                isRotating && '!text-primary'
              )}
            >
              {isRotating ? (
                <Pause className='size-4 fill-current' />
              ) : (
                <Play className='size-4 fill-current' />
              )}
            </RealVistaButton>
          </abbr>

          <abbr title={isFullscreen ? t('exitFullscreen') : t('fullscreen')}>
            <RealVistaButton
              size='small'
              onClick={handleToggleFullscreen}
              className='!bg-transparent !border-transparent !p-2 hover:!bg-white/10 !rounded-full'
            >
              {isFullscreen ? (
                <Minimize2 className='size-4 text-white' />
              ) : (
                <Maximize2 className='size-4 text-white' />
              )}
            </RealVistaButton>
          </abbr>
        </div>

        {/* Quality Controls */}
        <div className='relative'>
          <RealVistaButton
            size='small'
            onClick={() => setShowQualityMenu(!showQualityMenu)}
            className='!bg-transparent !border-transparent py-1 px-3 hover:!bg-white/10 !rounded-full text-xs font-semibold text-white/90'
          >
            {t('resolution')}{availableQualities.length > 0 && ` (${availableQualities.length})`}
            <ChevronUp
              className={cn('size-3 ml-1.5 transition-transform', showQualityMenu && 'rotate-180')}
            />
          </RealVistaButton>

          {showQualityMenu && (
            <div className='absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-md rounded-xl border border-white/10 p-1.5 shadow-2xl min-w-[140px] animate-in fade-in slide-in-from-bottom-2'>
              {(availableQualities.length > 0 ? availableQualities : ['default']).map((q) => {
                return (
                  <button
                    key={q}
                    onClick={() => {
                      setQuality(q as SplatQuality);
                      setShowQualityMenu(false);
                    }}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors',
                      quality === q
                        ? 'bg-primary text-white'
                        : 'text-muted-foreground hover:bg-white/10 hover:text-white'
                    )}
                  >
                    {q.toLowerCase() === 'full_res' || q.toLowerCase() === 'full'
                      ? t('fullResolution')
                      : q.toLowerCase() === '500k'
                        ? t('medium')
                        : q.toLowerCase() === '100k'
                          ? t('low')
                          : q.charAt(0).toUpperCase() + q.slice(1)}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Help Button */}
        <div className='border-l border-white/10 pl-3'>
          <RealVistaButton
            size='small'
            onClick={() => setShowHelp(!showHelp)}
            className='!bg-transparent !border-transparent !p-2 hover:!bg-white/10 !rounded-full'
          >
            <HelpCircle className='size-4 text-white/60' />
          </RealVistaButton>
        </div>
      </div>

      {/* Navigation Help Overlay */}
      {showHelp && (
        <div className='absolute top-6 left-1/2 -translate-x-1/2 z-30 /80 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl max-w-sm animate-in zoom-in-95 max-h-[80vh] overflow-auto'>
          <div className='flex justify-between items-center mb-3'>
            <h4 className='text-white text-sm font-bold'>{t('debugTitle')}</h4>
            <button onClick={() => setShowHelp(false)} className='text-white/40 hover:text-white'>
              <X className='size-4' />
            </button>
          </div>
          <div className='space-y-4 text-[10px] text-muted-foreground font-mono'>
            <div className='p-2 bg-black/40 rounded border border-white/5'>
              <p className='text-primary mb-1'>{t('debugMetadata')}</p>
              <pre className='whitespace-pre-wrap break-all'>
                {JSON.stringify(metadata, null, 2) || 'undefined'}
              </pre>
            </div>
            <div className='p-2 bg-black/40 rounded border border-white/5'>
              <p className='text-primary mb-1'>{t('debugUrls')}</p>
              <pre className='whitespace-pre-wrap break-all'>
                {JSON.stringify(spzUrls, null, 2)}
              </pre>
            </div>
            <div className='p-2 bg-black/40 rounded border border-white/5'>
              <p className='text-primary mb-1'>{t('debugPropTypes')}</p>
              <p>metadata: {typeof metadata}</p>
              <p>spzUrl: {typeof spzUrl}</p>
            </div>
          </div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        srcDoc={htmlContent}
        className='w-full h-full border-0 outline-none ph-no-capture'
        sandbox='allow-scripts allow-same-origin allow-popups'
        title={t('iframeTitle')}
        data-ph-no-capture='true'
      />
    </div>
  );
}
