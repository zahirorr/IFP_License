import { IsoCalculationResponse, CalculationMode, FitResult, ToleranceDetail, Language } from '../types';

// --- ISO 286 DATA TABLES (Subset for common engineering use) ---

// Range upper limits (mm). (Lower limit is the previous value, starting at 0)
const RANGES = [3, 6, 10, 18, 30, 50, 80, 120, 180, 250, 315, 400, 500];

// Standard Tolerance (IT) Values in microns
// Rows: IT Grades (5, 6, 7, 8, 9, 10, 11)
// Cols: Corresponding to RANGES
const IT_TABLE: Record<string, number[]> = {
  '5': [4, 5, 6, 8, 9, 11, 13, 15, 18, 20, 23, 25, 27],
  '6': [6, 8, 9, 11, 13, 16, 19, 22, 25, 29, 32, 36, 40],
  '7': [10, 12, 15, 18, 21, 25, 30, 35, 40, 46, 52, 57, 63],
  '8': [14, 18, 22, 27, 33, 39, 46, 54, 63, 72, 81, 89, 97],
  '9': [25, 30, 36, 43, 52, 62, 74, 87, 100, 115, 130, 140, 155],
  '10': [40, 48, 58, 70, 84, 100, 120, 140, 160, 185, 210, 230, 250],
  '11': [60, 75, 90, 110, 130, 160, 190, 220, 250, 290, 320, 360, 400],
};

// Fundamental Deviations for SHAFTS (microns)
// Value depends on position letter. 
// For a-h, value is 'es' (Upper Deviation). 
// For j-zc, value is 'ei' (Lower Deviation).
const SHAFT_DEVIATIONS: Record<string, number[]> = {
  'd': [-20, -30, -40, -50, -65, -80, -100, -120, -145, -170, -190, -210, -230], // es
  'e': [-14, -20, -25, -32, -40, -50, -60, -72, -85, -100, -110, -125, -135],   // es
  'f': [-6, -10, -13, -16, -20, -25, -30, -36, -43, -50, -56, -62, -68],        // es
  'g': [-2, -4, -5, -6, -9, -9, -10, -12, -14, -15, -17, -18, -20],             // es
  'h': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],                                 // es
  'k': [0, 0, 1, 1, 2, 2, 2, 3, 3, 4, 4, 4, 5],                                 // ei (Note: simplified, usually depends on IT grade for k)
  'm': [2, 4, 6, 7, 8, 9, 11, 13, 15, 17, 20, 21, 23],                          // ei
  'n': [4, 8, 10, 12, 15, 17, 20, 23, 27, 31, 34, 37, 40],                      // ei
  'p': [6, 12, 15, 18, 22, 26, 32, 37, 43, 50, 56, 62, 68],                     // ei
  'r': [10, 15, 19, 23, 28, 34, 41, 43, 51, 60, 66, 75, 82],                    // ei
  's': [14, 19, 23, 28, 35, 43, 53, 59, 79, 87, 100, 115, 130]                  // ei
};

// Fundamental Deviations for HOLES (microns)
// Value is 'EI' (Lower Deviation) for A-H.
// Value is 'ES' (Upper Deviation) for J-ZC.
const HOLE_DEVIATIONS: Record<string, number[]> = {
  'H': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // EI
  'F': [6, 10, 13, 16, 20, 25, 30, 36, 43, 50, 56, 62, 68], // EI
  'G': [2, 4, 5, 6, 9, 9, 10, 12, 14, 15, 17, 18, 20], // EI
  'P': [-6, -12, -15, -18, -22, -26, -32, -37, -43, -50, -56, -62, -68], // ES
  'N': [-4, -8, -10, -12, -15, -17, -20, -23, -27, -31, -34, -37, -40] // ES
};

// --- EXPORTS FOR UI DROPDOWNS ---
export const SUPPORTED_IT_GRADES = ['5', '6', '7', '8', '9', '10', '11'];
export const SUPPORTED_HOLE_LETTERS = ['H', 'F', 'G', 'N', 'P'];
export const SUPPORTED_SHAFT_LETTERS = ['d', 'e', 'f', 'g', 'h', 'k', 'm', 'n', 'p', 'r', 's'];

