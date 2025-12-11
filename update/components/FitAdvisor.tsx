import React, { useState } from 'react';
import { X, HelpCircle, ArrowRight, CheckCircle2, RotateCw, Anchor, Hammer, Thermometer, MousePointer2, Settings, Zap, Grid, Box, Layers } from 'lucide-react';
import { Language } from '../types';

interface FitRecommendation {
  code: string;
  type: string;
  explanation: string;
  applications: string;
  assembly: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectFit: (fitCode: string) => void;
  language: Language;
}

const ADVISOR_TEXT = {
  en: {
    title: "Mechanical Fit Advisor",
    subtitle: "Answer a few questions to get the perfect ISO tolerance.",
    step1: "Which system do you prefer?",
    step2: "What is the primary function?",
    step3: "Select specific requirement:",
    result: "Recommended Fit",
    apply: "Use This Fit",
    back: "Back",
    // Systems
    sys_general: "General (Recommended)",
    sys_general_desc: "Defaults to Hole Basis (Standard). Best for most applications.",
    sys_hole: "Hole Basis System",
    sys_hole_desc: "Standard hole size (H). Shaft is varied to create fit.",
    sys_shaft: "Shaft Basis System",
    sys_shaft_desc: "Standard shaft size (h). Hole is varied to create fit.",
    // Functions
    moving: "Moving Parts",
    moving_desc: "Shaft rotates or slides inside the hole",
    fixed: "Fixed Assembly",
    fixed_desc: "Parts are stationary relative to each other",
    // Conditions
    loose_cond: "High Speed / Heat / Loose",
    loose_desc: "Large clearance for thermal expansion or dust.",
    running_cond: "Running / Lubricated",
    running_desc: "Standard running fit for gearboxes & motors.",
    prec_cond: "Precision / Accurate Guidance",
    prec_desc: "Minimal clearance for accurate positioning.",
    remove_cond: "Removable (Hand Assembly)",
    remove_desc: "Parts can be assembled/disassembled by hand.",
    rigid_cond: "Rigid (Keyed / Mallet)",
    rigid_desc: "Tight fit requiring light force. No relative movement.",
    perm_cond: "Permanent (Press Fit)",
    perm_desc: "Heavy force required. Standard press fit.",
    drive_cond: "Heavy Duty (Drive Fit)",
    drive_desc: "Permanent assembly for high torque/load.",
    type: "Type",
    explanation: "Why this fit?",
    applications: "Typical Applications",
    assembly_method: "Assembly Method"
  },
  de: {
    title: "Passungs-Berater",
    subtitle: "Beantworten Sie Fragen für die perfekte ISO-Toleranz.",
    step1: "Welches System bevorzugen Sie?",
    step2: "Was ist die Hauptfunktion?",
    step3: "Spezifische Anforderung:",
    result: "Empfohlene Passung",
    apply: "Diese Passung wählen",
    back: "Zurück",
    sys_general: "Allgemein (Empfohlen)",
    sys_general_desc: "Standard (Einheitsbohrung). Für die meisten Anwendungen.",
    sys_hole: "System Einheitsbohrung",
    sys_hole_desc: "Standardbohrung (H). Welle wird angepasst.",
    sys_shaft: "System Einheitswelle",
    sys_shaft_desc: "Standardwelle (h). Bohrung wird angepasst.",
    moving: "Bewegliche Teile",
    moving_desc: "Welle dreht oder gleitet in der Bohrung",
    fixed: "Feste Verbindung",
    fixed_desc: "Teile sind zueinander unbeweglich",
    loose_cond: "Hohe Geschwindigkeit / Hitze",
    loose_desc: "Großes Spiel für Wärmedehnung oder Staub.",
    running_cond: "Laufpassung / Geschmiert",
    running_desc: "Standard für Getriebe & Motoren.",
    prec_cond: "Präzision / Genaue Führung",
    prec_desc: "Minimales Spiel für genaue Positionierung.",
    remove_cond: "Lösbar (Handmontage)",
    remove_desc: "Teile können von Hand montiert/demontiert werden.",
    rigid_cond: "Starr (Passfeder / Hammer)",
    rigid_desc: "Fester Sitz, leichte Kraft erforderlich.",
    perm_cond: "Dauerhaft (Presspassung)",
    perm_desc: "Hohe Kraft erforderlich. Standard.",
    drive_cond: "Schwerlast (Treibpassung)",
    drive_desc: "Dauerhafte Montage für hohe Lasten.",
    type: "Typ",
    explanation: "Warum diese Passung?",
    applications: "Typische Anwendungen",
    assembly_method: "Montagemethode"
  },
  fr: {
    title: "Conseiller en Ajustements",
    subtitle: "Répondez à quelques questions pour obtenir la tolérance ISO parfaite.",
    step1: "Quel système préférez-vous?",
    step2: "Quelle est la fonction principale?",
    step3: "Sélectionnez une exigence spécifique:",
    result: "Ajustement recommandé",
    apply: "Utiliser cet ajustement",
    back: "Retour",
    sys_general: "Général (Recommandé)",
    sys_general_desc: "Par défaut Alésage Normal. Pour la plupart des cas.",
    sys_hole: "Système Alésage Normal",
    sys_hole_desc: "Alésage standard (H). L'arbre est ajusté.",
    sys_shaft: "Système Arbre Normal",
    sys_shaft_desc: "Arbre standard (h). L'alésage est ajusté.",
    moving: "Pièces mobiles",
    moving_desc: "L'arbre tourne ou glisse dans l'alésage",
    fixed: "Assemblage fixe",
    fixed_desc: "Les pièces sont immobiles l'une par rapport à l'autre",
    loose_cond: "Haute vitesse / Chaleur / Jeu",
    loose_desc: "Jeu important pour dilatation thermique ou poussière.",
    running_cond: "Tournant / Lubrifié",
    running_desc: "Ajustement tournant standard pour boîtes de vitesses & moteurs.",
    prec_cond: "Précision / Guidage précis",
    prec_desc: "Jeu minimal pour un positionnement précis.",
    remove_cond: "Démontable (Montage main)",
    remove_desc: "Les pièces peuvent être assemblées/désassemblées à la main.",
    rigid_cond: "Rigide (Claveté / Maillet)",
    rigid_desc: "Ajustement serré nécessitant une force légère. Pas de mouvement relatif.",
    perm_cond: "Permanent (Ajustement pressé)",
    perm_desc: "Force importante requise. Ajustement pressé standard.",
    drive_cond: "Charge lourde (Serrage fort)",
    drive_desc: "Assemblage permanent pour couple/charge élevé.",
    type: "Type",
    explanation: "Pourquoi cet ajustement?",
    applications: "Applications typiques",
    assembly_method: "Méthode d'assemblage"
  },
  ar: {
    title: "مستشار التوافقات",
    subtitle: "أجب عن بعض الأسئلة للحصول على تفاوت ISO المثالي.",
    step1: "أي نظام تفضل؟",
    step2: "ما هي الوظيفة الأساسية؟",
    step3: "حدد المتطلبات المحددة:",
    result: "التوافق الموصى به",
    apply: "استخدم هذا التوافق",
    back: "رجوع",
    sys_general: "عام (موصى به)",
    sys_general_desc: "افتراضياً نظام أساس الثقب. الأفضل لمعظم التطبيقات.",
    sys_hole: "نظام أساس الثقب",
    sys_hole_desc: "مقاس الثقب ثابت (H). يتم تغيير تفاوت العمود.",
    sys_shaft: "نظام أساس العمود",
    sys_shaft_desc: "مقاس العمود ثابت (h). يتم تغيير تفاوت الثقب.",
    moving: "أجزاء متحركة",
    moving_desc: "العمود يدور أو ينزلق داخل الثقب",
    fixed: "تجميع ثابت",
    fixed_desc: "الأجزاء ثابتة بالنسبة لبعضها البعض",
    loose_cond: "سرعة عالية / حرارة / واسع",
    loose_desc: "خلوص كبير للتمدد الحراري أو الغبار.",
    running_cond: "تشغيلي / مزيت",
    running_desc: "توافق تشغيلي قياسي لصناديق التروس والمحركات.",
    prec_cond: "دقة / توجيه دقيق",
    prec_desc: "خلوص ضئيل لتحديد المواقع بدقة.",
    remove_cond: "قابل للفك (تجميع يدوي)",
    remove_desc: "يمكن تجميع/فك الأجزاء باليد.",
    rigid_cond: "صلب (طرق خفيف)",
    rigid_desc: "توافق محكم يتطلب قوة خفيفة. لا توجد حركة نسبية.",
    perm_cond: "دائم (تثبيت بالضغط)",
    perm_desc: "قوة كبيرة مطلوبة. تثبيت قياسي.",
    drive_cond: "خدمة شاقة (تثبيت بالدفع)",
    drive_desc: "تجميع دائم للأحمال العالية.",
    type: "النوع",
    explanation: "لماذا هذا التوافق؟",
    applications: "تطبيقات نموذجية",
    assembly_method: "طريقة التجميع"
  }
};

