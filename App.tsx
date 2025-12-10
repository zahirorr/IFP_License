import React, { useState, useEffect } from 'react';
import { Calculator, ArrowRight, Settings, Info, Copy, Check, RotateCcw, Moon, Sun, BookOpen, ChevronDown, Languages, Circle } from 'lucide-react';
import { calculateTolerance, SUPPORTED_HOLE_LETTERS, SUPPORTED_SHAFT_LETTERS, SUPPORTED_IT_GRADES } from './services/isoService';
import { IsoCalculationResponse, CalculationMode, Language } from './types';
import ToleranceVisualizer from './components/ToleranceVisualizer';

interface FitDefinition {
  name: string;
  category: string;
  desc: string;
  type: 'Clearance' | 'Transition' | 'Interference';
}

// UI Translations
const UI_TEXT = {
  en: {
    iso_fit: "ISO Fit Pro",
    local_engine: "Local Engine",
    config: "Configuration",
    tolerance_only: "Tolerance Only",
    fit_calc: "Fit Calculation",
    nominal_size: "Nominal Size (mm)",
    supported_range: "Supported range: 0-500mm",
    hole_grade: "Hole Grade",
    shaft_grade: "Shaft Grade",
    calculate: "Calculate",
    calculating: "Calculating...",
    common_fits: "Common Fits Quick Select",
    engineering_rec: "Engineering Recommendation",
    fit_characteristics: "Fit Characteristics",
    fit_type: "Fit Type",
    description: "Description",
    source: "Source",
    copy: "Copy Summary",
    copied: "Copied",
    detailed_dim: "Detailed Dimensions",
    component: "Component",
    class: "Class",
    dev_upper: "Deviation (Upper)",
    dev_lower: "Deviation (Lower)",
    max_size: "Max Size",
    min_size: "Min Size",
    hole: "Hole",
    hole_system: "Hole Basis",
    shaft: "Shaft",
    shaft_system: "Shaft Basis",
    enter_params: "Enter parameters to calculate tolerances",
    clearance_fits: "Clearance Fits",
    transition_fits: "Transition Fits",
    interference_fits: "Interference Fits",
    select_system: "Component Type"
  },
  de: {
    iso_fit: "ISO Passung Pro",
    local_engine: "Lokale Engine",
    config: "Konfiguration",
    tolerance_only: "Nur Toleranz",
    fit_calc: "Passungsberechnung",
    nominal_size: "Nennmaß (mm)",
    supported_range: "Bereich: 0-500mm",
    hole_grade: "Bohrungstoleranz",
    shaft_grade: "Wellentoleranz",
    calculate: "Berechnen",
    calculating: "Berechne...",
    common_fits: "Häufige Passungen",
    engineering_rec: "Technische Empfehlung",
    fit_characteristics: "Passungseigenschaften",
    fit_type: "Passungsart",
    description: "Beschreibung",
    source: "Quelle",
    copy: "Kopieren",
    copied: "Kopiert",
    detailed_dim: "Detaillierte Maße",
    component: "Komponente",
    class: "Klasse",
    dev_upper: "Abmaß (Oben)",
    dev_lower: "Abmaß (Unten)",
    max_size: "Höchstmaß",
    min_size: "Mindestmaß",
    hole: "Bohrung",
    hole_system: "Bohrungssys.",
    shaft: "Welle",
    shaft_system: "Wellensys.",
    enter_params: "Parameter eingeben für Berechnung",
    clearance_fits: "Spielpassungen",
    transition_fits: "Übergangspassungen",
    interference_fits: "Übermaßpassungen",
    select_system: "Komponententyp"
  },
  ar: {
    iso_fit: "حاسبة التفاوتات ISO",
    local_engine: "محرك محلي",
    config: "الإعدادات",
    tolerance_only: "تفاوت فقط",
    fit_calc: "حساب الازدواج",
    nominal_size: "المقاس الاسمي (مم)",
    supported_range: "النطاق المدعوم: 0-500 مم",
    hole_grade: "درجة الثقب",
    shaft_grade: "درجة العمود",
    calculate: "حساب",
    calculating: "جاري الحساب...",
    common_fits: "ازدواجات شائعة",
    engineering_rec: "توصية هندسية",
    fit_characteristics: "خصائص الازدواج",
    fit_type: "نوع الازدواج",
    description: "الوصف",
    source: "المصدر",
    copy: "نسخ الملخص",
    copied: "تم النسخ",
    detailed_dim: "أبعاد تفصيلية",
    component: "المكون",
    class: "الفئة",
    dev_upper: "الانحراف (الأعلى)",
    dev_lower: "الانحراف (الأدنى)",
    max_size: "الحد الأقصى",
    min_size: "الحد الأدنى",
    hole: "الثقب",
    hole_system: "أساس ثقب",
    shaft: "العمود",
    shaft_system: "أساس عمود",
    enter_params: "أدخل المعلمات لحساب التفاوتات",
    clearance_fits: "ازدواج خلوصي",
    transition_fits: "ازدواج انتقالي",
    interference_fits: "ازدواج تداخلي",
    select_system: "نوع المكون"
  }
};

