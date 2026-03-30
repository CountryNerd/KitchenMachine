export type UnitCategory = 'volume' | 'weight' | 'temperature';

export type VolumeUnit = 'cup' | 'ml' | 'floz' | 'liter' | 'tbsp' | 'tsp';
export type WeightUnit = 'oz' | 'gram' | 'lb' | 'kg';
export type TemperatureUnit = 'fahrenheit' | 'celsius';

// Volume conversion rates (all to ml)
const volumeToMl: Record<VolumeUnit, number> = {
    ml: 1,
    liter: 1000,
    cup: 236.588,
    floz: 29.5735,
    tbsp: 14.7868,
    tsp: 4.92892,
};

// Weight conversion rates (all to grams)
const weightToGrams: Record<WeightUnit, number> = {
    gram: 1,
    kg: 1000,
    oz: 28.3495,
    lb: 453.592,
};

export function convertVolume(amount: number, from: VolumeUnit, to: VolumeUnit): number {
    const inMl = amount * volumeToMl[from];
    return inMl / volumeToMl[to];
}

export function convertWeight(amount: number, from: WeightUnit, to: WeightUnit): number {
    const inGrams = amount * weightToGrams[from];
    return inGrams / weightToGrams[to];
}

export function convertTemperature(amount: number, from: TemperatureUnit, to: TemperatureUnit): number {
    if (from === to) return amount;

    if (from === 'fahrenheit' && to === 'celsius') {
        return (amount - 32) * (5 / 9);
    } else {
        // celsius to fahrenheit
        return (amount * 9 / 5) + 32;
    }
}

export function formatResult(value: number): string {
    // Round to 2 decimal places, but remove trailing zeros
    return parseFloat(value.toFixed(2)).toString();
}
