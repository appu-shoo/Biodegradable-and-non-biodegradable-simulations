import React from 'react';
import { Cpu, Wifi, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { SimulationPhase } from '../types/simulation';

interface DigitalDisplayPanelProps {
  displayText: string;
  phase: SimulationPhase;
  bioFillPercent: number;
  nonBioFillPercent: number;
  moistureLevel: 'HIGH' | 'LOW' | 'DRY';
  moistureVal: number;
  activeItemName?: string;
  confidence?: number;
}

export const DigitalDisplayPanel: React.FC<DigitalDisplayPanelProps> = ({
  displayText,
  phase,
  bioFillPercent,
  nonBioFillPercent,
  moistureLevel,
  moistureVal,
  activeItemName,
  confidence,
}) => {
  const getBioStatus = (p: number) => {
    if (p >= 100) return { label: 'BIN FULL', color: 'text-red-400', bg: 'bg-red-500' };
    if (p >= 90) return { label: 'CAPACITY ALERT', color: 'text-rose-400', bg: 'bg-rose-500' };
    if (p >= 70) return { label: 'HIGH', color: 'text-amber-400', bg: 'bg-amber-500' };
    return { label: 'NORMAL', color: 'text-emerald-400', bg: 'bg-emerald-500' };
  };

  const getNonBioStatus = (p: number) => {
    if (p >= 100) return { label: 'BIN FULL', color: 'text-red-400', bg: 'bg-red-500' };
    if (p >= 90) return { label: 'CAPACITY ALERT', color: 'text-rose-400', bg: 'bg-rose-500' };
    if (p >= 70) return { label: 'HIGH', color: 'text-amber-400', bg: 'bg-amber-500' };
    return { label: 'NORMAL', color: 'text-orange-400', bg: 'bg-orange-500' };
  };

  const bioStat = getBioStatus(bioFillPercent);
  const nonBioStat = getNonBioStatus(nonBioFillPercent);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-xl text-slate-100 font-mono">
      {/* LCD Header Bezel */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></div>
          <span className="text-xs tracking-wider text-cyan-400 font-semibold uppercase">
            ECOCHAINAI OLED MATRIX VIRTUAL TERMINAL
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Wifi className="w-3 h-3 text-emerald-400" /> ONLINE
          </span>
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-cyan-400" /> ESP32-S3
          </span>
        </div>
      </div>

      {/* Main Dynamic Message Screen */}
      <div className="bg-slate-900/90 border border-cyan-950/60 rounded-lg p-3.5 relative overflow-hidden">
        {/* Subtle Scanlines effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent pointer-events-none opacity-40"></div>

        <div className="flex flex-col items-center justify-center text-center py-2">
          <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1">
            SYSTEM DISPATCH STATUS
          </div>
          <div className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            {displayText}
          </div>

          {activeItemName && confidence && (
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-300 bg-slate-800/80 px-3 py-1 rounded border border-slate-700">
              <span className="text-cyan-400">{activeItemName}</span>
              <span>·</span>
              <span className="text-emerald-400">Confidence: {confidence}%</span>
              <span>·</span>
              <span className={moistureLevel === 'HIGH' ? 'text-amber-400' : 'text-blue-400'}>
                Moisture: {moistureLevel} ({moistureVal}%)
              </span>
            </div>
          )}
        </div>

        {/* Dual Compartment Fill Meters */}
        <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-800/80">
          {/* Bio Meter */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-emerald-400 font-medium">BIODEGRADABLE</span>
              <span className={`text-[11px] font-bold ${bioStat.color}`}>
                {Math.round(bioFillPercent)}% · {bioStat.label}
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-800 rounded overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${bioStat.bg}`}
                style={{ width: `${Math.min(bioFillPercent, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Non-Bio Meter */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-orange-400 font-medium">NON-BIODEGRADABLE</span>
              <span className={`text-[11px] font-bold ${nonBioStat.color}`}>
                {Math.round(nonBioFillPercent)}% · {nonBioStat.label}
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-800 rounded overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${nonBioStat.bg}`}
                style={{ width: `${Math.min(nonBioFillPercent, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
