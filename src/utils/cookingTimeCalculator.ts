export interface CookingTimeFormula {
    foodType: string;
    method: string;
    minutesPerPound: number;
    baseMinutes?: number;
    notes?: string;
}

export const cookingFormulas: CookingTimeFormula[] = [
    { foodType: "Turkey (unstuffed)", method: "Roast at 325°F", minutesPerPound: 15, notes: "13-15 min/lb" },
    { foodType: "Turkey (stuffed)", method: "Roast at 325°F", minutesPerPound: 17, notes: "15-17 min/lb" },
    { foodType: "Chicken (whole)", method: "Roast at 375°F", minutesPerPound: 20, notes: "20 min/lb" },
    { foodType: "Beef Roast", method: "Roast at 350°F", minutesPerPound: 20, notes: "20-25 min/lb for medium" },
    { foodType: "Pork Roast", method: "Roast at 350°F", minutesPerPound: 25, notes: "25-30 min/lb" },
    { foodType: "Ham (pre-cooked)", method: "Reheat at 325°F", minutesPerPound: 10, notes: "10 min/lb" },
    { foodType: "Lamb Roast", method: "Roast at 325°F", minutesPerPound: 20, notes: "20-25 min/lb" },
    { foodType: "Prime Rib", method: "Roast at 450°F then 350°F", minutesPerPound: 15, notes: "15-20 min/lb for medium-rare" },
];

export function calculateCookingTime(foodType: string, weight: number): { totalMinutes: number; hours: number; minutes: number; formula: CookingTimeFormula | undefined } {
    const formula = cookingFormulas.find(f => f.foodType === foodType);

    if (!formula) {
        return { totalMinutes: 0, hours: 0, minutes: 0, formula: undefined };
    }

    const totalMinutes = Math.round(weight * formula.minutesPerPound + (formula.baseMinutes || 0));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return { totalMinutes, hours, minutes, formula };
}
