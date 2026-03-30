export interface IngredientYield {
    ingredient: string;
    icon: string;
    cupsPerPound: number;
    gramsPerCup: number;
}
// Force Vite HMR reload

export const ingredientYields: IngredientYield[] = [
    { ingredient: "All-Purpose Flour", icon: "🌾", cupsPerPound: 3.6, gramsPerCup: 125 },
    { ingredient: "Bread Flour", icon: "🍞", cupsPerPound: 3.5, gramsPerCup: 130 },
    { ingredient: "Whole Wheat Flour", icon: "🌾", cupsPerPound: 3.3, gramsPerCup: 135 },
    { ingredient: "Granulated Sugar", icon: "🍬", cupsPerPound: 2.25, gramsPerCup: 200 },
    { ingredient: "Brown Sugar (packed)", icon: "🍯", cupsPerPound: 2.2, gramsPerCup: 220 },
    { ingredient: "Powdered Sugar", icon: "🍬", cupsPerPound: 3.75, gramsPerCup: 120 },
    { ingredient: "Butter", icon: "🧈", cupsPerPound: 2, gramsPerCup: 227 },
    { ingredient: "Vegetable Oil", icon: "🫒", cupsPerPound: 2.1, gramsPerCup: 218 },
    { ingredient: "Honey", icon: "🍯", cupsPerPound: 1.33, gramsPerCup: 340 },
    { ingredient: "Milk", icon: "🥛", cupsPerPound: 2.07, gramsPerCup: 245 },
    { ingredient: "Water", icon: "💧", cupsPerPound: 2.08, gramsPerCup: 237 },
    { ingredient: "Rice (uncooked)", icon: "🍚", cupsPerPound: 2.4, gramsPerCup: 185 },
    { ingredient: "Oats (rolled)", icon: "🌾", cupsPerPound: 5, gramsPerCup: 90 },
    { ingredient: "Cocoa Powder", icon: "🍫", cupsPerPound: 4.5, gramsPerCup: 100 },
    { ingredient: "Egg (Large)", icon: "🥚", cupsPerPound: 9, gramsPerCup: 50 },
];

export function convertCupsToPounds(ingredient: string, cups: number): number {
    const item = ingredientYields.find(i => i.ingredient === ingredient);
    if (!item) return 0;
    return cups / item.cupsPerPound;
}

export function convertPoundsToCups(ingredient: string, pounds: number): number {
    const item = ingredientYields.find(i => i.ingredient === ingredient);
    if (!item) return 0;
    return pounds * item.cupsPerPound;
}

export function convertCupsToGrams(ingredient: string, cups: number): number {
    const item = ingredientYields.find(i => i.ingredient === ingredient);
    if (!item) return 0;
    return cups * item.gramsPerCup;
}

export function convertGramsToCups(ingredient: string, grams: number): number {
    const item = ingredientYields.find(i => i.ingredient === ingredient);
    if (!item) return 0;
    return grams / item.gramsPerCup;
}
