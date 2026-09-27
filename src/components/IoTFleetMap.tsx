import React from 'react';
import { MapPin, Navigation, Signal, BatteryCharging, ShieldCheck, Radio } from 'lucide-react';

interface IoTFleetMapProps {
  bioFill: number;
  nonBioFill: number;
  status: string;
}

export const IoTFleetMap: React.FC<IoTFleetMapProps> = ({ bioFill, nonBioFill, status }) => {
  const isAlert = bioFill >= 90 || nonBioFill >= 90;

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono shadow-xl text-slate-200">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-100 uppercase tracking-wider">
            IoT Smart Fleet & GPS Telemetry
          </span>
        </div>
        <span className="text-[10px] bg-emerald-950 border border-emerald-800/60 text-emerald-400 px-2 py-0.5 rounded font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          GPS FIX 3D (9 SATS)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Map Vector Radar Visualization */}
        <div className="md:col-span-1 relative h-32 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex items-center justify-center">
          {/* Simulated Map Grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px] opacity-70"></div>

          {/* Compass Rings */}
          <div className="absolute w-24 h-24 rounded-full border border-slate-700/40 pointer-events-none"></div>
          <div className="absolute w-16 h-16 rounded-full border border-slate-700/30 pointer-events-none"></div>

          {/* Radar Sweep Line */}
          <div className="absolute inset-0 origin-center bg-gradient-to-tr from-cyan-500/10 to-transparent pointer-events-none animate-[spin_6s_linear_infinite]"></div>

          {/* Smart Bin Node Pin */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative">
              <span
                className={`w-3.5 h-3.5 rounded-full block border-2 border-white ${
                  isAlert ? 'bg-red-500 animate-ping' : 'bg-cyan-400 animate-pulse'
                }`}
              ></span>
              <span
                className={`absolute inset-0 w-3.5 h-3.5 rounded-full ${
                  isAlert ? 'bg-red-500' : 'bg-cyan-400'
                }`}
              ></span>
            </div>
            <span className="text-[10px] font-bold text-white bg-black/80 px-1.5 py-0.5 rounded mt-1 shadow border border-slate-700">
              BIN #EB-409
            </span>
          </div>

          <div className="absolute bottom-1 right-2 text-[9px] text-slate-500">
            CAMPUS SECTOR 4
          </div>
        </div>

        {/* GPS Coordinates & Node Info */}
        <div className="md:col-span-2 bg-slate-900/80 border border-slate-800 rounded-lg p-3 flex flex-col justify-between text-xs">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-500 block">Coordinates:</span>
              <span className="text-slate-200 font-bold">12.9716° N, 77.5946° E</span>
            </div>
            <div>
              <span className="text-slate-500 block">Elevation / Loc:</span>
              <span className="text-slate-200">920m · Innovation Quad</span>
            </div>
            <div>
              <span className="text-slate-500 block">Cellular / Wi-Fi:</span>
              <span className="text-slate-200 flex items-center gap-1">
                <Signal className="w-3 h-3 text-emerald-400" /> RSSI -58 dBm (4G/LTE)
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Battery / Solar:</span>
              <span className="text-slate-200 flex items-center gap-1">
                <BatteryCharging className="w-3 h-3 text-emerald-400" /> 12.8V · 94% (Charging)
              </span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Radio className="w-3 h-3 text-cyan-400" />
              <span>MQTT TOPIC: ecobin/eb409/telemetry</span>
            </div>
            <span className="text-slate-500">PING: 22ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};