const RECOMMENDATIONS: Record<string, Record<Language, FitRecommendation>> = {
  'H9/d9': {
    en: { code: 'H9/d9', type: 'Clearance (Loose)', explanation: 'Provides a large gap to accommodate thermal expansion, misalignment, or dirt.', applications: 'Idler pulleys, agricultural machinery, pivots exposed to dust.', assembly: 'Hand assembly. Parts slide together very easily.' },
    de: { code: 'H9/d9', type: 'Spielpassung (Grob)', explanation: 'Bietet großes Spiel für Wärmedehnung oder Schmutz.', applications: 'Lose Riemenscheiben, Landmaschinen.', assembly: 'Handmontage. Teile gleiten sehr leicht.' },
    fr: { code: 'H9/d9', type: 'Jeu (Large)', explanation: 'Offre un grand jeu pour accommoder la dilatation thermique, le désalignement ou la saleté.', applications: 'Poulies folles, machines agricoles, pivots exposés à la poussière.', assembly: 'Montage manuel. Les pièces glissent très facilement.' },
    ar: { code: 'H9/d9', type: 'خلوص (واسع)', explanation: 'يوفر فجوة كبيرة لاستيعاب التمدد الحراري أو عدم المحاذاة.', applications: 'بكرات الخمول، الآلات الزراعية.', assembly: 'تجميع يدوي. تنزلق الأجزاء معًا بسهولة بالغة.' }
  },
  'H8/f7': {
    en: { code: 'H8/f7', type: 'Clearance (Running)', explanation: 'Good quality running fit. Suitable for continuous rotation with lubrication.', applications: 'Gearbox bearings, electric motors, pumps.', assembly: 'Hand assembly. Perceptible play but smooth.' },
    de: { code: 'H8/f7', type: 'Laufpassung', explanation: 'Gute Laufqualität. Geeignet für Dauerrotation mit Schmierung.', applications: 'Getriebelager, Elektromotoren, Pumpen.', assembly: 'Handmontage. Spürbares Spiel, aber weich.' },
    fr: { code: 'H8/f7', type: 'Jeu (Tournant)', explanation: 'Ajustement tournant de bonne qualité. Convient pour une rotation continue avec lubrification.', applications: 'Roulements de boîte de vitesses, moteurs électriques, pompes.', assembly: 'Montage manuel. Jeu perceptible mais mouvement fluide.' },
    ar: { code: 'H8/f7', type: 'خلوص (تشغيلي)', explanation: 'توافق تشغيلي ذو جودة جيدة. مناسب للدوران المستمر مع التزييت.', applications: 'محامل صناديق التروس، المحركات الكهربائية، المضخات.', assembly: 'تجميع يدوي. تلاعب ملحوظ ولكن سلس.' }
  },
  'H7/g6': {
    en: { code: 'H7/g6', type: 'Clearance (Sliding)', explanation: 'Precision running fit. Smallest effective clearance for accurate guiding but free movement.', applications: 'Sliding gears, clutch disks, machine tool spindles.', assembly: 'Hand assembly. Smooth sliding feel without perceptible play.' },
    de: { code: 'H7/g6', type: 'Spielpassung (Fein)', explanation: 'Präzisionslauf. Kleinstes Spiel für genaue Führung.', applications: 'Schieberäder, Kupplungsscheiben, Spindeln.', assembly: 'Handmontage. Weiches Gleiten ohne merkliches Spiel.' },
    fr: { code: 'H7/g6', type: 'Jeu (Glissant)', explanation: 'Ajustement de précision. Jeu effectif minimal pour un guidage précis mais un mouvement libre.', applications: 'Engrenages baladeurs, disques d\'embrayage, broches de machines-outils.', assembly: 'Montage manuel. Sensation de glissement doux sans jeu perceptible.' },
    ar: { code: 'H7/g6', type: 'خلوص (انزلاقي)', explanation: 'توافق تشغيل دقيق. أقل خلوص فعال للتوجيه الدقيق.', applications: 'التروس المنزلقة، أقراص القابض، مغازل الأدوات.', assembly: 'تجميع يدوي. شعور انزلاقي سلس دون تلاعب ملحوظ.' }
  },
  'H7/h6': {
    en: { code: 'H7/h6', type: 'Locational Clearance', explanation: 'Line-to-line fit. Theoretically zero clearance at extremes, but usually assembles by hand.', applications: 'Reference spigots, handwheels, pulleys requiring removal.', assembly: 'Hand assembly. Parts can be assembled and separated freely.' },
    de: { code: 'H7/h6', type: 'Positionierung (Spiel)', explanation: 'Null-Linie. Theoretisch kein Spiel, meist handmontierbar.', applications: 'Zentrierzapfen, Handräder, lösbare Riemenscheiben.', assembly: 'Handmontage. Teile frei fügbar.' },
    fr: { code: 'H7/h6', type: 'Jeu (Positionnement)', explanation: 'Ajustement ligne à ligne. Théoriquement jeu nul aux extrêmes, mais s\'assemble généralement à la main.', applications: 'Centrages de référence, volants, poulies nécessitant un démontage.', assembly: 'Montage manuel. Les pièces peuvent être assemblées et séparées librement.' },
    ar: { code: 'H7/h6', type: 'خلوص موضعي', explanation: 'توافق خط لخط. نظرياً لا يوجد خلوص، ولكن يجمع عادة باليد.', applications: 'سدادات التمركز، العجلات اليدوية.', assembly: 'تجميع يدوي. يمكن تجميع الأجزاء وفصلها بحرية.' }
  },
  'H7/k6': {
    en: { code: 'H7/k6', type: 'Transition', explanation: 'True transition. Can be slightly loose or slightly tight. Provides rigid location.', applications: 'Keyed gears, pulleys, inner bearing races.', assembly: 'Mallet or light mechanical press needed.' },
    de: { code: 'H7/k6', type: 'Übergangspassung', explanation: 'Kann leichtes Spiel oder Übermaß haben. Starre Positionierung.', applications: 'Zahnräder mit Passfeder, Lagerinnenringe.', assembly: 'Gummihammer oder leichte Presse.' },
    fr: { code: 'H7/k6', type: 'Incertain', explanation: 'Vrai ajustement incertain. Peut être légèrement libre ou légèrement serré. Assure une localisation rigide.', applications: 'Engrenages clavetés, poulies, bagues intérieures de roulements.', assembly: 'Maillet ou presse mécanique légère nécessaire.' },
    ar: { code: 'H7/k6', type: 'انتقالي', explanation: 'انتقالي حقيقي. يمكن أن يكون واسعاً قليلاً أو ضيقاً قليلاً.', applications: 'التروس ذات المفاتيح، حلقات المحامل الداخلية.', assembly: 'طرق خفيف أو مكبس ميكانيكي خفيف.' }
  },
  'H7/p6': {
    en: { code: 'H7/p6', type: 'Interference (Press Fit)', explanation: 'Standard interference. Parts become a single unit. Torque transmission relies on friction.', applications: 'Bushings in housings, standard hubs on shafts.', assembly: 'Heavy mechanical press or thermal assembly (heating hole/freezing shaft).' },
    de: { code: 'H7/p6', type: 'Presspassung', explanation: 'Standard-Übermaß. Teile werden eine Einheit.', applications: 'Buchsen in Gehäusen, Naben auf Wellen.', assembly: 'Schwere Presse oder thermische Montage.' },
    fr: { code: 'H7/p6', type: 'Serrage (Presse)', explanation: 'Serrage standard. Les pièces deviennent une seule unité. La transmission du couple repose sur la friction.', applications: 'Bagues dans les logements, moyeux standard sur arbres.', assembly: 'Presse mécanique lourde ou assemblage thermique (chauffage alésage/refroidissement arbre).' },
    ar: { code: 'H7/p6', type: 'تداخل (تثبيت بالضغط)', explanation: 'تداخل قياسي. تصبح الأجزاء وحدة واحدة.', applications: 'الجلب في الهيئات، المحاور القياسية.', assembly: 'مكبس ثقيل أو تجميع حراري.' }
  },
  'H7/s6': {
    en: { code: 'H7/s6', type: 'Interference (Heavy Drive)', explanation: 'Permanent assembly. Very high interference for maximum rigidity and torque.', applications: 'Railway wheels, heavy steel hubs, permanent couplings.', assembly: 'Hydraulic press or significant thermal difference required.' },
    de: { code: 'H7/s6', type: 'Treibpassung (Schwer)', explanation: 'Dauerhafte Montage. Sehr hohes Übermaß für maximale Steifigkeit.', applications: 'Eisenbahnräder, Stahlnaben, permanente Kupplungen.', assembly: 'Hydraulische Presse oder thermische Fügung.' },
    fr: { code: 'H7/s6', type: 'Serrage (Fort)', explanation: 'Assemblage permanent. Très fort serrage pour une rigidité et un couple maximaux.', applications: 'Roues ferroviaires, moyeux en acier lourds, accouplements permanents.', assembly: 'Presse hydraulique ou différence thermique significative requise.' },
    ar: { code: 'H7/s6', type: 'تداخل (تثبيت بالدفع)', explanation: 'تجميع دائم. تداخل عالي جداً لأقصى صلابة وعزم دوران.', applications: 'عجلات السكك الحديدية، محاور فولاذية ثقيلة.', assembly: 'مكبس هيدروليكي أو فرق حراري كبير مطلوب.' }
  }
};

