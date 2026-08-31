import { useState } from 'react';
import { Share2, Check, Copy, FileCode, FileSpreadsheet, X, Database } from 'lucide-react';
import { CityNode } from '../../types/graph.ts';
import { encodeRouteToURL, exportToGeoJSON, exportToCSV, downloadFile } from '../../utils/exportTools.ts';
import { TSPLIB_BENCHMARKS } from '../../core/benchmarks.ts';

interface ExportModalProps {
  nodes: CityNode[];
  route: number[];
  totalDistance: number;
  onClose: () => void;
  onLoadBenchmark: (benchmarkNodes: CityNode[]) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  nodes,
  route,
  totalDistance,
  onClose,
  onLoadBenchmark,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleShareURL = () => {
    const url = encodeRouteToURL(nodes);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadGeoJSON = () => {
    const json = exportToGeoJSON(nodes, route);
    downloadFile(json, 'route_intel_network.geojson', 'application/json');
  };

  const handleDownloadCSV = () => {
    const csv = exportToCSV(nodes, route, totalDistance);
    downloadFile(csv, 'route_intel_itinerary.csv', 'text/csv');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none animate-in fade-in duration-200">
      <div className="bg-panel border border-border max-w-md w-full rounded-xl p-6 relative flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
          <div className="flex items-center gap-2">
            <Share2 size={16} className="text-neon-cyan" />
            <h3 className="font-display font-bold text-sm text-slate-100 uppercase tracking-wider">
              Export & Benchmark Studio
            </h3>
          </div>
          <button onClick={onClose} className="text-muted hover:text-slate-200 p-1">
            <X size={16} />
          </button>
        </div>

        {/* Share Link */}
        <div className="mb-5">
          <label className="text-[10px] uppercase font-bold text-muted tracking-wider block mb-2">
            Shareable URL State
          </label>
          <div className="flex items-center gap-2 bg-surface border border-border p-1.5 rounded">
            <input
              type="text"
              readOnly
              value={encodeRouteToURL(nodes)}
              className="bg-transparent text-xs text-muted truncate flex-1 outline-none font-mono"
            />
            <button
              onClick={handleShareURL}
              className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded transition-all ${
                copied ? 'bg-neon-green text-black' : 'bg-neon-cyan text-black hover:bg-neon-cyan/90'
              }`}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Download File Formats */}
        <div className="mb-5">
          <label className="text-[10px] uppercase font-bold text-muted tracking-wider block mb-2">
            Download Data
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownloadGeoJSON}
              className="flex items-center justify-center gap-2 p-2.5 bg-surface border border-border text-xs text-slate-200 hover:border-neon-cyan hover:text-neon-cyan rounded transition-colors"
            >
              <FileCode size={14} className="text-neon-cyan" />
              <span>GeoJSON File</span>
            </button>

            <button
              onClick={handleDownloadCSV}
              className="flex items-center justify-center gap-2 p-2.5 bg-surface border border-border text-xs text-slate-200 hover:border-neon-green hover:text-neon-green rounded transition-colors"
            >
              <FileSpreadsheet size={14} className="text-neon-green" />
              <span>CSV Spreadsheet</span>
            </button>
          </div>
        </div>

        {/* TSPLIB Standard Benchmarks */}
        <div>
          <label className="text-[10px] uppercase font-bold text-muted tracking-wider block mb-2 flex items-center gap-1">
            <Database size={11} className="text-neon-amber" />
            <span>Load TSPLIB Benchmarks</span>
          </label>
          <div className="space-y-1.5">
            {Object.entries(TSPLIB_BENCHMARKS).map(([key, bm]) => (
              <button
                key={key}
                onClick={() => {
                  onLoadBenchmark(bm.nodes);
                  onClose();
                }}
                className="w-full text-left p-2 bg-surface border border-border hover:border-neon-amber text-xs rounded flex justify-between items-center transition-colors"
              >
                <div>
                  <div className="font-bold text-slate-200">{bm.name}</div>
                  <div className="text-[10px] text-muted">{bm.description}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-neon-green font-mono font-bold">
                    Opt: {bm.optimalDistance}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
