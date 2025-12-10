import React, { useState, useEffect } from 'react';
import { Calculator, ArrowRight, Settings, Info, Copy, Check, RotateCcw, Moon, Sun, BookOpen, ChevronDown } from 'lucide-react';
import { calculateTolerance, SUPPORTED_HOLE_LETTERS, SUPPORTED_SHAFT_LETTERS, SUPPORTED_IT_GRADES } from './services/isoService';
import { IsoCalculationResponse, CalculationMode } from './types';
import ToleranceVisualizer from './components/ToleranceVisualizer';

interface FitDefinition {
  name: string;
  category: string;
  desc: string;
  type: 'Clearance' | 'Transition' | 'Interference';
}

const EXTENDED_COMMON_FITS: FitDefinition[] = [
  // Clearance
  { name: "H9/d9", category: "Loose Running", desc: "Wide commercial tolerance. For loose pulleys, agricultural mach.", type: "Clearance" },
  { name: "H8/e8", category: "Loose Running", desc: "Good clearance. For main bearings, heavy machinery.", type: "Clearance" },
  { name: "H8/f7", category: "Running", desc: "Average quality. For lubricated bearings, gearboxes.", type: "Clearance" },
  { name: "H7/g6", category: "Sliding", desc: "Precision running. For accurate guiding, sliding parts.", type: "Clearance" },
  { name: "H7/h6", category: "Locational", desc: "Locational clearance. Easy assembly, stationary parts.", type: "Clearance" },
  
  // Transition
  { name: "H7/k6", category: "Locational", desc: "Locational transition. Gears, pulleys. No sliding.", type: "Transition" },
  { name: "H7/n6", category: "Transition", desc: "Tight location. Assembly with mallet/press. Rigid.", type: "Transition" },
  
  // Interference
  { name: "H7/p6", category: "Press Fit", desc: "Locational interference. Standard press fit.", type: "Interference" },
  { name: "H7/s6", category: "Drive Fit", desc: "Medium drive fit. Permanent assembly, heavy duty.", type: "Interference" },
];

