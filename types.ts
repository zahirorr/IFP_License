export interface ToleranceDetail {
  grade: string;
  es: number; // Upper deviation (microns)
  ei: number; // Lower deviation (microns)
  max_size: number; // mm
  min_size: number; // mm
  it_grade_value: number; // microns
}

export interface FitResult {
  type: 'Clearance' | 'Transition' | 'Interference';
  max_clearance?: number; // microns
  min_clearance?: number; // microns
  max_interference?: number; // microns
  min_interference?: number; // microns
  description: string;
}

export interface IsoCalculationResponse {
  nominal_size: number;
  hole?: ToleranceDetail | null;
  shaft?: ToleranceDetail | null;
  fit?: FitResult | null;
  recommendation: string;
  iso_standard: string;
  text_summary: string; // The specific formatted output requested by the prompt
}

export enum CalculationMode {
  SINGLE = 'SINGLE',
  FIT = 'FIT'
}

export type Language = 'en' | 'de' | 'ar';
