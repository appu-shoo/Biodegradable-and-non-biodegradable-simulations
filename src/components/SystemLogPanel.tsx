import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Download, Trash2, Filter } from 'lucide-react';
import { LogEntry } from '../types/simulation';

interface SystemLogPanelProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

export const SystemLogPanel: React.FC<SystemLogPanelProps> = ({ logs, onClearLogs }) => {
  const [filterLayer, setFilterLayer] = useState<string>('ALL');
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new log
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const filteredLogs = logs.filter(
    (l) => filterLayer === 'ALL' || l.layer.toUpperCase() === filterLayer.toUpperCase()
  );

  const exportLogsAsJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ecochain_system_log_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'SUCCESS':
        return 'text-emerald-400';
      case 'WARNING':
        return 'text-amber-400';
      case 'ALERT':
        return 'text-red-400 font-bold';
      default:
        return 'text-cyan-400';
    }
  };

  const getLayerColor = (layer: string) => {
    switch (layer) {
      case 'Sensing':
        return 'text-blue-400';
      case 'Processing':
        return 'text-indigo-400';
      case 'Actuation':
        return 'text-amber-400';
      case 'Output':
        return 'text-emerald-400';
      case 'Cloud':
        return 'text-cyan-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono shadow-xl text-slate-200 flex flex-col h-80">
      {/* Header with filters and actions */}
      <div className="flex flex-wrap items-center justify-between pb-2 mb-2 border-b border-slate-800/80 gap-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-100 uppercase tracking-wider">
            Live Hardware & AI Event Stream
          </span>
          <span className="text-[10px] text-slate-500">({filteredLogs.length} events)</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Layer Filter buttons */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5 text-[10px]">
            {['ALL', 'SENSING', 'PROCESSING', 'ACTUATION', 'CLOUD'].map((layer) => (
              <button
                key={layer}
                onClick={() => setFilterLayer(layer)}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  filterLayer === layer
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {layer}
              </button>
            ))}
          </div>

          <button
            onClick={exportLogsAsJson}
            className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-slate-900 rounded border border-slate-800 transition-colors cursor-pointer"
            title="Export JSON Log"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClearLogs}
            className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded border border-slate-800 transition-colors cursor-pointer"
            title="Clear Logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal log container */}
      <div
        ref={logContainerRef}
        className="flex-1 overflow-y-auto space-y-1 text-xs pr-1 font-mono select-text bg-slate-950/80 p-2 rounded border border-slate-900"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-slate-600 text-center py-8">Log buffer empty.</div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-2 hover:bg-slate-900/60 py-0.5 px-1 rounded transition-colors text-[11px] leading-relaxed"
            >
              <span className="text-slate-500 tabular-nums shrink-0">{log.timestamp}</span>
              <span className={`font-semibold shrink-0 [${getLayerColor(log.layer)}]`}>
                [{log.layer.toUpperCase()}]
              </span>
              <span className={`font-bold shrink-0 ${getLevelColor(log.level)}`}>
                {log.level}
              </span>
              <span className="text-slate-300 flex-1">{log.message}</span>
              {log.metadata && (
                <span className="text-slate-500 text-[10px] shrink-0 font-sans italic">
                  {log.metadata}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
