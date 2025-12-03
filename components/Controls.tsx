import React from 'react';
import { ParticleTemplate, ControlPanelProps } from '../types';
import { Camera, Palette, Hand, Globe, Heart, Flower, Zap, Activity } from 'lucide-react';

const COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#ffffff', // White
];

const TEMPLATES = [
  { id: ParticleTemplate.SPHERE, label: 'Sphere', icon: Globe },
  { id: ParticleTemplate.HEART, label: 'Heart', icon: Heart },
  { id: ParticleTemplate.FLOWER, label: 'Flower', icon: Flower },
  { id: ParticleTemplate.SATURN, label: 'Saturn', icon: Activity }, // Approx icon
  { id: ParticleTemplate.BUDDHA, label: 'Zen', icon: Hand },
  { id: ParticleTemplate.FIREWORKS, label: 'Fireworks', icon: Zap },
];

export const Controls: React.FC<ControlPanelProps> = ({
  currentTemplate,
  setTemplate,
  currentColor,
  setColor,
  isConnected,
  tension,
  toggleConnection
}) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between p-6">
      
      {/* Header / Status */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-white shadow-xl">
           <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-1">
             Gemini Kinetic Particles
           </h1>
           <div className="flex items-center space-x-2 text-xs text-gray-400">
             <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
             <span>{isConnected ? 'Gemini Live Active' : 'Offline'}</span>
           </div>
           
           {isConnected && (
             <div className="mt-4">
               <div className="flex justify-between text-xs mb-1">
                 <span>Tension</span>
                 <span>{(tension * 100).toFixed(0)}%</span>
               </div>
               <div className="w-48 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-gradient-to-r from-blue-500 to-red-500 transition-all duration-200"
                   style={{ width: `${tension * 100}%` }}
                 />
               </div>
               <p className="text-[10px] mt-1 text-gray-500">
                 {tension > 0.8 ? "Release hands to expand" : "Close hands to compress"}
               </p>
             </div>
           )}
        </div>

        <button
          onClick={toggleConnection}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all shadow-lg hover:scale-105 active:scale-95 ${
            isConnected 
              ? 'bg-red-500/80 hover:bg-red-600 text-white' 
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          <Camera size={20} />
          {isConnected ? 'Stop Camera' : 'Start Camera'}
        </button>
      </div>

      {/* Main Controls Bottom */}
      <div className="flex flex-col md:flex-row gap-4 pointer-events-auto items-end md:items-center justify-center">
        
        {/* Templates */}
        <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-2 border border-white/10 flex gap-2 overflow-x-auto max-w-full shadow-2xl">
          {TEMPLATES.map((t) => {
            const Icon = t.icon;
            const isActive = currentTemplate === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-white/20 text-white shadow-lg scale-105' 
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={24} className="mb-1" />
                <span className="text-[10px] uppercase font-bold tracking-wider">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Colors */}
        <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-4 border border-white/10 flex gap-3 shadow-2xl">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                  currentColor === c ? 'border-white scale-110 ring-2 ring-white/50' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Select color ${c}`}
              />
            ))}
        </div>

      </div>
    </div>
  );
};