// --- TRANSLATION MAPS ---
const TERMS = {
  en: {
    nominal: "Nominal Size",
    hole: "Hole",
    shaft: "Shaft",
    upper: "Upper dev",
    lower: "Lower dev",
    limits: "Limits",
    fit_result: "Fit Result",
    rec: "Recommendation",
    clearance: "Clearance",
    interference: "Interference",
    transition: "Transition",
    gap: "Always a gap",
    tight: "Always tight",
    mixed: "Can be loose or tight",
    max_gap: "Max gap",
    min_gap: "Min gap",
    max_int: "Max interference",
    min_int: "Min interference",
    max_clearance: "Max clearance",
    default_rec: "Standard ISO 286 tolerance zone."
  },
  de: {
    nominal: "Nennmaß",
    hole: "Bohrung",
    shaft: "Welle",
    upper: "Oberes Abmaß",
    lower: "Unteres Abmaß",
    limits: "Grenzmaße",
    fit_result: "Passungsergebnis",
    rec: "Empfehlung",
    clearance: "Spiel",
    interference: "Übermaß",
    transition: "Übergang",
    gap: "Immer Spiel",
    tight: "Immer Übermaß",
    mixed: "Spiel oder Übermaß möglich",
    max_gap: "Max Spiel",
    min_gap: "Min Spiel",
    max_int: "Max Übermaß",
    min_int: "Min Übermaß",
    max_clearance: "Max Spiel",
    default_rec: "Standard ISO 286 Toleranzfeld."
  },
  ar: {
    nominal: "المقاس الاسمي",
    hole: "الثقب",
    shaft: "العمود",
    upper: "الانحراف العلوي",
    lower: "الانحراف السفلي",
    limits: "الحدود",
    fit_result: "نتيجة الازدواج",
    rec: "التوصية",
    clearance: "خلوص",
    interference: "تداخل",
    transition: "انتقالي",
    gap: "فجوة دائماً",
    tight: "تداخل دائماً",
    mixed: "يمكن أن يكون خلوصاً أو تداخلاً",
    max_gap: "أقصى خلوص",
    min_gap: "أقل خلوص",
    max_int: "أقصى تداخل",
    min_int: "أقل تداخل",
    max_clearance: "أقصى خلوص",
    default_rec: "منطقة تفاوت ISO 286 قياسية."
  }
};

const REC_TEMPLATES: Record<string, Record<Language, string>> = {
    h_h: {
        en: "Locational Clearance Fit - Parts assemble freely.",
        de: "Spielpassung - Teile lassen sich frei montieren.",
        ar: "ازدواج خلوصي موضعي - تجميع الأجزاء بحرية."
    },
    h_g: {
        en: "Precision Sliding Fit - Parts move/slide accurately.",
        de: "Präzisions-Gleitpassung - Teile bewegen/gleiten genau.",
        ar: "ازدواج انزلاقي دقيق - الأجزاء تتحرك/تنزلق بدقة."
    },
    h_f: {
        en: "Running Fit - Good for lubrication.",
        de: "Laufpassung - Gut für Schmierung.",
        ar: "ازدواج تشغيلي - جيد للتزييت."
    },
    h_e: {
        en: "Loose Running Fit - Noticeable clearance.",
        de: "Lockere Laufpassung - Merkliches Spiel.",
        ar: "ازدواج تشغيلي واسع - خلوص ملحوظ."
    },
    h_k: {
        en: "Locational Transition Fit - Accurate location.",
        de: "Übergangspassung - Genaue Positionierung.",
        ar: "ازدواج انتقالي موضعي - تحديد موقع دقيق."
    },
    h_m: {
        en: "Transition Fit - Tight, possible slight interference.",
        de: "Übergangspassung - Fest, mögliches leichtes Übermaß.",
        ar: "ازدواج انتقالي - محكم، احتمال تداخل طفيف."
    },
    h_n: {
        en: "Transition/Interference - Fixed location.",
        de: "Übergang/Übermaß - Feste Positionierung.",
        ar: "ازدواج انتقالي/تداخلي - موقع ثابت."
    },
    h_p: {
        en: "Locational Interference Fit - Press fit.",
        de: "Presspassung - Feste Positionierung.",
        ar: "ازدواج تداخلي موضعي - تثبيت بالضغط."
    },
    h_s: {
        en: "Medium Drive Fit - Permanent assembly.",
        de: "Mittelstarke Treibpassung - Dauerhafte Montage.",
        ar: "ازدواج دفع متوسط - تجميع دائم."
    }
};

