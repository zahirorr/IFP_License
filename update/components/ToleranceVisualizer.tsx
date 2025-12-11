import React, { useState } from 'react';
import { IsoCalculationResponse, Language } from '../types';
import { BarChart3, Box, ChevronsLeftRight, AlertTriangle } from 'lucide-react';

interface Props {
  data: IsoCalculationResponse;
  forceViewMode?: 'chart' | 'assembly';
  hideControls?: boolean;
  language?: Language;
}

const VIS_TEXT = {
  en: {
    zones: "Tolerance Zones",
    assembly: "Assembly Simulation",
    analysis: "Combined Analysis",
    visual: "Visual",
    chart: "Chart",
    nominal: "Nominal",
    interference: "Interference",
    clearance: "Clearance",
    tightest_fit: "Tightest (Max Material)",
    loosest_fit: "Loosest (Min Material)",
    min_hole: "Min Hole (MMC)",
    max_hole: "Max Hole (LMC)",
    max_shaft: "Max Shaft (MMC)",
    min_shaft: "Min Shaft (LMC)",
    hole: "Hole",
    shaft: "Shaft",
    current: "Current",
    collision: "Collision Warning"
  },
  de: {
    zones: "Toleranzfelder",
    assembly: "Montage-Simulation",
    analysis: "Kombinierte Analyse",
    visual: "Visuell",
    chart: "Diagramm",
    nominal: "Nennmaß",
    interference: "Übermaß",
    clearance: "Spiel",
    tightest_fit: "Am festesten (Max Material)",
    loosest_fit: "Am lockersten (Min Material)",
    min_hole: "Min Bohrung",
    max_hole: "Max Bohrung",
    max_shaft: "Max Welle",
    min_shaft: "Min Welle",
    hole: "Bohrung",
    shaft: "Welle",
    current: "Aktuell",
    collision: "Kollisionswarnung"
  },
  fr: {
    zones: "Zones de tolérance",
    assembly: "Simulation d'assemblage",
    analysis: "Analyse combinée",
    visual: "Visuel",
    chart: "Graphique",
    nominal: "Nominale",
    interference: "Serrage",
    clearance: "Jeu",
    tightest_fit: "Le plus serré (Max matière)",
    loosest_fit: "Le plus lâche (Min matière)",
    min_hole: "Alésage min (MMC)",
    max_hole: "Alésage max (LMC)",
    max_shaft: "Arbre max (MMC)",
    min_shaft: "Arbre min (LMC)",
    hole: "Alésage",
    shaft: "Arbre",
    current: "Actuel",
    collision: "Attention Collision"
  },
  ar: {
    zones: "مناطق التفاوت",
    assembly: "محاكاة التجميع",
    analysis: "التحليل المشترك",
    visual: "مرئي",
    chart: "مخطط",
    nominal: "المقاس الاسمي",
    interference: "تداخل",
    clearance: "خلوص",
    tightest_fit: "الأكثر إحكاماً (أقصى مادة)",
    loosest_fit: "الأكثر اتساعاً (أقل مادة)",
    min_hole: "أقل ثقب",
    max_hole: "أقصى ثقب",
    max_shaft: "أقصى عمود",
    min_shaft: "أقل عمود",
    hole: "ثقب",
    shaft: "عمود",
    current: "الحالي",
    collision: "تحذير اصطدام"
  }
};

