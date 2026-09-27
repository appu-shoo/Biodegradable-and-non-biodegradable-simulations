import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Scale, CheckCircle2, TrendingUp, Sparkles, Trash2 } from 'lucide-react';
import { WasteHistoryItem } from '../types/simulation';

interface AnalyticsDashboardProps {
  totalProcessed: number;
  bioCount: number;
  nonBioCount: number;
  bioWeightGrams: number;
  nonBioWeightGrams: number;
  history: WasteHistoryItem[];
  bioFillPercent: number;
  nonBioFillPercent: number;
  onEmptyBio: () => void;
  onEmptyNonBio: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  totalProcessed,
  bioCount,
  nonBioCount,
  bioWeightGrams,
  nonBioWeightGrams,
  history,
  bioFillPercent,
  nonBioFillPercent,
  onEmptyBio,
  onEmptyNonBio,
}) => {
  const pieData = [
    { name: 'Biodegradable', value: bioCount || (totalProcessed === 0 ? 1 : 0), color: '#10b981' },
    { name: 'Non-Biodegradable', value: nonBioCount || (totalProcessed === 0 ? 1 : 0), color: '#f97316' },
  ];

  // Group history items by recent events
  const barData = [
    { category: 'Organics', count: bioCount, fill: '#10b981' },
    { category: 'Recyclables', count: nonBioCount, fill: '#f97316' },
  ];

  const totalKg = ((bioWeightGrams + nonBioWeightGrams) / 1000).toFixed(2);
  const bioKg = (bioWeightGrams / 1000).toFixed(2);
  const nonBioKg = (nonBioWeightGrams / 1000).toFixed(2);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono shadow-xl text-slate-200">
      {/* Title Bar */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-100 uppercase tracking-wider">
            Waste Segregation Analytics & Yield
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEmptyBio}
            className="text-[10px] px-2 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
            title="Empty Biodegradable compartment to 0%"
          >
            <Trash2 className="w-3 h-3" /> Empty Bio
          </button>
          <button
            onClick={onEmptyNonBio}
            className="text-[10px] px-2 py-1 rounded bg-orange-950/80 hover:bg-orange-900 border border-orange-700/60 text-orange-300 transition-colors flex items-center gap-1 cursor-pointer"
            title="Empty Non-Biodegradable compartment to 0%"
          >
            <Trash2 className="w-3 h-3" /> Empty Non-Bio
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {/* Total Processed */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Total Processed</div>
          <div className="text-2xl font-bold text-white tabular-nums">{totalProcessed}</div>
          <div className="text-[10px] text-slate-500 mt-1">Gross Mass: {totalKg} kg</div>
        </div>

        {/* Biodegradable */}
        <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-lg p-3">
          <div className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1">Biodegradable</div>
          <div className="text-2xl font-bold text-emerald-300 tabular-nums">{bioCount}</div>
          <div className="text-[10px] text-emerald-500/80 mt-1">Mass: {bioKg} kg ({bioFillPercent.toFixed(0)}% fill)</div>
        </div>

        {/* Non-Biodegradable */}
        <div className="bg-orange-950/20 border border-orange-900/50 rounded-lg p-3">
          <div className="text-[10px] text-orange-400 uppercase tracking-wider mb-1">Non-Biodegradable</div>
          <div className="text-2xl font-bold text-orange-300 tabular-nums">{nonBioCount}</div>
          <div className="text-[10px] text-orange-500/80 mt-1">Mass: {nonBioKg} kg ({nonBioFillPercent.toFixed(0)}% fill)</div>
        </div>

        {/* Model Accuracy */}
        <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-3">
          <div className="text-[10px] text-cyan-400 uppercase tracking-wider mb-1">AI Sorting Accuracy</div>
          <div className="text-2xl font-bold text-cyan-300 tabular-nums">98.6%</div>
          <div className="text-[10px] text-cyan-500/80 mt-1">Validated Edge CNN</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stream Proportion Donut */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3 flex flex-col items-center">
          <div className="w-full text-left text-xs font-semibold text-slate-300 mb-2">
            Waste Stream Distribution
          </div>
          <div className="w-full h-36 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={55}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    fontSize: '11px',
                    borderRadius: '6px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs font-bold text-white tabular-nums">{totalProcessed}</span>
              <span className="text-[9px] text-slate-500 uppercase">Items</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Bio ({totalProcessed ? Math.round((bioCount / totalProcessed) * 100) : 0}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
              <span>Non-Bio ({totalProcessed ? Math.round((nonBioCount / totalProcessed) * 100) : 0}%)</span>
            </div>
          </div>
        </div>

        {/* Recent Items Stream List */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3 flex flex-col">
          <div className="text-xs font-semibold text-slate-300 mb-2 flex justify-between items-center">
            <span>Recent Segregation Pipeline</span>
            <span className="text-[10px] text-slate-500">{history.length} Entries</span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-36 space-y-1.5 pr-1 text-[11px]">
            {history.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs py-6">
                No items sorted yet. Drop a waste object to begin.
              </div>
            ) : (
              history.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-1.5 bg-slate-950/60 border border-slate-800/80 rounded"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        item.type === 'biodegradable' ? 'bg-emerald-400' : 'bg-orange-400'
                      }`}
                    ></span>
                    <span className="font-semibold text-slate-200">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span>{item.confidence.toFixed(0)}% conf</span>
                    <span>·</span>
                    <span>{item.weightGrams}g</span>
                    <span>·</span>
                    <span className="text-[10px] text-slate-500">{item.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
