import type { NutritionEstimate } from '../../utils/nutritionCalculator';

export interface NutritionRowData {
  label: string;
  perServing: string;
  total: string;
  indented?: boolean;
  emphasized?: boolean;
}

export interface RecipeExportState {
  title: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  usedIngredients: string[];
  removedIngredients: string[];
  instructions: string[];
  equipment: string[];
  nutritionEstimate: NutritionEstimate;
}

export type ToastTone = 'success' | 'info' | 'warning';
export type SubmitReason = 'format' | 'swap';