const GENERIC_REC = {
    Clearance: {
        en: "Parts will slide or run freely.",
        de: "Teile gleiten oder laufen frei.",
        ar: "الأجزاء ستنزلق أو تتحرك بحرية."
    },
    Interference: {
        en: "Parts require force or thermal expansion to assemble.",
        de: "Montage erfordert Kraft oder Wärmeausdehnung.",
        ar: "تتطلب الأجزاء قوة أو تمدداً حرارياً للتجميع."
    },
    Transition: {
        en: "Parts may slide or stick; requires careful assembly.",
        de: "Teile können gleiten oder klemmen; erfordert sorgfältige Montage.",
        ar: "قد تنزلق الأجزاء أو تلتصق؛ يتطلب تجميعاً دقيقاً."
    },
    Unknown: {
        en: "Standard ISO 286 tolerance zone.",
        de: "Standard ISO 286 Toleranzfeld.",
        ar: "منطقة تفاوت ISO 286 قياسية."
    }
};


// --- HELPER FUNCTIONS ---

function getRangeIndex(nominal: number): number {
  if (nominal <= 0 || nominal > 500) return -1;
  if (nominal <= 3) return 0;
  for (let i = 1; i < RANGES.length; i++) {
    if (nominal <= RANGES[i] && nominal > RANGES[i-1]) return i;
  }
  return -1;
}

function parseGrade(gradeStr: string) {
  const match = gradeStr.match(/^([a-zA-Z]+)(\d+)$/);
  if (!match) return null;
  return {
    letter: match[1],
    gradeNum: match[2]
  };
}

function calculateComponentTolerance(nominal: number, gradeStr: string, isShaft: boolean): ToleranceDetail {
  const rangeIdx = getRangeIndex(nominal);
  if (rangeIdx === -1) {
    throw new Error(`Nominal size ${nominal}mm is outside supported range (0-500mm)`);
  }

  const parsed = parseGrade(gradeStr);
  if (!parsed) {
    throw new Error(`Invalid grade format: ${gradeStr}. Expected Letter+Number (e.g., H7, g6)`);
  }
  const { letter, gradeNum } = parsed;

  const itValues = IT_TABLE[gradeNum];
  if (!itValues) {
    throw new Error(`Unsupported IT Grade: ${gradeNum}. Supported: 5, 6, 7, 8, 9, 10, 11`);
  }
  const it = itValues[rangeIdx];

  let es = 0;
  let ei = 0;

  if (isShaft) {
    const devTable = SHAFT_DEVIATIONS[letter.toLowerCase()];
    if (!devTable) throw new Error(`Unsupported Shaft Deviation: ${letter}`);
    
    const fundDev = devTable[rangeIdx];
    const letterCode = letter.toLowerCase();
    
    if (['d', 'e', 'f', 'g', 'h'].includes(letterCode)) {
      es = fundDev;
      ei = es - it;
    } else {
      ei = fundDev;
      es = ei + it;
    }
  } else {
    const devTable = HOLE_DEVIATIONS[letter.toUpperCase()];
    if (!devTable) {
        if (letter.toUpperCase() === 'H') {
             ei = 0;
             es = it;
        } else {
             throw new Error(`Unsupported Hole Deviation: ${letter}`);
        }
    } else {
        const fundDev = devTable[rangeIdx];
        const letterCode = letter.toUpperCase();

        if (['F', 'G', 'H'].includes(letterCode)) {
            ei = fundDev;
            es = ei + it;
        } else {
            es = fundDev;
            ei = es - it;
        }
    }
  }

  const displayGrade = isShaft 
    ? `${letter.toLowerCase()}${gradeNum}` 
    : `${letter.toUpperCase()}${gradeNum}`;

  return {
    grade: displayGrade,
    es: es,
    ei: ei,
    max_size: nominal + (es / 1000),
    min_size: nominal + (ei / 1000),
    it_grade_value: it
  };
}

function getFitRecommendation(hole: string, shaft: string, type: string, lang: Language): string {
    const h = hole.toUpperCase();
    const s = shaft.toLowerCase();
    
    if (h.startsWith('H')) {
        const key = `h_${s.charAt(0)}`;
        if (REC_TEMPLATES[key]) {
            return REC_TEMPLATES[key][lang];
        }
    }
    
    const safeType = (type === 'Clearance' || type === 'Interference' || type === 'Transition') ? type : 'Unknown';
    return GENERIC_REC[safeType][lang];
}

