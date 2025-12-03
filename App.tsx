import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { ParticleVisualizer } from './components/ParticleVisualizer';
import { Controls } from './components/Controls';
import { ParticleTemplate } from './types';
import { GeminiLiveService } from './services/geminiLive';

// How often to send frames to Gemini (ms)
const FRAME_INTERVAL = 300; // ~3.3 fps is enough for tension detection without killing rate limits/latency

export default function App() {
  const [template, setTemplate] = useState<ParticleTemplate>(ParticleTemplate.SPHERE);
  const [color, setColor] = useState<string>('#3b82f6');
  const [tension, setTension] = useState<number>(0.5);
  const [isConnected, setIsConnected] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const geminiRef = useRef<GeminiLiveService | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Initialize Gemini Service
  useEffect(() => {
    geminiRef.current = new GeminiLiveService((newTension) => {
      // Smoothly update tension? React state updates might be enough
      setTension(prev => {
         // Simple Low-pass filter if needed, but the model output is usually discrete
         // Let's trust the model but clamp it
         const t = Math.max(0, Math.min(1, newTension));
         return t;
      });
    });

    return () => {
      geminiRef.current?.disconnect();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      await geminiRef.current?.connect();
      setIsConnected(true);
      
      // Start processing loop
      intervalRef.current = window.setInterval(processFrame, FRAME_INTERVAL);
      
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please allow permissions.");
      setIsConnected(false);
    }
  };

  const stopCamera = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    geminiRef.current?.disconnect();
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsConnected(false);
  };

  const toggleConnection = () => {
    if (isConnected) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const processFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !geminiRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || video.readyState !== 4) return;
    
    // Draw video to canvas (scaled down for performance)
    const w = 320;
    const h = 240;
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(video, 0, 0, w, h);
    
    // Get Base64
    const base64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
    await geminiRef.current.sendFrame(base64);
  };

  return (
    <div className="w-full h-screen bg-black relative selection:bg-none">
      
      {/* Hidden elements for processing */}
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="hidden" />

      {/* 3D Scene */}
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }} dpr={[1, 2]}>
        <color attach="background" args={['#050505']} />
        
        {/* Lights */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color={color} />
        
        {/* Particle System */}
        <ParticleVisualizer 
          template={template} 
          tension={tension} 
          color={color} 
        />
        
        <ContactShadows resolution={1024} scale={20} blur={2} opacity={0.5} far={10} color="#000000" />
        <Environment preset="city" />
        <OrbitControls 
          enablePan={false} 
          minDistance={4} 
          maxDistance={15} 
          autoRotate={!isConnected} 
          autoRotateSpeed={0.5} 
        />
      </Canvas>

      {/* UI Overlay */}
      <Controls 
        currentTemplate={template}
        setTemplate={setTemplate}
        currentColor={color}
        setColor={setColor}
        isConnected={isConnected}
        tension={tension}
        toggleConnection={toggleConnection}
      />
    </div>
  );
}