const ToleranceVisualizer: React.FC<Props> = ({ data, hideControls = false, language = 'en' }) => {
  const { hole, shaft } = data;
  const [simPercent, setSimPercent] = useState<number>(50); // 0 = Tightest, 100 = Loosest

  const t = VIS_TEXT[language];

  // --- VISUALIZATION CONSTANTS ---
  const svgSize = 340;
  const centerY = svgSize / 2;
  // CRITICAL: nominalRadius must be > visualDeviationRange to prevent negative radius (inversion)
  const nominalRadius = 100; 
  const visualDeviationRange = 60; // Max pixels the deviation can stretch
  
  // Shaft visual width
  const shaftRectWidth = 240;
  const shaftRectX = (svgSize - shaftRectWidth) / 2;

  // Chart dimensions
  const chartHeight = 340; // Matched with assembly SVG

  // --- CALCULATIONS ---

  // 1. Determine Chart Scaling
  const deviations = [0];
  if (hole) deviations.push(hole.es, hole.ei);
  if (shaft) deviations.push(shaft.es, shaft.ei);
  
  const maxDev = Math.max(...deviations);
  const minDev = Math.min(...deviations);
  const range = maxDev - minDev;
  const padding = range === 0 ? 20 : range * 0.3; // 30% padding
  const yMax = maxDev + padding;
  const yMin = minDev - padding;
  const totalHeight = yMax - yMin;
  
  const mapY = (val: number) => {
    const percent = (val - yMin) / (totalHeight || 1);
    return chartHeight - (percent * chartHeight);
  };
  const zeroY = mapY(0);

  // 2. Current Simulation Values
  // Hole logic: 0% slider = Smallest Hole (Tightest Fit), 100% slider = Largest Hole (Loosest Fit)
  const holeDevRange = hole ? (hole.es - hole.ei) : 0;
  const currentHoleDev = hole 
    ? hole.ei + holeDevRange * (simPercent / 100)
    : 0;
  
  // Shaft logic: 0% slider = Largest Shaft (Tightest Fit), 100% slider = Smallest Shaft (Loosest Fit)
  const shaftDevRange = shaft ? (shaft.es - shaft.ei) : 0;
  const currentShaftDev = shaft 
    ? shaft.es - shaftDevRange * (simPercent / 100)
    : 0;

  const currentGap = (hole ? currentHoleDev : 0) - (shaft ? currentShaftDev : 0);
  const isInterference = currentGap < 0;

  // 3. Assembly Visualization Scale
  const absVals = [0];
  if (hole) absVals.push(Math.abs(hole.es), Math.abs(hole.ei));
  if (shaft) absVals.push(Math.abs(shaft.es), Math.abs(shaft.ei));
  // Add Fit extremes to ensure everything fits in range
  if (hole && shaft) {
     absVals.push(Math.abs(hole.es - shaft.ei));
     absVals.push(Math.abs(hole.ei - shaft.es));
  }
  
  const maxAbsDiff = Math.max(...absVals);
  // Scale factor ensures the largest deviation fits exactly within visualDeviationRange
  const scaleFactor = maxAbsDiff === 0 ? 1 : (visualDeviationRange / maxAbsDiff); 

  const holeVisualRadius = nominalRadius + (currentHoleDev * scaleFactor);
  const shaftVisualRadius = nominalRadius + (currentShaftDev * scaleFactor);

  // 4. Slider Labels
  let leftLabel = "";
  let rightLabel = "";
  if (hole && shaft) {
      leftLabel = t.tightest_fit;
      rightLabel = t.loosest_fit;
  } else if (hole) {
      leftLabel = t.min_hole;
      rightLabel = t.max_hole;
  } else if (shaft) {
      leftLabel = t.max_shaft;
      rightLabel = t.min_shaft;
  }

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'} className={`w-full bg-white dark:bg-slate-900 rounded-xl ${hideControls ? '' : 'shadow-xl border border-slate-200 dark:border-slate-800'} overflow-hidden flex flex-col transition-colors duration-200`}>
      
      {/* Header */}
      {!hideControls && (
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <ChevronsLeftRight className="w-4 h-4" />
                {t.analysis}
            </h3>
        </div>
      )}

      {/* Main Split Content */}
      <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 rtl:md:divide-x-reverse">
        
        {/* LEFT: ASSEMBLY VIEW */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center relative bg-slate-50/30 dark:bg-slate-900/30">
             {hideControls && <h4 className="text-slate-500 uppercase text-xs font-bold mb-4">{t.assembly}</h4>}
             
             <div className="relative">
                <svg width={svgSize} height={svgSize} className="overflow-visible">
                    <defs>
                        <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                            <rect width="4" height="8" transform="translate(0,0)" className="fill-slate-200 dark:fill-cyan-500/20" />
                        </pattern>
                        <pattern id="hatchRed" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
                            <rect width="3" height="6" transform="translate(0,0)" className="fill-red-400/30 dark:fill-red-500/50" />
                        </pattern>
                        <linearGradient id="shaftGrad" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="0%" stopColor="rgb(251 146 60)" />
                             <stop offset="50%" stopColor="rgb(249 115 22)" />
                             <stop offset="100%" stopColor="rgb(194 65 12)" />
                        </linearGradient>
                    </defs>

                    {/* HOLE MATERIAL (Back) */}
                    {hole && (
                        <>
                            {/* Top Block */}
                            <path d={`M0,0 L${svgSize},0 L${svgSize},${centerY - holeVisualRadius} L0,${centerY - holeVisualRadius} Z`} className="fill-slate-100 dark:fill-cyan-950/20 stroke-slate-300 dark:stroke-cyan-800/50" strokeWidth="1" />
                            <rect x="0" y="0" width={svgSize} height={centerY - holeVisualRadius} fill="url(#hatch)" className="opacity-50 dark:opacity-80" />
                            
                            {/* Bottom Block */}
                            <path d={`M0,${svgSize} L${svgSize},${svgSize} L${svgSize},${centerY + holeVisualRadius} L0,${centerY + holeVisualRadius} Z`} className="fill-slate-100 dark:fill-cyan-950/20 stroke-slate-300 dark:stroke-cyan-800/50" strokeWidth="1" />
                            <rect x="0" y={centerY + holeVisualRadius} width={svgSize} height={svgSize - (centerY + holeVisualRadius)} fill="url(#hatch)" className="opacity-50 dark:opacity-80" />
                        </>
                    )}

                    {/* Nominal Lines - Hot Pink in Dark Mode for Neon Look */}
                    <line x1="0" y1={centerY - nominalRadius} x2={svgSize} y2={centerY - nominalRadius} stroke="currentColor" strokeWidth="1" strokeDasharray="4,2" className="text-red-400 dark:text-fuchsia-500 opacity-60 dark:opacity-80" />
                    <text x={svgSize / 2} y={centerY - nominalRadius - 4} textAnchor="middle" className="fill-red-500 dark:fill-fuchsia-500 text-[10px] font-bold opacity-60 dark:opacity-100">{t.nominal}</text>
                    <line x1="0" y1={centerY + nominalRadius} x2={svgSize} y2={centerY + nominalRadius} stroke="currentColor" strokeWidth="1" strokeDasharray="4,2" className="text-red-400 dark:text-fuchsia-500 opacity-60 dark:opacity-80" />

                    {/* SHAFT (Middle) */}
                    {shaft && (
                        <g>
                            <rect 
                                x={shaftRectX} 
                                y={centerY - shaftVisualRadius} 
                                width={shaftRectWidth} 
                                height={shaftVisualRadius * 2} 
                                rx="4"
                                fill="url(#shaftGrad)"
                                className="shadow-lg stroke-none dark:stroke-orange-500 dark:stroke-1"
                            />
                            {/* Reflection/Shadow lines */}
                            <line x1={shaftRectX} y1={centerY - shaftVisualRadius} x2={shaftRectX + shaftRectWidth} y2={centerY - shaftVisualRadius} stroke="#fff" strokeWidth="1" opacity="0.5" />
                            <line x1={shaftRectX} y1={centerY + shaftVisualRadius} x2={shaftRectX + shaftRectWidth} y2={centerY + shaftVisualRadius} stroke="#000" strokeWidth="1" opacity="0.3" />
                        </g>
                    )}

                    {/* INTERFERENCE HIGHLIGHT & HOLE BOUNDARY (Front) */}
                    {hole && (
                        <>
                             {/* Hole Limits (drawn on top of shaft to show reference) - Neon Cyan in Dark Mode */}
                             <line x1="0" y1={centerY - holeVisualRadius} x2={svgSize} y2={centerY - holeVisualRadius} className="stroke-blue-500 dark:stroke-cyan-400" strokeWidth="2" strokeDasharray="4,2" />
                             <line x1="0" y1={centerY + holeVisualRadius} x2={svgSize} y2={centerY + holeVisualRadius} className="stroke-blue-500 dark:stroke-cyan-400" strokeWidth="2" strokeDasharray="4,2" />

                             {/* Interference Highlights */}
                             {shaft && shaftVisualRadius > holeVisualRadius && (
                                <g className="animate-pulse">
                                    {/* Top Overlap */}
                                    <rect 
                                        x={shaftRectX} 
                                        y={centerY - shaftVisualRadius} 
                                        width={shaftRectWidth} 
                                        height={shaftVisualRadius - holeVisualRadius} 
                                        fill="url(#hatchRed)"
                                        className="stroke-red-500 dark:stroke-red-400"
                                        strokeWidth="1"
                                        strokeOpacity="0.8"
                                    />
                                    {/* Bottom Overlap */}
                                    <rect 
                                        x={shaftRectX} 
                                        y={centerY + holeVisualRadius} 
                                        width={shaftRectWidth} 
                                        height={shaftVisualRadius - holeVisualRadius} 
                                        fill="url(#hatchRed)"
                                        className="stroke-red-500 dark:stroke-red-400"
                                        strokeWidth="1"
                                        strokeOpacity="0.8"
                                    />
                                </g>
                             )}
                        </>
                    )}

                    {/* Center Line */}
                    <line x1="0" y1={centerY} x2={svgSize} y2={centerY} stroke="currentColor" strokeDasharray="15,5,2,5" strokeWidth="1" className="text-slate-500 dark:text-slate-600 opacity-40" />
                </svg>

                {/* Overlay Badge */}
                {hole && shaft && (
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-100 ${isInterference ? 'bg-red-500 dark:bg-red-600 scale-110 shadow-red-500/20' : 'bg-green-500 dark:bg-green-600'} text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-10 opacity-90 whitespace-nowrap flex items-center gap-2`}>
                        {isInterference && <AlertTriangle className="w-3 h-3 text-white" />}
                        {isInterference ? t.interference : t.clearance}: {Math.abs(currentGap).toFixed(1)} µm
                    </div>
                )}
             </div>
        </div>

        {/* RIGHT: CHART VIEW */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center relative">
             {hideControls && <h4 className="text-slate-500 uppercase text-xs font-bold mb-4">{t.chart}</h4>}
             
             <div className="w-full max-w-[280px]">
                <svg width="100%" height={chartHeight} className="overflow-visible font-mono text-xs">
                    {/* Zero Line */}
                    <line x1={40} y1={zeroY} x2="100%" y2={zeroY} stroke="currentColor" strokeWidth="1" strokeDasharray="4,4" className="text-slate-400 dark:text-slate-500 opacity-50" />
                    <text x={35} y={zeroY + 4} textAnchor="end" className="fill-slate-400 dark:fill-slate-500 font-bold">0</text>
                    
                    {/* Bars Container */}
                    <g transform="translate(50, 0)">
                        {hole && (
                            <>
                                {/* Static Bar */}
                                <rect 
                                    x={20} 
                                    y={mapY(hole.es)} 
                                    width={60} 
                                    height={Math.max(1, Math.abs(mapY(hole.es) - mapY(hole.ei)))} 
                                    className="fill-blue-500/10 stroke-blue-500/50 dark:fill-cyan-500/10 dark:stroke-cyan-500/50"
                                    strokeWidth="1"
                                />
                                {/* Static Labels */}
                                <text x={50} y={mapY(hole.es) - 6} textAnchor="middle" className="fill-blue-600/50 dark:fill-cyan-400/80 text-[10px]">{hole.es > 0 ? '+' : ''}{hole.es}</text>
                                <text x={50} y={mapY(hole.ei) + 12} textAnchor="middle" className="fill-blue-600/50 dark:fill-cyan-400/80 text-[10px]">{hole.ei > 0 ? '+' : ''}{hole.ei}</text>

                                {/* Dynamic Line - MOVES WITH SLIDER */}
                                <g className="transition-all duration-75 ease-linear">
                                    <line 
                                        x1={10} 
                                        y1={mapY(currentHoleDev)} 
                                        x2={90} 
                                        y2={mapY(currentHoleDev)} 
                                        className="stroke-blue-600 dark:stroke-cyan-400" 
                                        strokeWidth="2" 
                                    />
                                    {/* Arrow/Indicator */}
                                    <polygon points={`90,${mapY(currentHoleDev)} 85,${mapY(currentHoleDev)-3} 85,${mapY(currentHoleDev)+3}`} className="fill-blue-600 dark:fill-cyan-400" />
                                </g>
                            </>
                        )}
                        
                        {shaft && (
                            <>
                                {/* Static Bar */}
                                <rect 
                                    x={hole ? 120 : 20} 
                                    y={mapY(shaft.es)} 
                                    width={60} 
                                    height={Math.max(1, Math.abs(mapY(shaft.es) - mapY(shaft.ei)))} 
                                    className="fill-orange-500/10 stroke-orange-500/50 dark:fill-orange-500/10 dark:stroke-orange-500/50"
                                    strokeWidth="1"
                                />
                                {/* Static Labels */}
                                <text x={hole ? 150 : 50} y={mapY(shaft.es) - 6} textAnchor="middle" className="fill-orange-600/50 dark:fill-orange-400/80 text-[10px]">{shaft.es > 0 ? '+' : ''}{shaft.es}</text>
                                <text x={hole ? 150 : 50} y={mapY(shaft.ei) + 12} textAnchor="middle" className="fill-orange-600/50 dark:fill-orange-400/80 text-[10px]">{shaft.ei > 0 ? '+' : ''}{shaft.ei}</text>

                                {/* Dynamic Line - MOVES WITH SLIDER */}
                                <g className="transition-all duration-75 ease-linear">
                                    <line 
                                        x1={hole ? 110 : 10} 
                                        y1={mapY(currentShaftDev)} 
                                        x2={hole ? 190 : 90} 
                                        y2={mapY(currentShaftDev)} 
                                        className="stroke-orange-600 dark:stroke-orange-400" 
                                        strokeWidth="2" 
                                    />
                                    {/* Arrow/Indicator */}
                                    <polygon points={`${hole ? 190 : 90},${mapY(currentShaftDev)} ${hole ? 185 : 85},${mapY(currentShaftDev)-3} ${hole ? 185 : 85},${mapY(currentShaftDev)+3}`} className="fill-orange-600 dark:fill-orange-400" />
                                </g>
                            </>
                        )}
                    </g>
                </svg>
             </div>
        </div>

      </div>

      {/* Slider Controls */}
      {!hideControls && (
        <div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 p-4">
            <div className="max-w-xl mx-auto">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    <span>{leftLabel}</span>
                    <span>{rightLabel}</span>
                </div>
                <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={simPercent} 
                    onChange={(e) => setSimPercent(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-600 transition-all"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2 font-mono" dir="ltr">
                    {/* Force LTR for numbers/math logic consistency */}
                    <span className={simPercent === 0 ? "text-blue-500 dark:text-cyan-400 font-bold" : ""}>
                        0%
                    </span>
                    <div className="flex gap-4">
                        {hole && <span className="text-blue-600 dark:text-cyan-400">Hole: {currentHoleDev.toFixed(1)}</span>}
                        {shaft && <span className="text-orange-600 dark:text-orange-400">Shaft: {currentShaftDev.toFixed(1)}</span>}
                    </div>
                    <span className={simPercent === 100 ? "text-blue-500 dark:text-cyan-400 font-bold" : ""}>
                        100%
                    </span>
                </div>
            </div>
        </div>
      )}
      
      {/* Legend Footer */}
      <div className="bg-slate-100 dark:bg-slate-950/30 border-t border-slate-200 dark:border-slate-800 px-6 py-3 flex gap-6 text-xs justify-center flex-wrap" dir={language === 'ar' ? 'rtl' : 'ltr'}>
         {hole && (
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 dark:bg-cyan-500 rounded-sm"></div>
                <span className="text-slate-600 dark:text-slate-400">{t.hole} ({hole.grade})</span>
            </div>
         )}
         {shaft && (
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
                <span className="text-slate-600 dark:text-slate-400">{t.shaft} ({shaft.grade})</span>
             </div>
         )}
         <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 border-t border-dashed border-red-500 dark:border-fuchsia-500"></div>
            <span className="text-slate-600 dark:text-slate-400">{t.nominal}</span>
         </div>
      </div>
    </div>
  );
};

export default ToleranceVisualizer;