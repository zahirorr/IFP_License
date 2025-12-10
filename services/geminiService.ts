import { GoogleGenAI, Type, Schema } from "@google/genai";
import { IsoCalculationResponse, CalculationMode } from '../types';

const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    nominal_size: { type: Type.NUMBER, description: "Nominal size in mm" },
    hole: {
      type: Type.OBJECT,
      properties: {
        grade: { type: Type.STRING },
        es: { type: Type.NUMBER, description: "Upper deviation in microns (integer)" },
        ei: { type: Type.NUMBER, description: "Lower deviation in microns (integer)" },
        max_size: { type: Type.NUMBER, description: "Max limit in mm (3 decimal places)" },
        min_size: { type: Type.NUMBER, description: "Min limit in mm (3 decimal places)" },
        it_grade_value: { type: Type.NUMBER, description: "Tolerance interval in microns" }
      },
      required: ["grade", "es", "ei", "max_size", "min_size", "it_grade_value"]
    },
    shaft: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        grade: { type: Type.STRING },
        es: { type: Type.NUMBER, description: "Upper deviation in microns (integer)" },
        ei: { type: Type.NUMBER, description: "Lower deviation in microns (integer)" },
        max_size: { type: Type.NUMBER, description: "Max limit in mm (3 decimal places)" },
        min_size: { type: Type.NUMBER, description: "Min limit in mm (3 decimal places)" },
        it_grade_value: { type: Type.NUMBER, description: "Tolerance interval in microns" }
      },
      required: ["grade", "es", "ei", "max_size", "min_size", "it_grade_value"]
    },
    fit: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        type: { type: Type.STRING, enum: ["Clearance", "Transition", "Interference"] },
        max_clearance: { type: Type.NUMBER, description: "microns" },
        min_clearance: { type: Type.NUMBER, description: "microns" },
        max_interference: { type: Type.NUMBER, description: "microns" },
        min_interference: { type: Type.NUMBER, description: "microns" },
        description: { type: Type.STRING }
      },
      required: ["type", "description"]
    },
    recommendation: { type: Type.STRING, description: "Short engineering recommendation" },
    iso_standard: { type: Type.STRING, description: "Reference standard (e.g., ISO 286-1:2010)" },
    text_summary: { type: Type.STRING, description: "A formatted text summary of the results suitable for copying." }
  },
  required: ["nominal_size", "hole", "recommendation", "iso_standard", "text_summary"]
};

export const calculateTolerance = async (
  nominal: number,
  mode: CalculationMode,
  holeGrade: string,
  shaftGrade?: string
): Promise<IsoCalculationResponse> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const prompt = `
    You are an expert mechanical design assistant specialized in ISO 286.
    
    Task: Calculate ISO tolerances and fits.
    Input: Nominal Size: ${nominal}mm.
    Mode: ${mode === CalculationMode.FIT ? `Fit Calculation (Hole: ${holeGrade}, Shaft: ${shaftGrade})` : `Single Tolerance (Grade: ${holeGrade})`}.
    
    Requirements:
    1. Calculate Upper Deviation (ES/es) and Lower Deviation (EI/ei) in microns.
    2. Calculate Max/Min sizes in mm.
    3. If Fit mode, determine Fit Type (Clearance, Transition, Interference) and the range (microns).
    4. Provide a professional engineering recommendation.
    5. Return strict JSON matching the schema.
    6. Ensure 'text_summary' follows this format:
       Nominal Size: XX mm
       Tolerance Zone [Hole/Shaft]:
       - Upper deviation: ...
       - Lower deviation: ...
       Limits:
       - Max: ...
       - Min: ...
       [If Fit] Fit Result: ...
       Recommendation: ...
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1 // Low temperature for precise calculations
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text) as IsoCalculationResponse;
  } catch (error) {
    console.error("Gemini Calculation Error:", error);
    throw error;
  }
};