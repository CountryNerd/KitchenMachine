import { nutritionCatalog, NutritionCatalogItem, NutritionValues } from '../data/nutritionData';

const CUP_IN_ML = 236.588;
const OUNCE_IN_GRAMS = 28.3495;
const POUND_IN_GRAMS = 453.592;

const FRACTION_MAP: Record<string, string> = {
  '¼': ' 1/4',
  '½': ' 1/2',
  '¾': ' 3/4',
  '⅐': ' 1/7',
  '⅑': ' 1/9',
  '⅒': ' 1/10',
  '⅓': ' 1/3',
  '⅔': ' 2/3',
  '⅕': ' 1/5',
  '⅖': ' 2/5',
  '⅗': ' 3/5',
  '⅘': ' 4/5',
  '⅙': ' 1/6',
  '⅚': ' 5/6',
  '⅛': ' 1/8',
  '⅜': ' 3/8',
  '⅝': ' 5/8',
  '⅞': ' 7/8'
};

export interface NutritionIngredientEstimate {
  original: string;
  matchedIngredient: string;
  grams: number;
  nutrition: NutritionValues;
}

export interface NutritionEstimate {
  servingsCount: number | null;
  servingsText: string | null;
  totalNutrition: NutritionValues;
  perServingNutrition: NutritionValues;
  matchedIngredients: NutritionIngredientEstimate[];
  unmatchedIngredients: string[];
  totalIngredientCount: number;
  matchedIngredientCount: number;
}

function emptyNutrition(): NutritionValues {
  return {
    calories: 0,
    fat: 0,
    saturatedFat: 0,
    carbs: 0,
    fiber: 0,
    sugar: 0,
    protein: 0,
    sodium: 0
  };
}

function addNutrition(base: NutritionValues, addition: NutritionValues): NutritionValues {
  return {
    calories: base.calories + addition.calories,
    fat: base.fat + addition.fat,
    saturatedFat: base.saturatedFat + addition.saturatedFat,
    carbs: base.carbs + addition.carbs,
    fiber: base.fiber + addition.fiber,
    sugar: base.sugar + addition.sugar,
    protein: base.protein + addition.protein,
    sodium: base.sodium + addition.sodium
  };
}

function scaleNutrition(values: NutritionValues, factor: number): NutritionValues {
  return {
    calories: values.calories * factor,
    fat: values.fat * factor,
    saturatedFat: values.saturatedFat * factor,
    carbs: values.carbs * factor,
    fiber: values.fiber * factor,
    sugar: values.sugar * factor,
    protein: values.protein * factor,
    sodium: values.sodium * factor
  };
}

function normalizeFractions(text: string): string {
  return Array.from(text).map((character) => FRACTION_MAP[character] ?? character).join('');
}

function normalizeForMatch(text: string): string {
  return normalizeFractions(text)
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseQuantityToken(token: string): number {
  const trimmed = token.trim();

  const mixedFractionMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedFractionMatch) {
    const whole = Number(mixedFractionMatch[1]);
    const numerator = Number(mixedFractionMatch[2]);
    const denominator = Number(mixedFractionMatch[3]);
    return whole + (numerator / denominator);
  }

  const fractionMatch = trimmed.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const numerator = Number(fractionMatch[1]);
    const denominator = Number(fractionMatch[2]);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  return Number.parseFloat(trimmed);
}

