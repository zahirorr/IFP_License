import React, { useState } from 'react';
import { IsoCalculationResponse } from '../types';
import { BarChart3, Box } from 'lucide-react';

interface Props {
  data: IsoCalculationResponse;
}

type ViewMode = 'chart' | 'assembly';

const ToleranceVisualizer: React.FC<Props> = ({ data }) => {
  const { hole, shaft } = data; // fit is optional
  const [viewMode, setViewMode] = useState<ViewMode>('assembly');
  const [simPercent, setSimPercent] = useState<number>(50); // 0 = Tightest, 100 = Loosest

  // --- CHART VIEW LOGIC ---
  const deviations = [0];
  if (hole) deviations.push(hole.es, hole.ei);
  if (shaft) deviations.push(shaft.es, shaft.ei);
  
  const maxDev = Math.max(...deviations);
  const minDev = Math.min(...deviations);
  const range = maxDev - minDev;
  const padding = range === 0 ? 20 : range * 0.4;
  const yMax = maxDev + padding;
  const yMin = minDev - padding;
  const totalHeight = yMax - yMin;
  
  const chartHeight = 250;
  const mapY = (val: number) => {
    const percent = (val - yMin) / (totalHeight || 1);
    return chartHeight - (percent * chartHeight);
  };
  const zeroY = mapY(0);

  // --- ASSEMBLY VIEW LOGIC ---
  // If one component is missing, we simulate just that component's range or default to 0 for the other
  
  const holeDevRange = hole ? (hole.es - hole.ei) : 0;
  const currentHoleDev = hole 
    ? hole.ei + holeDevRange * (simPercent / 100)
    : 0;
  
  const shaftDevRange = shaft ? (shaft.es - shaft.ei) : 0;
  // Shaft logic: 0% = Largest Shaft (es) for tightest fit vs smallest hole
  // But for single shaft visualization, we might just want to show the range.
  // Let's stick to the fit logic: 0% = Tightest (Max Shaft), 100% = Loosest (Min Shaft)
  const currentShaftDev = shaft 
    ? shaft.es - shaftDevRange * (simPercent / 100)
    : 0;

  const currentGap = (hole ? currentHoleDev : 0) - (shaft ? currentShaftDev : 0);
  
  // Visualization Scale
  const absVals = [0];
  if (hole) absVals.push(Math.abs(hole.es), Math.abs(hole.ei));
  if (shaft) absVals.push(Math.abs(shaft.es), Math.abs(shaft.ei));
  // Add Fit extremes if both exist
  if (hole && shaft) {
     absVals.push(Math.abs(hole.es - shaft.ei));
     absVals.push(Math.abs(hole.ei - shaft.es));
  }
  
  const maxAbsDiff = Math.max(...absVals);
  const scaleFactor = maxAbsDiff === 0 ? 1 : (80 / maxAbsDiff); 

  const centerY = 150;
  const nominalRadius = 60; 
  
  const holeVisualRadius = nominalRadius + (currentHoleDev * scaleFactor);
  const shaftVisualRadius = nominalRadius + (currentShaftDev * scaleFactor);

  const isInterference = currentGap < 0;

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-colors duration-200">
      
      {/* Visualizer Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
          {viewMode === 'chart' ? <BarChart3 className="w-4 h-4" /> : <Box className="w-4 h-4" />}
          {viewMode === 'chart' ? 'Tolerance Zones' : 'Assembly Simulation'}
        </h3>
        <div className="flex bg-slate-200 dark:bg-slate-800 rounded-lg p-1 gap-1">
          <button
            onClick={() => setViewMode('assembly')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              viewMode === 'assembly' 
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Visual
          </button>
          <button
            onClick={() => setViewMode('chart')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              viewMode === 'chart' 
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Chart
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 flex-1 flex flex-col items-center justify-center min-h-[300px] relative">
        
        {viewMode === 'chart' ? (
          <div className="w-full h-full flex flex-col items-center">
             <svg width="100%" height={chartHeight} className="overflow-visible font-mono text-xs">
                {/* Zero Line */}
                <line x1={50} y1={zeroY} x2="100%" y2={zeroY} stroke="currentColor" strokeWidth="1" strokeDasharray="4,4" className="text-slate-400" />
                <text x={40} y={zeroY + 4} textAnchor="end" className="fill-slate-500 font-bold">0</text>
                
                {/* Bars Container */}
                <g transform="translate(60, 0)">
                    {hole && (
                        <>
                            <rect 
                                x={40} 
                                y={mapY(hole.es)} 
                                width={80} 
                                height={Math.max(1, Math.abs(mapY(hole.es) - mapY(hole.ei)))} 
                                className="fill-blue-500/20 stroke-blue-500"
                                strokeWidth="2"
                            />
                            <text x={80} y={mapY(hole.es) - 8} textAnchor="middle" className="fill-blue-600 dark:fill-blue-400 font-bold">+{hole.es}</text>
                            <text x={80} y={mapY(hole.ei) + 16} textAnchor="middle" className="fill-blue-600 dark:fill-blue-400 font-bold">+{hole.ei}</text>
                        </>
                    )}
                    
                    {shaft && (
                        <>
                            <rect 
                                x={hole ? 160 : 40} // If only shaft, put it in first slot
                                y={mapY(shaft.es)} 
                                width={80} 
                                height={Math.max(1, Math.abs(mapY(shaft.es) - mapY(shaft.ei)))} 
                                className="fill-orange-500/20 stroke-orange-500"
                                strokeWidth="2"
                            />
                            <text x={hole ? 200 : 80} y={mapY(shaft.es) - 8} textAnchor="middle" className="fill-orange-600 dark:fill-orange-400 font-bold">{shaft.es > 0 ? '+' : ''}{shaft.es}</text>
                            <text x={hole ? 200 : 80} y={mapY(shaft.ei) + 16} textAnchor="middle" className="fill-orange-600 dark:fill-orange-400 font-bold">{shaft.ei > 0 ? '+' : ''}{shaft.ei}</text>
                        </>
                    )}
                </g>
             </svg>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            {/* Assembly SVG */}
            <div className="relative mb-6">
                <svg width="300" height="260" className="overflow-visible">
                    <defs>
                        <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                            <rect width="4" height="8" transform="translate(0,0)" className="fill-slate-200 dark:fill-slate-700" />
                        </pattern>
                        <linearGradient id="shaftGrad" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="0%" stopColor="rgb(251 146 60)" />
                             <stop offset="50%" stopColor="rgb(249 115 22)" />
                             <stop offset="100%" stopColor="rgb(194 65 12)" />
                        </linearGradient>
                    </defs>

                    {/* HOLE BLOCKS (Top and Bottom) - Only render if hole exists */}
                    {hole && (
                        <>
                            {/* Top Block */}
                            <path d={`M0,0 L300,0 L300,${centerY - holeVisualRadius} L0,${centerY - holeVisualRadius} Z`} className="fill-slate-100 dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-600" strokeWidth="1" />
                            <rect x="0" y="0" width="300" height={centerY - holeVisualRadius} fill="url(#hatch)" className="opacity-50" />
                            <line x1="0" y1={centerY - holeVisualRadius} x2="300" y2={centerY - holeVisualRadius} stroke="#3b82f6" strokeWidth="3" />
                            
                            {/* Bottom Block */}
                            <path d={`M0,260 L300,260 L300,${centerY + holeVisualRadius} L0,${centerY + holeVisualRadius} Z`} className="fill-slate-100 dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-600" strokeWidth="1" />
                            <rect x="0" y={centerY + holeVisualRadius} width="300" height={260 - (centerY + holeVisualRadius)} fill="url(#hatch)" className="opacity-50" />
                            <line x1="0" y1={centerY + holeVisualRadius} x2="300" y2={centerY + holeVisualRadius} stroke="#3b82f6" strokeWidth="3" />
                        </>
                    )}

                    {/* Nominal Lines (Red Dashed) */}
                    <line x1="0" y1={centerY - nominalRadius} x2="300" y2={centerY - nominalRadius} stroke="#ef4444" strokeWidth="1" strokeDasharray="4,2" opacity="0.8" />
                    <text x="5" y={centerY - nominalRadius - 4} className="fill-red-500 text-[10px] font-bold">Nominal</text>
                    <line x1="0" y1={centerY + nominalRadius} x2="300" y2={centerY + nominalRadius} stroke="#ef4444" strokeWidth="1" strokeDasharray="4,2" opacity="0.8" />

                    {/* SHAFT (Middle) - Only render if shaft exists */}
                    {shaft && (
                        <g>
                             {/* Main Shaft Body */}
                            <rect 
                                x="50" 
                                y={centerY - shaftVisualRadius} 
                                width="200" 
                                height={shaftVisualRadius * 2} 
                                rx="4"
                                fill="url(#shaftGrad)"
                                className="shadow-lg"
                            />
                            {/* Shaft Edges */}
                            <line x1="50" y1={centerY - shaftVisualRadius} x2="250" y2={centerY - shaftVisualRadius} stroke="#fff" strokeWidth="1" opacity="0.5" />
                            <line x1="50" y1={centerY + shaftVisualRadius} x2="250" y2={centerY + shaftVisualRadius} stroke="#000" strokeWidth="1" opacity="0.3" />

                            {/* Center Line */}
                            <line x1="0" y1={centerY} x2="300" y2={centerY} stroke="currentColor" strokeDasharray="10,5,2,5" className="text-slate-400 opacity-50" />
                        </g>
                    )}
                </svg>

                {/* Real-time Value Overlay - Only if fit exists (both hole and shaft) */}
                {hole && shaft && (
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 ${isInterference ? 'bg-red-500/90' : 'bg-green-500/90'} text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm z-10`}>
                        {isInterference ? 'Interference' : 'Clearance'}: {Math.abs(currentGap).toFixed(1)} µm
                    </div>
                )}
            </div>

            {/* Slider Control */}
            <div className="w-full max-w-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    <span>{shaft ? "Tightest / Max Material" : "Min Hole"}</span>
                    <span>{shaft ? "Loosest / Min Material" : "Max Hole"}</span>
                </div>
                <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={simPercent} 
                    onChange={(e) => setSimPercent(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2 font-mono">
                    <span className={simPercent === 0 ? "text-blue-500 font-bold" : ""}>
                        {hole && `Hole: ${hole.ei}`} {hole && shaft && '/'} {shaft && `Shaft: ${shaft.es}`}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <span className={simPercent === 100 ? "text-blue-500 font-bold" : ""}>
                         {hole && `Hole: ${hole.es}`} {hole && shaft && '/'} {shaft && `Shaft: ${shaft.ei}`}
                    </span>
                </div>
            </div>
            
          </div>
        )}

      </div>
      
      {/* Legend Footer */}
      <div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 px-6 py-3 flex gap-6 text-xs justify-center flex-wrap">
         {hole && (
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                <span className="text-slate-600 dark:text-slate-400">Hole ({hole.grade})</span>
            </div>
         )}
         {shaft && (
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
                <span className="text-slate-600 dark:text-slate-400">Shaft ({shaft.grade})</span>
             </div>
         )}
         {viewMode === 'assembly' && (
             <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 border-t border-dashed border-red-500"></div>
                <span className="text-slate-600 dark:text-slate-400">Nominal</span>
             </div>
         )}
      </div>
    </div>
  );
};

export default ToleranceVisualizer;