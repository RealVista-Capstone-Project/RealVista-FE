import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface SparkViewerProps {
  spzUrl: string;
  className?: string;
}

export function SparkViewer({ spzUrl, className = '' }: SparkViewerProps) {
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const htmlContent = `
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
      background: rgba(17, 24, 39, 0.8); color: #9CA3AF;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      z-index: 100;
    }
    #loading.hidden { display: none; }
    #loading-text { font-size: 14px; margin-top: 16px; }
    #error {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      display: none; flex-direction: column;
      justify-content: center; align-items: center;
      background: #111827; color: #EF4444;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      padding: 32px; text-align: center; z-index: 100;
    }
    #error.show { display: flex; }
    .spinner {
      width: 40px; height: 40px;
      border: 3px solid #1F2937; border-top-color: #3B82F6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div id="loading">
    <div class="spinner"></div>
    <div id="loading-text">Loading 3D Engine & Assets...</div>
  </div>
  <div id="error">
    <div style="font-size: 40px;">⚠️</div>
    <div id="error-msg">Failed to load 3D world</div>
  </div>

  <script type="importmap">
    {
      "imports": {
        "three": "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.178.0/three.module.js",
        "@sparkjsdev/spark": "https://sparkjs.dev/releases/spark/0.1.10/spark.module.js"
      }
    }
  </script>
  <script type="module">
    import * as THREE from "three";
    import { SplatMesh } from "@sparkjsdev/spark";

    const loadingEl = document.getElementById("loading");
    const errorEl = document.getElementById("error");

    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 1000);
      camera.position.set(0, 0, 2);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      document.body.appendChild(renderer.domElement);

      const spzUrl = "${spzUrl}";
      const splatMesh = new SplatMesh({ url: spzUrl });
      
      splatMesh.quaternion.set(1, 0, 0, 0);
      splatMesh.position.set(0, 0, 0);
      scene.add(splatMesh);

      // Simple mouse/touch orbit
      let isDragging = false;
      let prevX = 0, prevY = 0;
      let theta = 0, phi = Math.PI / 2;
      let radius = 2;

      function updateCamera() {
        camera.position.x = radius * Math.sin(phi) * Math.cos(theta);
        camera.position.y = radius * Math.cos(phi);
        camera.position.z = radius * Math.sin(phi) * Math.sin(theta);
        camera.lookAt(0, 0, 0);
      }

      renderer.domElement.addEventListener("mousedown", (e) => {
        isDragging = true; prevX = e.clientX; prevY = e.clientY;
      });
      renderer.domElement.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        theta -= (e.clientX - prevX) * 0.005;
        phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi - (e.clientY - prevY) * 0.005));
        prevX = e.clientX; prevY = e.clientY;
        updateCamera();
      });
      renderer.domElement.addEventListener("mouseup", () => { isDragging = false; });
      renderer.domElement.addEventListener("mouseleave", () => { isDragging = false; });
      
      renderer.domElement.addEventListener("wheel", (e) => {
        radius += e.deltaY * 0.01;
        radius = Math.max(0.5, Math.min(10, radius));
        updateCamera();
        e.preventDefault();
      }, { passive: false });

      // Touch
      let prevPinchDist = 0;
      renderer.domElement.addEventListener("touchstart", (e) => {
        if (e.touches.length === 1) {
          isDragging = true; prevX = e.touches[0].clientX; prevY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
          prevPinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        }
      }, { passive: false });
      
      renderer.domElement.addEventListener("touchmove", (e) => {
        e.preventDefault();
        if (e.touches.length === 1 && isDragging) {
          theta -= (e.touches[0].clientX - prevX) * 0.005;
          phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi - (e.touches[0].clientY - prevY) * 0.005));
          prevX = e.touches[0].clientX; prevY = e.touches[0].clientY;
          updateCamera();
        } else if (e.touches.length === 2) {
          const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
          if (prevPinchDist > 0) {
            radius *= prevPinchDist / dist;
            radius = Math.max(0.5, Math.min(10, radius));
            updateCamera();
          }
          prevPinchDist = dist;
        }
      }, { passive: false });
      
      renderer.domElement.addEventListener("touchend", () => { isDragging = false; prevPinchDist = 0; });

      window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });

      // Hide loading overlay safely after a bit, as SplatMesh handles its own worker loading
      setTimeout(() => loadingEl.classList.add("hidden"), 3000);

      updateCamera();
      renderer.setAnimationLoop(() => renderer.render(scene, camera));

      // Notify parent it's loaded
      window.parent.postMessage({ type: 'SPARK_LOADED' }, '*');
    } catch (err) {
      loadingEl.classList.add("hidden");
      errorEl.classList.add("show");
      document.getElementById("error-msg").textContent = err.message;
    }
  </script>
</body>
</html>
  `;

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'SPARK_LOADED') {
        setLoading(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className={`relative w-full h-full bg-slate-900 rounded-xl overflow-hidden ${className}`}>
      {loading && (
        <div className='absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900 text-white'>
          <Loader2 className='w-8 h-8 animate-spin text-blue-500 mb-4' />
          <p className='text-sm font-medium text-slate-300'>Initializing 3D Viewer...</p>
        </div>
      )}
      <iframe
        ref={iframeRef}
        srcDoc={htmlContent}
        className='w-full h-full border-0 outline-none'
        sandbox='allow-scripts allow-same-origin allow-popups'
        title='3D Spark Viewer'
      />
    </div>
  );
}