function extractLeadingQuantity(text: string): { quantity: number | null; rest: string } {
  const normalizedText = normalizeFractions(text).trim();

  const rangeMatch = normalizedText.match(
    /^((?:\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?)\s*(?:-|to)\s*((?:\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?)(?=\s|$)/i
  );
  if (rangeMatch) {
    const start = parseQuantityToken(rangeMatch[1]);
    const end = parseQuantityToken(rangeMatch[2]);
    return {
      quantity: (start + end) / 2,
      rest: normalizedText.slice(rangeMatch[0].length).trim()
    };
  }

  const mixedFractionMatch = normalizedText.match(/^(\d+\s+\d+\/\d+)(?=\s|$)/);
  if (mixedFractionMatch) {
    return {
      quantity: parseQuantityToken(mixedFractionMatch[1]),
      rest: normalizedText.slice(mixedFractionMatch[1].length).trim()
    };
  }

  const fractionMatch = normalizedText.match(/^(\d+\/\d+)(?=\s|$)/);
  if (fractionMatch) {
    return {
      quantity: parseQuantityToken(fractionMatch[1]),
      rest: normalizedText.slice(fractionMatch[1].length).trim()
    };
  }

  const numberMatch = normalizedText.match(/^(\d+(?:\.\d+)?)(?=\s|$)/);
  if (numberMatch) {
    return {
      quantity: parseQuantityToken(numberMatch[1]),
      rest: normalizedText.slice(numberMatch[1].length).trim()
    };
  }

  return { quantity: null, rest: normalizedText };
}

function extractUnit(text: string): { unit: string | null; rest: string } {
  const trimmed = text.trim().replace(/^of\s+/i, '');
  const units: Array<[string, RegExp]> = [
    ['cup', /^(cups?|c)(?=\s|$)/i],
    ['tbsp', /^(tablespoons?|tbsp|tbsps?)(?=\s|$)/i],
    ['tsp', /^(teaspoons?|tsp|tsps?)(?=\s|$)/i],
    ['oz', /^(ounces?|oz)(?=\s|$)/i],
    ['lb', /^(pounds?|lbs?|lb)(?=\s|$)/i],
    ['g', /^(grams?|g)(?=\s|$)/i],
    ['kg', /^(kilograms?|kgs?|kg)(?=\s|$)/i],
    ['ml', /^(milliliters?|ml)(?=\s|$)/i],
    ['l', /^(liters?|liter|l)(?=\s|$)/i],
    ['stick', /^(sticks?)(?=\s|$)/i],
    ['clove', /^(cloves?)(?=\s|$)/i]
  ];

  for (const [unit, pattern] of units) {
    const match = trimmed.match(pattern);
    if (match) {
      return {
        unit,
        rest: trimmed.slice(match[0].length).trim().replace(/^of\s+/i, '')
      };
    }
  }

  return { unit: null, rest: trimmed };
}

function findCatalogItem(text: string): NutritionCatalogItem | null {
  const normalizedText = normalizeForMatch(text);

  const aliasMatches = nutritionCatalog.flatMap((item) =>
    item.aliases.map((alias) => ({ item, alias: normalizeForMatch(alias) }))
  );

  aliasMatches.sort((left, right) => right.alias.length - left.alias.length);

  for (const { item, alias } of aliasMatches) {
    const boundaryPattern = new RegExp(`(^|\\s)${escapeRegExp(alias)}(?=\\s|$)`);
    if (boundaryPattern.test(normalizedText)) {
      return item;
    }
  }

  return null;
}

function deriveWeightFromCup(item: NutritionCatalogItem, unit: string, quantity: number): number | null {
  const cupWeight = item.unitWeights.cup;
  if (typeof cupWeight !== 'number') {
    return null;
  }

  if (unit === 'cup') {
    return quantity * cupWeight;
  }

  if (unit === 'tbsp') {
    return quantity * (cupWeight / 16);
  }

  if (unit === 'tsp') {
    return quantity * (cupWeight / 48);
  }

  if (unit === 'ml') {
    return quantity * (cupWeight / CUP_IN_ML);
  }

  if (unit === 'l') {
    return quantity * 1000 * (cupWeight / CUP_IN_ML);
  }

  return null;
}

function estimateIngredientGrams(item: NutritionCatalogItem, quantity: number | null, unit: string | null): number | null {
  if (quantity === null || Number.isNaN(quantity) || quantity <= 0) {
    return null;
  }

  if (unit === null) {
    if (typeof item.unitWeights.unit === 'number') {
      return quantity * item.unitWeights.unit;
    }
    return null;
  }

  if (unit === 'g') {
    return quantity;
  }

  if (unit === 'kg') {
    return quantity * 1000;
  }

  if (unit === 'oz') {
    return quantity * OUNCE_IN_GRAMS;
  }

  if (unit === 'lb') {
    return quantity * POUND_IN_GRAMS;
  }

  if (typeof item.unitWeights[unit] === 'number') {
    return quantity * item.unitWeights[unit]!;
  }

  return deriveWeightFromCup(item, unit, quantity);
}

function parseServingsCount(servingsText: string): number | null {
  const trimmed = servingsText.trim();
  if (!trimmed) {
    return null;
  }

  const { quantity } = extractLeadingQuantity(trimmed);
  if (quantity !== null) {
    return quantity;
  }

  const normalized = normalizeFractions(trimmed);
  const numberMatch = normalized.match(/(\d+(?:\.\d+)?|\d+\s+\d+\/\d+|\d+\/\d+)/);
  if (!numberMatch) {
    return null;
  }

  const value = parseQuantityToken(numberMatch[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function buildNutritionEstimate(ingredients: string[], servingsText: string): NutritionEstimate {
  const matchedIngredients: NutritionIngredientEstimate[] = [];
  const unmatchedIngredients: string[] = [];

  ingredients.forEach((ingredientLine) => {
    const { quantity, rest } = extractLeadingQuantity(ingredientLine);
    const { unit, rest: ingredientText } = extractUnit(rest);
    const catalogItem = findCatalogItem(quantity === null ? ingredientLine : ingredientText);

    if (!catalogItem) {
      unmatchedIngredients.push(ingredientLine);
      return;
    }

    const grams = estimateIngredientGrams(catalogItem, quantity, unit);
    if (grams === null) {
      unmatchedIngredients.push(ingredientLine);
      return;
    }

    matchedIngredients.push({
      original: ingredientLine,
      matchedIngredient: catalogItem.displayName,
      grams,
      nutrition: scaleNutrition(catalogItem.nutritionPer100g, grams / 100)
    });
  });

  const totalNutrition = matchedIngredients.reduce(
    (totals, ingredient) => addNutrition(totals, ingredient.nutrition),
    emptyNutrition()
  );

  const servingsCount = parseServingsCount(servingsText);
  const divisor = servingsCount && servingsCount > 0 ? servingsCount : 1;

  return {
    servingsCount,
    servingsText: servingsText.trim() || null,
    totalNutrition,
    perServingNutrition: scaleNutrition(totalNutrition, 1 / divisor),
    matchedIngredients,
    unmatchedIngredients,
    totalIngredientCount: ingredients.length,
    matchedIngredientCount: matchedIngredients.length
  };
}