const getCommonFits = (lang: Language): FitDefinition[] => {
  if (lang === 'de') {
      return [
        { name: "H9/d9", category: "Lockere Laufpassung", desc: "Großes Spiel. Für Riemenscheiben, Landmaschinen.", type: "Clearance" },
        { name: "H8/e8", category: "Lockere Laufpassung", desc: "Gutes Spiel. Für Hauptlager, Schwermaschinen.", type: "Clearance" },
        { name: "H8/f7", category: "Laufpassung", desc: "Durchschnittliche Qualität. Für geschmierte Lager, Getriebe.", type: "Clearance" },
        { name: "H7/g6", category: "Gleitpassung", desc: "Präzisionslauf. Für genaue Führung, gleitende Teile.", type: "Clearance" },
        { name: "H7/h6", category: "Positionierung", desc: "Spielpassung. Leichte Montage, stationäre Teile.", type: "Clearance" },
        { name: "H7/k6", category: "Positionierung", desc: "Übergangspassung. Zahnräder, Riemenscheiben.", type: "Transition" },
        { name: "H7/n6", category: "Übergang", desc: "Fester Sitz. Montage mit Hammer/Presse.", type: "Transition" },
        { name: "H7/p6", category: "Presspassung", desc: "Übermaßpassung. Standard-Presspassung.", type: "Interference" },
        { name: "H7/s6", category: "Treibpassung", desc: "Mittlere Treibpassung. Dauerhafte Montage.", type: "Interference" },
      ];
  }
  if (lang === 'ar') {
      return [
        { name: "H9/d9", category: "تشغيلي واسع", desc: "تفاوت تجاري واسع. للبكرات السائبة، الآلات الزراعية.", type: "Clearance" },
        { name: "H8/e8", category: "تشغيلي واسع", desc: "خلوص جيد. للمحامل الرئيسية، الآلات الثقيلة.", type: "Clearance" },
        { name: "H8/f7", category: "تشغيلي", desc: "جودة متوسطة. للمحامل المزيتة، صناديق التروس.", type: "Clearance" },
        { name: "H7/g6", category: "انزلاقي", desc: "تشغيل دقيق. للتوجيه الدقيق، الأجزاء المنزلقة.", type: "Clearance" },
        { name: "H7/h6", category: "موضعي", desc: "خلوص موضعي. تجميع سهل، أجزاء ثابتة.", type: "Clearance" },
        { name: "H7/k6", category: "موضعي", desc: "انتقالي موضعي. التروس، البكرات. لا يوجد انزلاق.", type: "Transition" },
        { name: "H7/n6", category: "انتقالي", desc: "موقع محكم. تجميع بالمطرقة/المكبس. صلب.", type: "Transition" },
        { name: "H7/p6", category: "تثبيت بالضغط", desc: "تداخل موضعي. تثبيت بالضغط قياسي.", type: "Interference" },
        { name: "H7/s6", category: "دفع", desc: "دفع متوسط. تجميع دائم، خدمة شاقة.", type: "Interference" },
      ];
  }
  // Default EN
  return [
    { name: "H9/d9", category: "Loose Running", desc: "Wide commercial tolerance. For loose pulleys, agricultural mach.", type: "Clearance" },
    { name: "H8/e8", category: "Loose Running", desc: "Good clearance. For main bearings, heavy machinery.", type: "Clearance" },
    { name: "H8/f7", category: "Running", desc: "Average quality. For lubricated bearings, gearboxes.", type: "Clearance" },
    { name: "H7/g6", category: "Sliding", desc: "Precision running. For accurate guiding, sliding parts.", type: "Clearance" },
    { name: "H7/h6", category: "Locational", desc: "Locational clearance. Easy assembly, stationary parts.", type: "Clearance" },
    { name: "H7/k6", category: "Locational", desc: "Locational transition. Gears, pulleys. No sliding.", type: "Transition" },
    { name: "H7/n6", category: "Transition", desc: "Tight location. Assembly with mallet/press. Rigid.", type: "Transition" },
    { name: "H7/p6", category: "Press Fit", desc: "Locational interference. Standard press fit.", type: "Interference" },
    { name: "H7/s6", category: "Drive Fit", desc: "Medium drive fit. Permanent assembly, heavy duty.", type: "Interference" },
  ];
};

