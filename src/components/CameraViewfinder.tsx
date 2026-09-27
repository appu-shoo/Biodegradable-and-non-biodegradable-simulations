import React from 'react';
import { Camera, Crosshair, Eye, Scan, Sparkles } from 'lucide-react';
import { SimulationPhase, WasteItemDef } from '../types/simulation';

interface CameraViewfinderProps {
  phase: SimulationPhase;
  currentItem: WasteItemDef | null;
  cameraStatus: string;
}

export const CameraViewfinder: React.FC<CameraViewfinderProps> = ({
  phase,
  currentItem,
  cameraStatus,
}) => {
  const isScanning = phase === 'camera_capturing' || phase === 'ai_analyzing';
  const hasClassification =
    phase === 'ai_analyzing' ||
    phase === 'decision_logic' ||
    phase === 'servo_activating' ||
    phase === 'sorting_slide';

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden font-mono shadow-xl flex flex-col">
      {/* Top Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-200">ESP32-CAM (OV2640)</span>
          <span className="text-slate-500">· UXGA 1600×1200</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isScanning ? 'bg-red-500 animate-ping' : 'bg-emerald-400'
            }`}
          ></span>
          <span className="text-[11px] text-slate-400">{cameraStatus}</span>
        </div>
      </div>

      {/* Simulated Camera Sensor Viewport */}
      <div className="relative aspect-[4/3] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-800/80">
        {/* Subtle camera noise / lens grid */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/20 via-transparent to-black pointer-events-none"></div>

        {/* Crosshair & Rule of Thirds grid lines */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20">
          <div className="border-r border-b border-cyan-400"></div>
          <div className="border-r border-b border-cyan-400"></div>
          <div className="border-b border-cyan-400"></div>
          <div className="border-r border-b border-cyan-400"></div>
          <div className="border-r border-b border-cyan-400"></div>
          <div className="border-b border-cyan-400"></div>
          <div className="border-r border-cyan-400"></div>
          <div className="border-r border-cyan-400"></div>
          <div></div>
        </div>

        {/* Center reticle */}
        <Crosshair className="absolute w-8 h-8 text-cyan-400/40 pointer-events-none" />

        {/* Simulated Object in View */}
        {currentItem && phase !== 'idle' && phase !== 'complete' ? (
          <div className="relative flex flex-col items-center justify-center z-10">
            {/* Visual Item Representation */}
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-transform duration-300 ${
                isScanning ? 'scale-110 shadow-lg shadow-cyan-500/20' : 'scale-100'
              }`}
              style={{
                background: `radial-gradient(circle, ${currentItem.color}44 0%, transparent 70%)`,
                border: `2px dashed ${currentItem.color}`,
              }}
            >
              <span className="text-xs font-semibold text-white px-2 py-1 bg-black/60 rounded backdrop-blur">
                {currentItem.name}
              </span>
            </div>

            {/* AI Bounding Box */}
            {hasClassification && (
              <div
                className={`absolute -inset-4 border-2 rounded-lg transition-all duration-300 ${
                  currentItem.type === 'biodegradable'
                    ? 'border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                }`}
              >
                {/* Corner Accents */}
                <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-white"></div>
                <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-white"></div>
                <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-white"></div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-white"></div>

                {/* Bounding Box Label Overlay */}
                <div
                  className={`absolute -top-7 left-0 text-[11px] font-bold px-2 py-0.5 rounded text-white flex items-center gap-1.5 ${
                    currentItem.type === 'biodegradable' ? 'bg-emerald-600' : 'bg-orange-600'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{currentItem.type === 'biodegradable' ? 'BIODEGRADABLE' : 'NON-BIODEGRADABLE'}</span>
                  <span className="bg-black/40 px-1 rounded text-[10px]">
                    {currentItem.confidence.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}

            {/* Scanning Laser Line */}
            {isScanning && (
              <div className="absolute inset-x-0 h-0.5 bg-cyan-400 shadow-[0_0_8px_#38bdf8] animate-[bounce_1.5s_infinite]"></div>
            )}
          </div>
        ) : (
          <div className="text-center text-slate-500 z-10 flex flex-col items-center">
            <Scan className="w-10 h-10 text-slate-600 mb-2 animate-pulse" />
            <span className="text-xs uppercase tracking-wider">Awaiting Waste Deposit</span>
            <span className="text-[10px] text-slate-600 mt-0.5">IR Optical Gate Armed</span>
          </div>
        )}

        {/* Viewfinder Telemetry Data Overlays */}
        <div className="absolute bottom-2 left-2 text-[10px] text-slate-400 bg-black/60 px-2 py-1 rounded backdrop-blur border border-slate-800">
          <div>FPS: 29.8 · EXP: 1/120s · ISO: 200</div>
          <div>INFERENCE: {hasClassification ? '138ms (MobileNetV3)' : 'STANDBY'}</div>
        </div>

        <div className="absolute bottom-2 right-2 text-[10px] text-slate-400 bg-black/60 px-2 py-1 rounded backdrop-blur border border-slate-800 text-right">
          <div>CHAMBER ILLUM: 450 LUX</div>
          <div>MOISTURE: {currentItem ? `${currentItem.moisture} (${currentItem.moistureValue}%)` : '--'}</div>
        </div>
      </div>
    </div>
  );
};
