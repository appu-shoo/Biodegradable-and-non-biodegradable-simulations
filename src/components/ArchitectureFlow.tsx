import React from 'react';
import { ArrowRight, Eye, Cpu, Cog, Bell, Cloud, Radio, Activity } from 'lucide-react';
import { SimulationPhase } from '../types/simulation';

interface ArchitectureFlowProps {
  phase: SimulationPhase;
}

export const ArchitectureFlow: React.FC<ArchitectureFlowProps> = ({ phase }) => {
  // Determine which layers are currently active based on phase
  const isSensingActive =
    phase === 'ir_detecting' || phase === 'camera_capturing' || phase === 'ultrasonic_measuring';
  const isProcessingActive =
    phase === 'camera_capturing' || phase === 'ai_analyzing' || phase === 'decision_logic';
  const isActuationActive =
    phase === 'servo_activating' || phase === 'sorting_slide';
  const isOutputActive =
    phase !== 'idle';
  const isCloudActive =
    phase === 'ultrasonic_measuring' || phase === 'complete';

  const layers = [
    {
      id: 'sensing',
      name: 'Sensing Layer',
      icon: Eye,
      color: 'border-blue-500/60 bg-blue-950/20 text-blue-400',
      activeColor: 'border-blue-400 bg-blue-900/40 text-blue-300 ring-2 ring-blue-500/50',
      active: isSensingActive,
      devices: ['IR Optical Beam', 'OV2640 Camera', 'Moisture Probe', 'HC-SR04 Dual US'],
    },
    {
      id: 'processing',
      name: 'Processing Layer',
      icon: Cpu,
      color: 'border-indigo-500/60 bg-indigo-950/20 text-indigo-400',
      activeColor: 'border-indigo-400 bg-indigo-900/40 text-indigo-300 ring-2 ring-indigo-500/50',
      active: isProcessingActive,
      devices: ['ESP32-S3 Core', 'MobileNetV3 Edge CNN', 'Decision Threshold Matrix'],
    },
    {
      id: 'actuation',
      name: 'Actuation Layer',
      icon: Cog,
      color: 'border-amber-500/60 bg-amber-950/20 text-amber-400',
      activeColor: 'border-amber-400 bg-amber-900/40 text-amber-300 ring-2 ring-amber-500/50',
      active: isActuationActive,
      devices: ['PCA9685 12-Bit PWM', 'MG995 Servo Horn', 'Bilateral Sorting Flap'],
    },
    {
      id: 'output',
      name: 'Output & Alert Layer',
      icon: Bell,
      color: 'border-emerald-500/60 bg-emerald-950/20 text-emerald-400',
      activeColor: 'border-emerald-400 bg-emerald-900/40 text-emerald-300 ring-2 ring-emerald-500/50',
      active: isOutputActive,
      devices: ['Mounted OLED Display', 'Fill % Alarm LEDs', 'Piezo Auditory Chime'],
    },
    {
      id: 'cloud',
      name: 'Cloud & IoT Layer',
      icon: Cloud,
      color: 'border-cyan-500/60 bg-cyan-950/20 text-cyan-400',
      activeColor: 'border-cyan-400 bg-cyan-900/40 text-cyan-300 ring-2 ring-cyan-500/50',
      active: isCloudActive,
      devices: ['MQTT Telemetry Broker', 'GPS Fleet Locator', 'Fill Level Dispatch API'],
    },
  ];

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono shadow-xl">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200 tracking-wider uppercase">
            System Architecture Data Pipeline
          </span>
        </div>
        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>REAL-TIME HARDWARE BUS</span>
        </div>
      </div>

      {/* Layer Cards with Flow Arrows */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative items-stretch">
        {layers.map((layer, index) => {
          const Icon = layer.icon;
          return (
            <div key={layer.id} className="relative flex flex-col">
              <div
                className={`p-3 rounded-lg border transition-all duration-300 flex-1 flex flex-col justify-between ${
                  layer.active ? layer.activeColor : layer.color
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5" />
                      {layer.name}
                    </span>
                    {layer.active && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                    )}
                  </div>

                  <ul className="space-y-1 text-[10px] text-slate-300 mt-2">
                    {layer.devices.map((device, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <span className="text-slate-500">·</span>
                        <span className="truncate">{device}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-800/60 text-[9px] uppercase tracking-wider flex items-center justify-between">
                  <span className="text-slate-400">STATE:</span>
                  <span className={layer.active ? 'text-cyan-300 font-bold' : 'text-slate-500'}>
                    {layer.active ? 'PROCESSING' : 'READY'}
                  </span>
                </div>
              </div>

              {/* Animated arrow between layers on desktop */}
              {index < layers.length - 1 && (
                <div className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-500 pointer-events-none">
                  <ArrowRight
                    className={`w-3.5 h-3.5 transition-colors ${
                      layer.active ? 'text-cyan-400 animate-pulse' : 'text-slate-600'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