const ASSEMBLY_DETAILS = {
  en: "• Hand Assembly: No force required. Used for Clearance fits.\n• Mallet/Light Press: Light force. Used for Transition fits.\n• Mechanical Press: High force required. Used for Interference fits.\n• Thermal (Shrink Fit): Heating the hole or cooling the shaft to allow assembly. Used for Heavy Interference.",
  de: "• Handmontage: Keine Kraft erforderlich. Für Spielpassungen.\n• Hammer/Presse: Leichte Kraft. Für Übergangspassungen.\n• Mechanische Presse: Hohe Kraft erforderlich. Für Übermaßpassungen.\n• Thermisch (Schrumpfsitz): Erhitzen der Bohrung oder Kühlen der Welle. Für starkes Übermaß.",
  fr: "• Montage manuel: Aucune force requise. Pour ajustements avec jeu.\n• Maillet/Presse légère: Force légère. Pour ajustements incertains.\n• Presse mécanique: Force élevée requise. Pour ajustements serrés.\n• Thermique (Frettage): Chauffage de l'alésage ou refroidissement de l'arbre. Pour serrage fort.",
  ar: "• تجميع يدوي: لا يتطلب قوة. يستخدم للتوافقات الخلوصية.\n• طرق خفيف/مكبس خفيف: قوة خفيفة. للتوافقات الانتقالية.\n• مكبس ميكانيكي: يتطلب قوة عالية. للتوافقات التداخلية.\n• حراري (تثبيت بالانكماش): تسخين الثقب أو تبريد العمود. للتداخل القوي."
};