const App: React.FC = () => {
  const [nominalSize, setNominalSize] = useState<number | ''>(40);
  const [mode, setMode] = useState<CalculationMode>(CalculationMode.FIT);
  
  // Split state for dropdowns
  const [holeLetter, setHoleLetter] = useState('H');
  const [holeIT, setHoleIT] = useState('7');
  const [shaftLetter, setShaftLetter] = useState('g');
  const [shaftIT, setShaftIT] = useState('6');

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IsoCalculationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showFits, setShowFits] = useState(true);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Helper to compose grade string
  const getHoleGrade = () => `${holeLetter}${holeIT}`;
  const getShaftGrade = () => `${shaftLetter}${shaftIT}`;

  const handleCalculate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nominalSize) return;

    setLoading(true);
    setError(null);
    setCopied(false);

    try {
      const data = await calculateTolerance(
        Number(nominalSize),
        mode,
        getHoleGrade(),
        mode === CalculationMode.FIT ? getShaftGrade() : undefined
      );
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const applyCommonFit = (fitName: string) => {
    const [h, s] = fitName.split('/');
    
    // Parse Hole (e.g., H7)
    const hMatch = h.match(/^([a-zA-Z]+)(\d+)$/);
    if (hMatch) {
      setHoleLetter(hMatch[1]);
      setHoleIT(hMatch[2]);
    }

    // Parse Shaft (e.g., g6)
    const sMatch = s.match(/^([a-zA-Z]+)(\d+)$/);
    if (sMatch) {
      setShaftLetter(sMatch[1]);
      setShaftIT(sMatch[2]);
    }

    setMode(CalculationMode.FIT);
    // Optional: auto-scroll to top or highlight changes?
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result.text_summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const groupedFits = EXTENDED_COMMON_FITS.reduce((acc, fit) => {
    if (!acc[fit.type]) acc[fit.type] = [];
    acc[fit.type].push(fit);
    return acc;
  }, {} as Record<string, FitDefinition[]>);

  return (
    <div className="min-h-screen transition-colors duration-200 bg-slate-100 dark:bg-slate-950 dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-slate-900 dark:via-slate-950 dark:to-black text-slate-900 dark:text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg shadow-md">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">ISO<span className="text-blue-600 dark:text-blue-500">Fit</span> Pro</h1>
          </div>
          <div className="flex items-center gap-4">
             <button 
               onClick={toggleTheme}
               className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
             >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
             </button>
             <div className="hidden sm:flex text-xs font-mono text-slate-500 flex-center gap-2">
               <span>ISO 286</span>
               <span className="w-1 h-1 bg-slate-400 dark:bg-slate-600 rounded-full"></span>
               <span>Local Engine</span>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Input Section */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xl transition-colors duration-200">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-500" />
                Configuration
              </h2>
              
              <form onSubmit={handleCalculate} className="space-y-6">
                
                {/* Mode Selector */}
                <div className="bg-slate-100 dark:bg-slate-950/50 p-1 rounded-lg flex border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setMode(CalculationMode.SINGLE)}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                      mode === CalculationMode.SINGLE 
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-transparent' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    Tolerance Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode(CalculationMode.FIT)}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                      mode === CalculationMode.FIT 
                        ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-600/30 shadow-sm' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    Fit Calculation
                  </button>
                </div>

                {/* Nominal Size */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Nominal Size (mm)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={nominalSize}
                      onChange={(e) => setNominalSize(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-mono text-lg"
                      placeholder="e.g. 40"
                      min="0"
                      max="500"
                      step="0.01"
                      required
                    />
                    <span className="absolute right-4 top-3.5 text-slate-400 dark:text-slate-500 font-mono">mm</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-600 mt-1">Supported range: 0-500mm</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Hole Grade Dropdowns */}
                  <div>
                    <label className="block text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Hole Grade</label>
                    <div className="flex gap-1">
                      <div className="relative w-2/3">
                        <select
                          value={holeLetter}
                          onChange={(e) => setHoleLetter(e.target.value)}
                          className="w-full appearance-none bg-slate-50 dark:bg-slate-950 border border-blue-200 dark:border-blue-900/30 rounded-lg pl-3 pr-8 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-mono text-lg uppercase cursor-pointer"
                        >
                          {SUPPORTED_HOLE_LETTERS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-4 w-4 h-4 text-blue-400 pointer-events-none" />
                      </div>
                      <div className="relative w-1/3">
                        <select
                          value={holeIT}
                          onChange={(e) => setHoleIT(e.target.value)}
                          className="w-full appearance-none bg-slate-50 dark:bg-slate-950 border border-blue-200 dark:border-blue-900/30 rounded-lg pl-3 pr-6 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-mono text-lg cursor-pointer"
                        >
                          {SUPPORTED_IT_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Shaft Grade Dropdowns */}
                  <div className={`transition-opacity ${mode === CalculationMode.SINGLE ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                    <label className="block text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">Shaft Grade</label>
                    <div className="flex gap-1">
                      <div className="relative w-2/3">
                        <select
                          value={shaftLetter}
                          onChange={(e) => setShaftLetter(e.target.value)}
                          className="w-full appearance-none bg-slate-50 dark:bg-slate-950 border border-orange-200 dark:border-orange-900/30 rounded-lg pl-3 pr-8 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none font-mono text-lg lowercase cursor-pointer"
                        >
                          {SUPPORTED_SHAFT_LETTERS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-4 w-4 h-4 text-orange-400 pointer-events-none" />
                      </div>
                      <div className="relative w-1/3">
                        <select
                          value={shaftIT}
                          onChange={(e) => setShaftIT(e.target.value)}
                          className="w-full appearance-none bg-slate-50 dark:bg-slate-950 border border-orange-200 dark:border-orange-900/30 rounded-lg pl-3 pr-6 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none font-mono text-lg cursor-pointer"
                        >
                          {SUPPORTED_IT_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
                >
                  {loading ? (
                    <>
                      <RotateCcw className="w-5 h-5 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      Calculate <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
            
            {/* Common Fits Section */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-md transition-colors duration-200">
               <button 
                onClick={() => setShowFits(!showFits)}
                className="w-full px-6 py-4 flex items-center justify-between text-left text-sm font-semibold text-slate-800 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
               >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-500" />
                    Common Fits Quick Select
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFits ? 'rotate-180' : ''}`} />
               </button>
               
               {showFits && (
                 <div className="px-6 pb-6 space-y-4 max-h-[500px] overflow-y-auto">
                    {Object.entries(groupedFits).map(([type, fits]) => (
                      <div key={type}>
                        <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                           type === 'Clearance' ? 'text-green-600 dark:text-green-400' :
                           type === 'Interference' ? 'text-red-600 dark:text-red-400' :
                           'text-yellow-600 dark:text-yellow-400'
                        }`}>{type} Fits</h4>
                        <div className="space-y-2">
                          {fits.map((fit) => (
                            <button
                              key={fit.name}
                              onClick={() => applyCommonFit(fit.name)}
                              className="w-full group flex items-start justify-between p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-left"
                            >
                              <div className="flex-1 min-w-0 pr-3">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">{fit.name}</span>
                                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">({fit.category})</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-500 truncate">{fit.desc}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-8">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 p-4 rounded-lg mb-6 flex items-center gap-3">
                 <Info className="w-5 h-5" />
                 {error}
              </div>
            )}

            {!result && !loading && !error && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-xl min-h-[400px]">
                <Settings className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg">Enter parameters to calculate tolerances</p>
              </div>
            )}

            {loading && (
                <div className="h-full flex flex-col items-center justify-center min-h-[400px]">
                     <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                     <p className="text-slate-500 dark:text-slate-400 animate-pulse">Consulting Engineering Database...</p>
                </div>
            )}

            {result && !loading && (
              <div className="space-y-6">
                
                {/* Main Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Visualizer Card */}
                    <ToleranceVisualizer data={result} />

                    {/* Fit Details Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-between transition-colors duration-200">
                         <div>
                            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-semibold mb-4 uppercase tracking-wider">Engineering Recommendation</h3>
                            <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 rounded-r-lg mb-6">
                                <p className="text-blue-900 dark:text-blue-100 text-sm italic">
                                    "{result.recommendation}"
                                </p>
                            </div>

                            {result.fit && (
                                <div className="space-y-4">
                                    <h3 className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider">Fit Characteristics</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                                            <span className="text-xs text-slate-500 block mb-1">Fit Type</span>
                                            <span className={`font-bold ${
                                                result.fit.type === 'Interference' ? 'text-red-500 dark:text-red-400' : 
                                                result.fit.type === 'Clearance' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
                                            }`}>{result.fit.type}</span>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                                            <span className="text-xs text-slate-500 block mb-1">Description</span>
                                            <span className="text-slate-700 dark:text-slate-200 text-sm">{result.fit.description}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                         </div>

                         <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                             <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">Source: {result.iso_standard}</span>
                                <button 
                                    onClick={copyToClipboard}
                                    className="flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? "Copied" : "Copy Summary"}
                                </button>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Detailed Data Table */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xl transition-colors duration-200">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                        <h3 className="font-semibold text-slate-800 dark:text-white">Detailed Dimensions</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-medium">
                                <tr>
                                    <th className="px-6 py-3">Component</th>
                                    <th className="px-6 py-3">Class</th>
                                    <th className="px-6 py-3 text-right">Deviation (Upper)</th>
                                    <th className="px-6 py-3 text-right">Deviation (Lower)</th>
                                    <th className="px-6 py-3 text-right">Max Size</th>
                                    <th className="px-6 py-3 text-right">Min Size</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 font-medium text-blue-600 dark:text-blue-400">Hole</td>
                                    <td className="px-6 py-4 font-mono">{result.hole.grade}</td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-500 dark:text-slate-400">+{result.hole.es} µm</td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-500 dark:text-slate-400">+{result.hole.ei} µm</td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-900 dark:text-white">{result.hole.max_size.toFixed(3)} mm</td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-900 dark:text-white">{result.hole.min_size.toFixed(3)} mm</td>
                                </tr>
                                {result.shaft && (
                                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-orange-600 dark:text-orange-400">Shaft</td>
                                        <td className="px-6 py-4 font-mono">{result.shaft.grade}</td>
                                        <td className="px-6 py-4 text-right font-mono text-slate-500 dark:text-slate-400">
                                            {result.shaft.es > 0 ? '+' : ''}{result.shaft.es} µm
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-slate-500 dark:text-slate-400">
                                            {result.shaft.ei > 0 ? '+' : ''}{result.shaft.ei} µm
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-slate-900 dark:text-white">{result.shaft.max_size.toFixed(3)} mm</td>
                                        <td className="px-6 py-4 text-right font-mono text-slate-900 dark:text-white">{result.shaft.min_size.toFixed(3)} mm</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;