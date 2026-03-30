export interface ScaledIngredient {
    original: string;
    scaled: string;
}

// Simple ingredient parsing - looks for numbers (including fractions) at the start
function parseIngredientAmount(ingredient: string): { amount: number; rest: string } | null {
    const trimmed = ingredient.trim();

    // Match patterns like: "2", "1/2", "1 1/2", "2.5"
    const fractionMatch = trimmed.match(/^(\d+)?\s*(\d+)\/(\d+)\s+(.+)$/); // "1 1/2 cups"
    const simpleFractionMatch = trimmed.match(/^(\d+)\/(\d+)\s+(.+)$/); // "1/2 cup"
    const decimalMatch = trimmed.match(/^(\d+\.?\d*)\s+(.+)$/); // "2.5 cups" or "2 cups"

    if (fractionMatch) {
        const whole = parseInt(fractionMatch[1] || '0');
        const numerator = parseInt(fractionMatch[2]);
        const denominator = parseInt(fractionMatch[3]);
        const amount = whole + (numerator / denominator);
        return { amount, rest: fractionMatch[4] };
    }

    if (simpleFractionMatch) {
        const numerator = parseInt(simpleFractionMatch[1]);
        const denominator = parseInt(simpleFractionMatch[2]);
        const amount = numerator / denominator;
        return { amount, rest: simpleFractionMatch[3] };
    }

    if (decimalMatch) {
        const amount = parseFloat(decimalMatch[1]);
        return { amount, rest: decimalMatch[2] };
    }

    return null;
}

function formatAmount(amount: number): string {
    // Convert to common fractions if close enough
    const fractions: [number, string][] = [
        [0.125, '1/8'],
        [0.25, '1/4'],
        [0.333, '1/3'],
        [0.5, '1/2'],
        [0.667, '2/3'],
        [0.75, '3/4'],
    ];

    const whole = Math.floor(amount);
    const decimal = amount - whole;

    // Check if decimal part matches a common fraction
    for (const [value, fraction] of fractions) {
        if (Math.abs(decimal - value) < 0.05) {
            return whole > 0 ? `${whole} ${fraction}` : fraction;
        }
    }

    // Otherwise, use decimal or whole number
    if (decimal < 0.01) {
        return whole.toString();
    }

    return amount.toFixed(2).replace(/\.?0+$/, '');
}

export function scaleRecipe(ingredients: string[], originalServings: number, newServings: number): ScaledIngredient[] {
    const scaleFactor = newServings / originalServings;

    return ingredients.map(ingredient => {
        const parsed = parseIngredientAmount(ingredient);

        if (!parsed) {
            // No amount found, return as-is
            return { original: ingredient, scaled: ingredient };
        }

        const scaledAmount = parsed.amount * scaleFactor;
        const formattedAmount = formatAmount(scaledAmount);
        const scaled = `${formattedAmount} ${parsed.rest}`;

        return { original: ingredient, scaled };
    });
}
