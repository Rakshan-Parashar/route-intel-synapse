import React from 'react';
import { AlertTriangle, Zap, BatteryCharging, ShieldAlert, Camera } from 'lucide-react';
import { ChaosIncident } from '../../types/vrp.ts';

interface ChaosEngineControlsProps {
  incidents: ChaosIncident[];
  onTriggerIncident: (type: 'traffic-jam' | 'rush-order' | 'storm-warning' | 'battery-warning') => void;
  cameraMode: 'isometric' | 'drone-fpv' | 'truck-cam';
  onCameraChange: (mode: 'isometric' | 'drone-fpv' | 'truck-cam') => void;
  droneBattery: number;
}

export const ChaosEngineControls: React.FC<ChaosEngineControlsProps> = ({
  incidents,
  onTriggerIncident,
  cameraMode,
  onCameraChange,
  droneBattery,
}) => {
  return (
    <div className="bg-panel border-t border-border p-4 select-none flex flex-wrap items-center justify-between gap-4">
      {/* Chaos Monkey Triggers */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted uppercase font-bold tracking-wider mr-1 flex items-center gap-1">
          <AlertTriangle size={13} className="text-neon-amber" />
          <span>Chaos Generator ({incidents.filter((i) => i.active).length} Active)</span>
        </span>

        <button
          onClick={() => onTriggerIncident('traffic-jam')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border text-neon-amber hover:border-neon-amber/60 rounded text-xs font-bold transition-colors"
        >
          <span>🚧 Traffic Jam Detour</span>
        </button>

        <button
          onClick={() => onTriggerIncident('rush-order')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border text-neon-pink hover:border-neon-pink/60 rounded text-xs font-bold transition-colors"
        >
          <Zap size={12} />
          <span>🚨 VIP Rush Order</span>
        </button>

        <button
          onClick={() => onTriggerIncident('storm-warning')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border text-neon-cyan hover:border-neon-cyan/60 rounded text-xs font-bold transition-colors"
        >
          <ShieldAlert size={12} />
          <span>⚡ Storm Warning</span>
        </button>
      </div>

      {/* Camera Mode Switcher */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted uppercase font-bold flex items-center gap-1">
          <Camera size={13} className="text-neon-cyan" />
          <span>Camera View</span>
        </span>
        <div className="flex bg-surface border border-border rounded p-0.5">
          {(['isometric', 'drone-fpv', 'truck-cam'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onCameraChange(mode)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded uppercase ${
                cameraMode === mode
                  ? 'bg-neon-cyan text-black'
                  : 'text-muted hover:text-slate-200'
              }`}
            >
              {mode === 'isometric' ? '3D God' : mode === 'drone-fpv' ? 'Drone FPV' : 'Truck Cam'}
            </button>
          ))}
        </div>

        {/* Drone Battery Gauge */}
        <div className="flex items-center gap-1.5 bg-surface border border-border px-3 py-1.5 rounded ml-2">
          <BatteryCharging size={14} className={droneBattery > 30 ? 'text-neon-green' : 'text-neon-pink animate-pulse'} />
          <span className="text-xs font-mono font-bold text-slate-200">{Math.round(droneBattery)}%</span>
        </div>
      </div>
    </div>
  );
};