const SHAFT_BASIS_MAPPING: Record<string, string> = {
  'H9/d9': 'D9/h9',
  'H8/f7': 'F8/h7',
  'H7/g6': 'G7/h6',
  'H7/h6': 'H7/h6',
  'H7/k6': 'K7/h6',
  'H7/p6': 'P7/h6',
  'H7/s6': 'S7/h6'
};

const InfoTooltip = ({ text }: { text: string }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block ml-2 align-middle">
      <button
        type="button"
        className="text-slate-400 hover:text-blue-500 cursor-help transition-colors outline-none flex items-center"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={(e) => { e.stopPropagation(); setShow(!show); }}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 dark:bg-slate-700 text-white text-[10px] leading-relaxed rounded-lg shadow-xl z-[60] pointer-events-none whitespace-pre-line text-left border border-slate-600">
           {text}
           <div className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-slate-800 dark:border-t-slate-700"></div>
        </div>
      )}
    </div>
  );
};

const FitAdvisor: React.FC<Props> = ({ isOpen, onClose, onSelectFit, language }) => {
  const [step, setStep] = useState(1);
  const [system, setSystem] = useState<'hole' | 'shaft' | 'general' | null>(null);
  const [movement, setMovement] = useState<'moving' | 'fixed' | null>(null);
  const [recommendationKey, setRecommendationKey] = useState<string | null>(null);

  const t = ADVISOR_TEXT[language];

  const reset = () => {
    setStep(1);
    setSystem(null);
    setMovement(null);
    setRecommendationKey(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const selectSystem = (sys: 'hole' | 'shaft' | 'general') => {
    setSystem(sys);
    setStep(2);
  };

  const selectMovement = (type: 'moving' | 'fixed') => {
    setMovement(type);
    setStep(3);
  };

  const selectSpecific = (key: string) => {
    setRecommendationKey(key);
    setStep(4);
  };

  const handleApply = () => {
    if (recommendationKey) {
        // If Shaft Basis selected, transform the key
        let finalKey = recommendationKey;
        if (system === 'shaft' && SHAFT_BASIS_MAPPING[recommendationKey]) {
            finalKey = SHAFT_BASIS_MAPPING[recommendationKey];
        }
        onSelectFit(finalKey);
        handleClose();
    }
  };

  if (!isOpen) return null;

  const renderContent = () => {
    if (step === 1) {
        return (
            <div className="grid grid-cols-1 gap-3">
                 <button onClick={() => selectSystem('general')} className="flex items-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left group">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg mr-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                        <Grid className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 dark:text-white">{t.sys_general}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.sys_general_desc}</p>
                    </div>
                    <ArrowRight className="ml-auto w-5 h-5 text-slate-300" />
                 </button>

                 <button onClick={() => selectSystem('hole')} className="flex items-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left group">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-lg mr-4 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors">
                        <Box className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 dark:text-white">{t.sys_hole}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.sys_hole_desc}</p>
                    </div>
                    <ArrowRight className="ml-auto w-5 h-5 text-slate-300" />
                 </button>

                 <button onClick={() => selectSystem('shaft')} className="flex items-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left group">
                    <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg mr-4 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors">
                        <Layers className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 dark:text-white">{t.sys_shaft}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.sys_shaft_desc}</p>
                    </div>
                    <ArrowRight className="ml-auto w-5 h-5 text-slate-300" />
                 </button>
            </div>
        );
    }

    if (step === 2) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={() => selectMovement('moving')} className="p-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group">
            <div className="bg-blue-100 dark:bg-blue-900/40 w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <RotateCw className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">{t.moving}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t.moving_desc}</p>
          </button>
          
          <button onClick={() => selectMovement('fixed')} className="p-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all text-left group">
            <div className="bg-orange-100 dark:bg-orange-900/40 w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Anchor className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">{t.fixed}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t.fixed_desc}</p>
          </button>
        </div>
      );
    }

    if (step === 3) {
      if (movement === 'moving') {
        return (
          <div className="grid grid-cols-1 gap-3">
             <button onClick={() => selectSpecific('H9/d9')} className="flex items-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left group">
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg mr-4 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                    <Thermometer className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">{t.loose_cond}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.loose_desc}</p>
                </div>
                <ArrowRight className="ml-auto w-5 h-5 text-slate-300" />
             </button>

             <button onClick={() => selectSpecific('H8/f7')} className="flex items-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left group">
                <div className="bg-teal-100 dark:bg-teal-900/30 p-3 rounded-lg mr-4 group-hover:bg-teal-200 dark:group-hover:bg-teal-900/50 transition-colors">
                    <Zap className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">{t.running_cond}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.running_desc}</p>
                </div>
                <ArrowRight className="ml-auto w-5 h-5 text-slate-300" />
             </button>

             <button onClick={() => selectSpecific('H7/g6')} className="flex items-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left group">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg mr-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                    <MousePointer2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">{t.prec_cond}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.prec_desc}</p>
                </div>
                <ArrowRight className="ml-auto w-5 h-5 text-slate-300" />
             </button>
          </div>
        );
      } else {
        return (
          <div className="grid grid-cols-1 gap-3">
             <button onClick={() => selectSpecific('H7/h6')} className="flex items-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left group">
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg mr-4 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                    <CheckCircle2 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">{t.remove_cond}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.remove_desc}</p>
                </div>
                <ArrowRight className="ml-auto w-5 h-5 text-slate-300" />
             </button>

             <button onClick={() => selectSpecific('H7/k6')} className="flex items-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left group">
                <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg mr-4 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/50 transition-colors">
                    <Hammer className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">{t.rigid_cond}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.rigid_desc}</p>
                </div>
                <ArrowRight className="ml-auto w-5 h-5 text-slate-300" />
             </button>

             <button onClick={() => selectSpecific('H7/p6')} className="flex items-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left group">
                <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg mr-4 group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
                    <Anchor className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">{t.perm_cond}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.perm_desc}</p>
                </div>
                <ArrowRight className="ml-auto w-5 h-5 text-slate-300" />
             </button>

             <button onClick={() => selectSpecific('H7/s6')} className="flex items-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left group">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg mr-4 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                    <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">{t.drive_cond}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.drive_desc}</p>
                </div>
                <ArrowRight className="ml-auto w-5 h-5 text-slate-300" />
             </button>
          </div>
        );
      }
    }

    if (step === 4 && recommendationKey) {
        const rec = RECOMMENDATIONS[recommendationKey][language];
        let displayCode = rec.code;
        
        // Transform display code if Shaft Basis
        if (system === 'shaft' && SHAFT_BASIS_MAPPING[recommendationKey]) {
            displayCode = SHAFT_BASIS_MAPPING[recommendationKey];
        }

        return (
            <div className="animate-in fade-in zoom-in duration-300">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 rounded-xl p-6 mb-6 text-center">
                    <div className="text-sm text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mb-2">{t.result}</div>
                    <div className="text-4xl font-mono font-bold text-slate-900 dark:text-white mb-2">{displayCode}</div>
                    <div className="inline-block px-3 py-1 rounded-full bg-white dark:bg-slate-800 text-xs font-bold shadow-sm">{rec.type}</div>
                </div>

                <div className="space-y-4">
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t.explanation}</h4>
                        <p className="text-sm text-slate-800 dark:text-slate-200">{rec.explanation}</p>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t.applications}</h4>
                        <p className="text-sm text-slate-800 dark:text-slate-200">{rec.applications}</p>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center">
                            {t.assembly_method}
                            <InfoTooltip text={ASSEMBLY_DETAILS[language]} />
                        </h4>
                        <div className="flex items-start gap-2">
                             <Hammer className="w-4 h-4 text-slate-400 mt-0.5" />
                             <p className="text-sm text-slate-800 dark:text-slate-200">{rec.assembly}</p>
                        </div>
                    </div>
                </div>

                <button onClick={handleApply} className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2">
                    {t.apply}
                    <CheckCircle2 className="w-5 h-5" />
                </button>
            </div>
        )
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900">
            <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-blue-500" />
                    {t.title}
                </h2>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
            </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-100 dark:bg-slate-800 w-full">
            <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
            />
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                    {step === 1 ? t.step1 : step === 2 ? t.step2 : step === 3 ? t.step3 : ''}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                    {step === 1 ? t.subtitle : ''}
                </p>
            </div>
            
            {renderContent()}
        </div>

        {/* Footer (Back Button) */}
        {step > 1 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-start">
                <button onClick={() => setStep(step - 1)} className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                    ← {t.back}
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default FitAdvisor;