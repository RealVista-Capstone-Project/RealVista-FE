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
  ChevronUp,
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

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const iframeReady = useRef(false);

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

  // Send URL to iframe when it changes (after initial load)
  useEffect(() => {
    if (iframeReady.current && currentUrl) {
      sendCommand('SPARK_SET_URL', { url: currentUrl });
    }
  }, [currentUrl, sendCommand]);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      switch (e.data?.type) {
        case 'SPARK_LOADED':
          iframeReady.current = true;
          setLoading(false);
          break;
        case 'SPARK_LOADING_START':
          setLoading(true);
          break;
        case 'SPARK_LOADING_END':
          setLoading(false);
          break;
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Generate HTML once — URL changes handled via postMessage
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
    import { SplatMesh, SparkRenderer, PackedSplats } from "@sparkjsdev/spark";

    const loadingEl = document.getElementById("loading");

    const WALK_SPEED = 1.5;

    let scene, camera, renderer, controls, sparkRenderer;
    let currentMesh = null;
    let isRotating = false;
    let lastTime = performance.now();

    const keys = new Set();

    function init() {
      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 1000);
      camera.position.set(2, 1, 2);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      document.body.appendChild(renderer.domElement);

      sparkRenderer = new SparkRenderer({
        renderer,
        maxStdDev: Math.sqrt(4),
        view: { sort360: true, sort32: true },
      });
      scene.add(sparkRenderer);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.autoRotate = false;
      controls.autoRotateSpeed = 2.0;
      controls.enableKeys = false;

      window.addEventListener("resize", onWindowResize);
      window.addEventListener("message", onMessage);
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);

      // Load initial URL baked into the template
      const initialUrl = "${currentUrl}";
      if (initialUrl) {
        loadUrl(initialUrl);
      }

      window.parent.postMessage({ type: 'SPARK_LOADED' }, '*');

      animate();
    }

    function onKeyDown(e) {
      const key = e.key.toLowerCase();
      if (["w","a","s","d"].includes(key)) {
        keys.add(key);
      }
    }

    function onKeyUp(e) {
      keys.delete(e.key.toLowerCase());
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function onMessage(e) {
      const { type, enabled, url } = e.data;
      switch (type) {
        case 'SPARK_RESET_VIEW':
          controls.reset();
          camera.position.set(2, 1, 2);
          break;
        case 'SPARK_TOGGLE_ROTATE':
          isRotating = enabled;
          controls.autoRotate = enabled;
          if (enabled) {
            const dir = new THREE.Vector3();
            camera.getWorldDirection(dir);
            const dist = camera.position.distanceTo(controls.target);
            controls.target.copy(camera.position.clone().add(dir.multiplyScalar(dist)));
            controls.autoRotateSpeed = 2.0;
          }
          break;
        case 'SPARK_SET_URL':
          if (url) {
            window.parent.postMessage({ type: 'SPARK_LOADING_START' }, '*');
            loadUrl(url);
          }
          break;
      }
    }

    async function loadUrl(url) {
      try {
        const packedSplats = new PackedSplats({ url });
        await packedSplats.initialized;

        if (currentMesh) {
          scene.remove(currentMesh);
          if (currentMesh.packedSplats?.dispose) {
            currentMesh.packedSplats.dispose();
          }
        }

        const newMesh = new SplatMesh({ packedSplats });
        newMesh.quaternion.set(1, 0, 0, 0);
        newMesh.position.set(0, 0, 0);
        scene.add(newMesh);
        currentMesh = newMesh;

        loadingEl?.classList.add("hidden");
        window.parent.postMessage({ type: 'SPARK_LOADING_END' }, '*');
      } catch (err) {
        console.error("Failed to load splat:", err);
        loadingEl?.classList.add("hidden");
        window.parent.postMessage({ type: 'SPARK_LOADING_END' }, '*');
      }
    }

    function walk(dt) {
      if (keys.size === 0) return;

      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      const right = new THREE.Vector3();
      right.crossVectors(camera.up, forward).normalize();

      const dir = new THREE.Vector3();
      if (keys.has('w')) dir.add(forward);
      if (keys.has('s')) dir.sub(forward);
      if (keys.has('a')) dir.add(right);
      if (keys.has('d')) dir.sub(right);

      if (dir.length() > 0) {
        dir.normalize();
        const delta = dir.multiplyScalar(WALK_SPEED * dt);
        camera.position.add(delta);
        controls.target.add(delta);
      }
    }

    function animate() {
      requestAnimationFrame(animate);

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      walk(dt);
      controls.update();
      renderer.render(scene, camera);
    }

    init();
  </script>
</body>
</html>
  `,
    []
  );

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

      </div>

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
