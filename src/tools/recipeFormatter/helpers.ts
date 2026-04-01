import { DELIGHT_MESSAGES } from './constants';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

export function parseAmount(text: string): number {
  const match = text.trim().match(/^([\d\s./]+)/);
  if (!match) {
    return 1;
  }

  let amountStr = match[1].trim();
  amountStr = amountStr
    .replace(/¼/g, ' 1/4')
    .replace(/½/g, ' 1/2')
    .replace(/¾/g, ' 3/4')
    .replace(/\s+/g, ' ')
    .trim();

  let total = 0;
  const parts = amountStr.split(' ');
  for (const part of parts) {
    if (part.includes('/')) {
      const [numerator, denominator] = part.split('/');
      if (denominator && !Number.isNaN(Number(numerator)) && !Number.isNaN(Number(denominator))) {
        total += Number(numerator) / Number(denominator);
      }
    } else if (!Number.isNaN(Number(part))) {
      total += Number(part);
    }
  }

  return total || 1;
}

export function formatNumber(value: number, maximumFractionDigits = 1): string {
  if (Math.abs(value) < 0.05 && value > 0) {
    return '<0.1';
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits
  }).format(value);
}

export function formatGramValue(value: number): string {
  return `${formatNumber(value)}g`;
}

export function formatMilligramValue(value: number): string {
  if (value > 0 && value < 1) {
    return '<1mg';
  }

  return `${Math.round(value)}mg`;
}

export function pickDelightMessage(key: keyof typeof DELIGHT_MESSAGES): string {
  const messages = DELIGHT_MESSAGES[key];
  return messages[Math.floor(Math.random() * messages.length)];
}

export function getRecipeDisplayTitle(title: string): string {
  const trimmedTitle = title.trim();
  return trimmedTitle || 'Kitchen-ready recipe';
}

export function formatIngredientDisplayName(line: string): string {
  return line
    .trim()
    .replace(/^([\d\s./-]+)\s*/, '')
    .replace(/^(cups?|c|tablespoons?|tbsp|tbsps?|teaspoons?|tsp|tsps?|ounces?|oz|pounds?|lbs?|lb|grams?|g|kilograms?|kgs?|kg|milliliters?|ml|liters?|liter|l|sticks?|cloves?)\s+/i, '')
    .replace(/^of\s+/i, '')
    .trim();
}

export function sanitizeInstructionLine(line: string): string {
  return line
    .trim()
    .replace(/^step\s*\d+\s*[:.)-]?\s*/i, '')
    .replace(/^\d+\s*[.)-]\s*/, '')
    .replace(/^[*-]\s+/, '')
    .trim();
}

export function normalizeInstructionLines(instructions: string): string[] {
  return instructions
    .split('\n')
    .map((line) => sanitizeInstructionLine(line))
    .filter((line) => line.length > 0);
}
