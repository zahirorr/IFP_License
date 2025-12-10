import { IsoCalculationResponse, CalculationMode, FitResult, ToleranceDetail } from '../types';

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


// --- HELPER FUNCTIONS ---

function getRangeIndex(nominal: number): number {
  if (nominal <= 0 || nominal > 500) return -1;
  // Ranges are (min, max]
  // 0-3, 3-6, etc.
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

  // Get IT Value
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
    
    // Logic for Shafts
    // a-h: Fundamental Deviation is 'es'. ei = es - IT.
    // j-zc: Fundamental Deviation is 'ei'. es = ei + IT.
    
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
    // Hole Logic
    const devTable = HOLE_DEVIATIONS[letter.toUpperCase()];
    // Fallback for standard Hole H if not found, but we enforce lookup
    if (!devTable) {
        // Simple fallback for testing if user enters 'J' or something not in my small table
        if (letter.toUpperCase() === 'H') {
             ei = 0;
             es = it;
        } else {
             throw new Error(`Unsupported Hole Deviation: ${letter}`);
        }
    } else {
        const fundDev = devTable[rangeIdx];
        const letterCode = letter.toUpperCase();

        // A-H: Fundamental is EI. ES = EI + IT.
        // J-ZC: Fundamental is ES. EI = ES - IT.
        if (['F', 'G', 'H'].includes(letterCode)) {
            ei = fundDev;
            es = ei + it;
        } else {
            es = fundDev;
            ei = es - it;
        }
    }
  }

  // Force strict ISO casing for display (Upper for Hole, Lower for Shaft)
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

function getFitRecommendation(hole: string, shaft: string, type: string): string {
    const h = hole.toUpperCase();
    const s = shaft.toLowerCase();
    
    if (h.startsWith('H')) {
        if (s.startsWith('h')) return "Locational Clearance Fit - Parts assemble freely.";
        if (s.startsWith('g')) return "Precision Sliding Fit - Parts move/slide accurately.";
        if (s.startsWith('f')) return "Running Fit - Good for lubrication.";
        if (s.startsWith('e')) return "Loose Running Fit - Noticeable clearance.";
        if (s.startsWith('k')) return "Locational Transition Fit - Accurate location, compromise between clearance and interference.";
        if (s.startsWith('m')) return "Transition Fit - Tight, possible slight interference. Assemble with mallet.";
        if (s.startsWith('n')) return "Transition/Interference - Fixed location.";
        if (s.startsWith('p')) return "Locational Interference Fit - Press fit for rigid location.";
        if (s.startsWith('s')) return "Medium Drive Fit - Permanent assembly.";
    }
    
    if (type === 'Clearance') return "Parts will slide or run freely.";
    if (type === 'Interference') return "Parts require force or thermal expansion to assemble.";
    return "Parts may slide or stick; requires careful assembly.";
}

export const calculateTolerance = async (
  nominal: number,
  mode: CalculationMode,
  holeGrade: string,
  shaftGrade?: string
): Promise<IsoCalculationResponse> => {
  
  // Artificial small delay to simulate calculation/process feel
  await new Promise(resolve => setTimeout(resolve, 300));

  const holeTol = calculateComponentTolerance(nominal, holeGrade, false);
  let shaftTol: ToleranceDetail | null = null;
  let fitResult: FitResult | null = null;

  if (mode === CalculationMode.FIT && shaftGrade) {
    shaftTol = calculateComponentTolerance(nominal, shaftGrade, true);

    const maxClearance = holeTol.es - shaftTol.ei;
    const minClearance = holeTol.ei - shaftTol.es;
    
    // Interpretation:
    // If minClearance >= 0 -> Clearance Fit
    // If maxClearance <= 0 -> Interference Fit (values will be negative)
    // If crosses zero -> Transition

    let type: FitResult['type'] = 'Transition';
    let description = "";

    if (minClearance >= 0) {
        type = 'Clearance';
        description = `Always a gap. Max gap: ${maxClearance}µm, Min gap: ${minClearance}µm.`;
    } else if (maxClearance <= 0) {
        type = 'Interference';
        // Convert to positive interference values for display usually, 
        // but math-wise max interference corresponds to min algebraic clearance
        description = `Always tight. Max interference: ${Math.abs(minClearance)}µm, Min interference: ${Math.abs(maxClearance)}µm.`;
    } else {
        type = 'Transition';
        description = `Can be loose or tight. Max clearance: ${maxClearance}µm, Max interference: ${Math.abs(minClearance)}µm.`;
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
    ? getFitRecommendation(holeGrade, shaftGrade || '', fitType) 
    : "Standard ISO 286 tolerance zone.";

  // Generate text summary
  let summary = `Nominal Size: ${nominal} mm\n\n`;
  summary += `Hole [${holeTol.grade}]:\n`;
  summary += `- Upper dev (ES): ${holeTol.es > 0 ? '+' : ''}${holeTol.es} µm\n`;
  summary += `- Lower dev (EI): ${holeTol.ei > 0 ? '+' : ''}${holeTol.ei} µm\n`;
  summary += `- Limits: ${holeTol.min_size.toFixed(3)} - ${holeTol.max_size.toFixed(3)} mm\n\n`;

  if (shaftTol && fitResult) {
      summary += `Shaft [${shaftTol.grade}]:\n`;
      summary += `- Upper dev (es): ${shaftTol.es > 0 ? '+' : ''}${shaftTol.es} µm\n`;
      summary += `- Lower dev (ei): ${shaftTol.ei > 0 ? '+' : ''}${shaftTol.ei} µm\n`;
      summary += `- Limits: ${shaftTol.min_size.toFixed(3)} - ${shaftTol.max_size.toFixed(3)} mm\n\n`;
      
      summary += `Fit Result: ${fitResult.type}\n`;
      summary += `${fitResult.description}\n`;
      summary += `Recommendation: ${recommendation}`;
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