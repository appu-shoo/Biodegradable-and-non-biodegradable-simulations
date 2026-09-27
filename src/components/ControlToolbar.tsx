import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Layers,
  Shuffle,
  Camera,
} from 'lucide-react';
import { CameraPreset, SimulationPhase, WasteItemDef } from '../types/simulation';
import { WASTE_CATALOG } from '../data/wasteCatalog';

interface ControlToolbarProps {
  onDropItem: (item: WasteItemDef) => void;
  onDropRandom: () => void;
  isDemoRunning: boolean;
  onToggleDemo: () => void;
  onResetSystem: () => void;
  cameraPreset: CameraPreset;
  onSelectCameraPreset: (preset: CameraPreset) => void;
  explodedProgress: number;
  onToggleExplodedView: () => void;
  phase: SimulationPhase;
  bioFull: boolean;
  nonBioFull: boolean;
}

export const ControlToolbar: React.FC<ControlToolbarProps> = ({
  onDropItem,
  onDropRandom,
  isDemoRunning,
  onToggleDemo,
  onResetSystem,
  cameraPreset,
  onSelectCameraPreset,
  explodedProgress,
  onToggleExplodedView,
  phase,
  bioFull,
  nonBioFull,
}) => {
  const isBusy = phase !== 'idle' && phase !== 'complete' && !isDemoRunning;

  return (
    <div className="bg-slate-950/95 border border-slate-800 rounded-xl p-2.5 font-mono shadow-xl space-y-2 text-slate-200">
      {/* 1. Waste Item Injection Buttons Row */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 scrollbar-thin">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1 pr-1 border-r border-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> DROP:
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-1 overflow-x-auto py-0.5">
          {WASTE_CATALOG.map((item) => {
            const isBio = item.type === 'biodegradable';
            const isDisabled = isBusy || isDemoRunning || (isBio ? bioFull : nonBioFull);

            return (
              <button
                key={item.id}
                onClick={() => onDropItem(item)}
                disabled={isDisabled}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
                  isBio
                    ? 'bg-emerald-950/40 hover:bg-emerald-900/60 border-emerald-700/60 text-emerald-200 hover:border-emerald-500 active:scale-95'
                    : 'bg-orange-950/40 hover:bg-orange-900/60 border-orange-700/60 text-orange-200 hover:border-orange-500 active:scale-95'
                }`}
                title={`Drop ${item.name} (${isBio ? 'Biodegradable' : 'Non-Biodegradable'})`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                ></span>
                <span>{item.name}</span>
                <span
                  className={`text-[9px] px-1 rounded uppercase font-bold ${
                    isBio ? 'bg-emerald-900/80 text-emerald-300' : 'bg-orange-900/80 text-orange-300'
                  }`}
                >
                  {isBio ? 'BIO' : 'NON'}
                </span>
              </button>
            );
          })}

          <button
            onClick={onDropRandom}
            disabled={isBusy || isDemoRunning}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border bg-cyan-950/40 hover:bg-cyan-900/60 border-cyan-700/60 text-cyan-200 hover:border-cyan-400 active:scale-95 transition-all text-xs font-semibold whitespace-nowrap cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
            title="Drop random waste item"
          >
            <Shuffle className="w-3 h-3 text-cyan-400" />
            <span>Random</span>
          </button>
        </div>
      </div>

      {/* 2. Secondary Row: Camera Viewpoints & Actions */}
      <div className="flex flex-wrap items-center justify-between pt-1.5 border-t border-slate-800/80 gap-2 text-xs">
        {/* View Presets */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-500 flex items-center gap-1 mr-1">
            <Camera className="w-3 h-3 text-slate-400" /> VIEW:
          </span>
          {[
            { id: 'front', label: 'Front' },
            { id: 'top', label: 'Top' },
            { id: 'side', label: 'Side' },
            { id: 'internal', label: 'Internal' },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => onSelectCameraPreset(v.id as CameraPreset)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                cameraPreset === v.id && explodedProgress === 0
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              {v.label}
            </button>
          ))}

          {/* Exploded View */}
          <button
            onClick={onToggleExplodedView}
            className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
              explodedProgress > 0
                ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-400'
                : 'bg-slate-900 text-amber-300 hover:bg-slate-800 border border-amber-900/50'
            }`}
          >
            <Layers className="w-3 h-3" />
            {explodedProgress > 0 ? 'Collapse' : 'Exploded'}
          </button>
        </div>

        {/* Demo and Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleDemo}
            className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isDemoRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
            }`}
          >
            {isDemoRunning ? (
              <>
                <Pause className="w-3 h-3" /> Pause Demo
              </>
            ) : (
              <>
                <Play className="w-3 h-3" /> Auto Demo
              </>
            )}
          </button>

          <button
            onClick={onResetSystem}
            className="px-2 py-1 rounded text-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            title="Reset system counters & flap"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
      </div>
    </div>
  );
};