export const calculateTolerance = async (
  nominal: number,
  mode: CalculationMode,
  grade1: string,
  grade2: string | undefined,
  language: Language = 'en'
): Promise<IsoCalculationResponse> => {
  
  // Artificial small delay
  await new Promise(resolve => setTimeout(resolve, 300));

  const t = TERMS[language];
  
  let holeTol: ToleranceDetail | undefined | null = null;
  let shaftTol: ToleranceDetail | undefined | null = null;
  let fitResult: FitResult | null = null;

  if (mode === CalculationMode.FIT && grade2) {
    // In FIT mode, we assume grade1 is Hole, grade2 is Shaft
    holeTol = calculateComponentTolerance(nominal, grade1, false);
    shaftTol = calculateComponentTolerance(nominal, grade2, true);
  } else {
    // SINGLE Mode
    // Check if grade1 is shaft (lowercase)
    const firstChar = grade1.charAt(0);
    const isShaft = firstChar === firstChar.toLowerCase() && firstChar !== firstChar.toUpperCase();
    
    if (isShaft) {
        shaftTol = calculateComponentTolerance(nominal, grade1, true);
        holeTol = null;
    } else {
        holeTol = calculateComponentTolerance(nominal, grade1, false);
        shaftTol = null;
    }
  }

  if (mode === CalculationMode.FIT && holeTol && shaftTol) {
    const maxClearance = holeTol.es - shaftTol.ei;
    const minClearance = holeTol.ei - shaftTol.es;
    
    let type: FitResult['type'] = 'Transition';
    let description = "";

    // Fit Logic
    if (minClearance >= 0) {
        type = 'Clearance';
        description = `${t.gap}. ${t.max_gap}: ${maxClearance}µm, ${t.min_gap}: ${minClearance}µm.`;
    } else if (maxClearance <= 0) {
        type = 'Interference';
        description = `${t.tight}. ${t.max_int}: ${Math.abs(minClearance)}µm, ${t.min_int}: ${Math.abs(maxClearance)}µm.`;
    } else {
        type = 'Transition';
        description = `${t.mixed}. ${t.max_clearance}: ${maxClearance}µm, ${t.max_int}: ${Math.abs(minClearance)}µm.`;
    }

    fitResult = {
        type,
        max_clearance: maxClearance > 0 ? maxClearance : undefined,
        min_clearance: minClearance > 0 ? minClearance : undefined,
        max_interference: minClearance < 0 ? Math.abs(minClearance) : undefined,
        min_interference: maxClearance < 0 ? Math.abs(maxClearance) : undefined,
        description
    };
  }

  const fitType = fitResult ? fitResult.type : 'Unknown';
  const recommendation = fitResult 
    ? getFitRecommendation(grade1, grade2 || '', fitType, language) 
    : t.default_rec;

  // Generate text summary in requested language
  let summary = `${t.nominal}: ${nominal} mm\n\n`;
  
  if (holeTol) {
      summary += `${t.hole} [${holeTol.grade}]:\n`;
      summary += `- ${t.upper} (ES): ${holeTol.es > 0 ? '+' : ''}${holeTol.es} µm\n`;
      summary += `- ${t.lower} (EI): ${holeTol.ei > 0 ? '+' : ''}${holeTol.ei} µm\n`;
      summary += `- ${t.limits}: ${holeTol.min_size.toFixed(3)} - ${holeTol.max_size.toFixed(3)} mm\n\n`;
  }
  
  if (shaftTol) {
      summary += `${t.shaft} [${shaftTol.grade}]:\n`;
      summary += `- ${t.upper} (es): ${shaftTol.es > 0 ? '+' : ''}${shaftTol.es} µm\n`;
      summary += `- ${t.lower} (ei): ${shaftTol.ei > 0 ? '+' : ''}${shaftTol.ei} µm\n`;
      summary += `- ${t.limits}: ${shaftTol.min_size.toFixed(3)} - ${shaftTol.max_size.toFixed(3)} mm\n\n`;
  }

  if (fitResult) {
      const translatedFitType = fitResult.type === 'Clearance' ? t.clearance : fitResult.type === 'Interference' ? t.interference : t.transition;

      summary += `${t.fit_result}: ${translatedFitType}\n`;
      summary += `${fitResult.description}\n`;
      summary += `${t.rec}: ${recommendation}`;
  }

  return {
    nominal_size: nominal,
    hole: holeTol,
    shaft: shaftTol,
    fit: fitResult,
    recommendation,
    iso_standard: "ISO 286-1:2010 (Local Calculation)",
    text_summary: summary
  };
};