const App: React.FC = () => {
  const [nominalSize, setNominalSize] = useState<number | ''>(40);
  const [mode, setMode] = useState<CalculationMode>(CalculationMode.FIT);
  const [language, setLanguage] = useState<Language>('en');
  
  // Single Mode Type Selection
  const [singleType, setSingleType] = useState<'hole' | 'shaft'>('hole');

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
  
  const t = UI_TEXT[language];

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

  const getHoleGrade = () => `${holeLetter}${holeIT}`;
  const getShaftGrade = () => `${shaftLetter}${shaftIT}`;

  const handleCalculate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nominalSize) return;

    setLoading(true);
    setError(null);
    setCopied(false);

    let grade1: string;
    let grade2: string | undefined;

    if (mode === CalculationMode.FIT) {
        grade1 = getHoleGrade();
        grade2 = getShaftGrade();
    } else {
        // Single mode
        grade1 = singleType === 'hole' ? getHoleGrade() : getShaftGrade();
        grade2 = undefined;
    }

    try {
      const data = await calculateTolerance(
        Number(nominalSize),
        mode,
        grade1,
        grade2,
        language
      );
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Re-calculate if language changes and we have a result
  useEffect(() => {
    if (result) {
        handleCalculate();
    }
  }, [language]);

  const applyCommonFit = (fitName: string) => {
    const [h, s] = fitName.split('/');
    
    // Parse Hole
    const hMatch = h.match(/^([a-zA-Z]+)(\d+)$/);
    if (hMatch) {
      setHoleLetter(hMatch[1]);
      setHoleIT(hMatch[2]);
    }

    // Parse Shaft
    const sMatch = s.match(/^([a-zA-Z]+)(\d+)$/);
    if (sMatch) {
      setShaftLetter(sMatch[1]);
      setShaftIT(sMatch[2]);
    }

    setMode(CalculationMode.FIT);
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result.text_summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const fitsList = getCommonFits(language);
  const groupedFits = fitsList.reduce((acc, fit) => {
    if (!acc[fit.type]) acc[fit.type] = [];
    acc[fit.type].push(fit);
    return acc;
  }, {} as Record<string, FitDefinition[]>);

  const getTypeLabel = (type: string) => {
      if (type === 'Clearance') return t.clearance_fits;
      if (type === 'Interference') return t.interference_fits;
      return t.transition_fits;
  }

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen transition-colors duration-200 bg-slate-100 dark:bg-slate-950 dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-slate-900 dark:via-slate-950 dark:to-black text-slate-900 dark:text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg shadow-md">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">
                {language === 'ar' ? 'حاسبة ' : 'ISO'}
                <span className="text-blue-600 dark:text-blue-500">Fit</span>
                {language === 'ar' ? '' : ' Pro'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
             {/* Language Dropdown */}
             <div className="relative group">
                <button className="flex items-center gap-1 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors text-sm font-medium uppercase">
                    <Languages className="w-4 h-4" />
                    {language}
                </button>
                <div className="absolute ltr:right-0 rtl:left-0 top-full mt-2 w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <button onClick={() => setLanguage('en')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 rounded-t-lg">English</button>
                    <button onClick={() => setLanguage('de')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">Deutsch</button>
                    <button onClick={() => setLanguage('ar')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 rounded-b-lg font-sans">العربية</button>
                </div>
             </div>

             <button 
               onClick={toggleTheme}
               className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
             >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
             </button>
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
                {t.config}
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
                    {t.tolerance_only}
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
                    {t.fit_calc}
                  </button>
                </div>

                {/* Nominal Size */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{t.nominal_size}</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={nominalSize}
                      onChange={(e) => setNominalSize(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-mono text-lg ltr:text-left rtl:text-right"
                      placeholder="e.g. 40"
                      min="0"
                      max="500"
                      step="0.01"
                      required
                    />
                    <span className="absolute right-4 top-3.5 text-slate-400 dark:text-slate-500 font-mono rtl:right-auto rtl:left-4">mm</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-600 mt-1">{t.supported_range}</p>
                </div>

                {/* Single Mode Component Selector */}
                {mode === CalculationMode.SINGLE && (
                   <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${singleType === 'hole' ? 'border-blue-500' : 'border-slate-400'}`}>
                                {singleType === 'hole' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                            </div>
                            <input type="radio" name="compType" value="hole" checked={singleType === 'hole'} onChange={() => setSingleType('hole')} className="hidden" />
                            <span className={`text-sm ${singleType === 'hole' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-500'}`}>{t.hole}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                             <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${singleType === 'shaft' ? 'border-orange-500' : 'border-slate-400'}`}>
                                {singleType === 'shaft' && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                            </div>
                            <input type="radio" name="compType" value="shaft" checked={singleType === 'shaft'} onChange={() => setSingleType('shaft')} className="hidden" />
                            <span className={`text-sm ${singleType === 'shaft' ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-slate-500'}`}>{t.shaft}</span>
                        </label>
                   </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {/* Hole Grade Dropdowns */}
                  <div className={`transition-all duration-300 ${mode === CalculationMode.FIT || singleType === 'hole' ? 'opacity-100' : 'opacity-30 pointer-events-none grayscale'}`}>
                    <label className="block text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">{t.hole_grade}</label>
                    <div className="flex gap-1">
                      <div className="relative w-2/3">
                        <select
                          value={holeLetter}
                          onChange={(e) => setHoleLetter(e.target.value)}
                          className="w-full appearance-none bg-slate-50 dark:bg-slate-950 border border-blue-200 dark:border-blue-900/30 rounded-lg pl-3 pr-8 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-mono text-lg uppercase cursor-pointer"
                        >
                          {SUPPORTED_HOLE_LETTERS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-4 w-4 h-4 text-blue-400 pointer-events-none rtl:right-auto rtl:left-2" />
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
                  <div className={`transition-all duration-300 ${mode === CalculationMode.FIT || singleType === 'shaft' ? 'opacity-100' : 'opacity-30 pointer-events-none grayscale'}`}>
                    <label className="block text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">{t.shaft_grade}</label>
                    <div className="flex gap-1">
                      <div className="relative w-2/3">
                        <select
                          value={shaftLetter}
                          onChange={(e) => setShaftLetter(e.target.value)}
                          className="w-full appearance-none bg-slate-50 dark:bg-slate-950 border border-orange-200 dark:border-orange-900/30 rounded-lg pl-3 pr-8 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none font-mono text-lg lowercase cursor-pointer"
                        >
                          {SUPPORTED_SHAFT_LETTERS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-4 w-4 h-4 text-orange-400 pointer-events-none rtl:right-auto rtl:left-2" />
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
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <RotateCcw className="w-5 h-5 animate-spin" />
                      {t.calculating}
                    </>
                  ) : (
                    <>
                      <Calculator className="w-5 h-5" />
                      {t.calculate}
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Common Fits - Enhanced Readability */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-lg transition-colors duration-200">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        {t.common_fits}
                    </h3>
                </div>
                <div className="p-4 space-y-6 max-h-[500px] overflow-y-auto">
                    {['Clearance', 'Transition', 'Interference'].map((type) => (
                        <div key={type}>
                            <h4 className={`text-xs font-bold uppercase mb-3 flex items-center gap-2 
                                ${type === 'Clearance' ? 'text-green-600 dark:text-green-400' : 
                                  type === 'Transition' ? 'text-yellow-600 dark:text-yellow-400' : 
                                  'text-red-600 dark:text-red-400'}`}>
                                <Circle className="w-2 h-2 fill-current" />
                                {getTypeLabel(type)}
                            </h4>
                            <div className="grid grid-cols-1 gap-2">
                                {groupedFits[type]?.map((fit) => {
                                    const [h, s] = fit.name.split('/');
                                    return (
                                        <button
                                            key={fit.name}
                                            onClick={() => applyCommonFit(fit.name)}
                                            className="group flex flex-col p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-1 font-mono text-sm font-bold">
                                                    <span className="text-blue-600 dark:text-blue-400">{h}</span>
                                                    <span className="text-slate-400">/</span>
                                                    <span className="text-orange-600 dark:text-orange-400">{s}</span>
                                                </div>
                                                <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100" />
                                            </div>
                                            <div className="text-xs font-medium text-slate-700 dark:text-slate-200 mb-0.5">{fit.category}</div>
                                            <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{fit.desc}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-8">
             {result ? (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  
                  {/* Visualizer */}
                  <ToleranceVisualizer data={result} />

                  {/* Summary Card */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xl transition-colors duration-200">
                     <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                           <Info className="w-5 h-5 text-blue-500" />
                           {t.fit_characteristics}
                        </h2>
                        <button
                          onClick={copyToClipboard}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                        >
                          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copied ? t.copied : t.copy}
                        </button>
                     </div>

                     <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Text Details */}
                        <div>
                           {result.fit && (
                              <div className="mb-6">
                                 <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">{t.fit_type}</h3>
                                 <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold border ${
                                    result.fit.type === 'Interference' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/50' :
                                    result.fit.type === 'Transition' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-900/50' :
                                    'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900/50'
                                 }`}>
                                    {result.fit.type === 'Clearance' ? t.clearance_fits : result.fit.type === 'Transition' ? t.transition_fits : t.interference_fits}
                                 </div>
                                 <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{result.fit.description}</p>
                              </div>
                           )}

                           <div>
                              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">{t.engineering_rec}</h3>
                              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed border-l-2 border-blue-500 pl-3">
                                 {result.recommendation}
                              </p>
                           </div>
                           
                           <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{t.source}</h3>
                              <p className="text-xs text-slate-400 font-mono">{result.iso_standard}</p>
                           </div>
                        </div>

                        {/* Dimensions Table */}
                        <div>
                           <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">{t.detailed_dim}</h3>
                           <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
                              <table className="w-full text-sm text-left">
                                 <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                       <th className="px-3 py-2">{t.component}</th>
                                       <th className="px-3 py-2 text-right">{t.max_size}</th>
                                       <th className="px-3 py-2 text-right">{t.min_size}</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {result.hole && (
                                        <tr className="bg-white dark:bg-slate-900/50">
                                            <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                {t.hole} <span className="text-xs font-mono text-slate-400">({result.hole.grade})</span>
                                            </td>
                                            <td className="px-3 py-2 text-right font-mono text-slate-600 dark:text-slate-300">{result.hole.max_size.toFixed(3)}</td>
                                            <td className="px-3 py-2 text-right font-mono text-slate-600 dark:text-slate-300">{result.hole.min_size.toFixed(3)}</td>
                                        </tr>
                                    )}
                                    {result.shaft && (
                                        <tr className="bg-white dark:bg-slate-900/50">
                                            <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                                {t.shaft} <span className="text-xs font-mono text-slate-400">({result.shaft.grade})</span>
                                            </td>
                                            <td className="px-3 py-2 text-right font-mono text-slate-600 dark:text-slate-300">{result.shaft.max_size.toFixed(3)}</td>
                                            <td className="px-3 py-2 text-right font-mono text-slate-600 dark:text-slate-300">{result.shaft.min_size.toFixed(3)}</td>
                                        </tr>
                                    )}
                                 </tbody>
                              </table>
                           </div>
                           
                           {/* Deviations Compact */}
                           <div className="mt-4 grid grid-cols-2 gap-4">
                              {result.hole && (
                                  <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                     <div className="text-xs text-blue-600 dark:text-blue-400 font-bold mb-1">{t.hole} {result.hole.grade}</div>
                                     <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-mono">
                                        <span>ES: {result.hole.es > 0 ? '+' : ''}{result.hole.es}</span>
                                        <span>EI: {result.hole.ei > 0 ? '+' : ''}{result.hole.ei}</span>
                                     </div>
                                  </div>
                              )}
                              {result.shaft && (
                                  <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-100 dark:border-orange-900/30">
                                     <div className="text-xs text-orange-600 dark:text-orange-400 font-bold mb-1">{t.shaft} {result.shaft.grade}</div>
                                     <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-mono">
                                        <span>es: {result.shaft.es > 0 ? '+' : ''}{result.shaft.es}</span>
                                        <span>ei: {result.shaft.ei > 0 ? '+' : ''}{result.shaft.ei}</span>
                                     </div>
                                  </div>
                              )}
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
             ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 min-h-[400px] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                    <Calculator className="w-12 h-12 mb-4 opacity-50" />
                    <p className="text-sm font-medium">{t.enter_params}</p>
                </div>
             )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;