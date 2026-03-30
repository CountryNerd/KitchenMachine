export interface MeasurementEquivalent {
    from: string;
    to: string;
    value: string;
    category: string;
}

export const measurementEquivalents: MeasurementEquivalent[] = [
    // Volume
    { from: "1 cup", to: "16 tablespoons", value: "16 tbsp", category: "Volume" },
    { from: "1 cup", to: "48 teaspoons", value: "48 tsp", category: "Volume" },
    { from: "1 cup", to: "8 fluid ounces", value: "8 fl oz", category: "Volume" },
    { from: "1 cup", to: "237 milliliters", value: "237 ml", category: "Volume" },
    { from: "1 tablespoon", to: "3 teaspoons", value: "3 tsp", category: "Volume" },
    { from: "1 tablespoon", to: "15 milliliters", value: "15 ml", category: "Volume" },
    { from: "1 teaspoon", to: "5 milliliters", value: "5 ml", category: "Volume" },
    { from: "1 fluid ounce", to: "30 milliliters", value: "30 ml", category: "Volume" },
    { from: "1 quart", to: "4 cups", value: "4 cups", category: "Volume" },
    { from: "1 gallon", to: "4 quarts", value: "4 quarts", category: "Volume" },
    { from: "1 pint", to: "2 cups", value: "2 cups", category: "Volume" },
    { from: "1 liter", to: "4.23 cups", value: "4.23 cups", category: "Volume" },

    // Weight
    { from: "1 pound", to: "16 ounces", value: "16 oz", category: "Weight" },
    { from: "1 pound", to: "454 grams", value: "454 g", category: "Weight" },
    { from: "1 ounce", to: "28 grams", value: "28 g", category: "Weight" },
    { from: "1 kilogram", to: "2.2 pounds", value: "2.2 lbs", category: "Weight" },

    // Common Ingredients
    { from: "1 cup flour", to: "weight", value: "120-130 g", category: "Ingredients" },
    { from: "1 cup sugar", to: "weight", value: "200 g", category: "Ingredients" },
    { from: "1 cup brown sugar", to: "weight", value: "220 g", category: "Ingredients" },
    { from: "1 cup butter", to: "weight", value: "227 g (2 sticks)", category: "Ingredients" },
    { from: "1 stick butter", to: "volume", value: "1/2 cup (8 tbsp)", category: "Ingredients" },
    { from: "1 cup rice (uncooked)", to: "cooked", value: "3 cups cooked", category: "Ingredients" },
    { from: "1 cup pasta (uncooked)", to: "cooked", value: "2-2.5 cups cooked", category: "Ingredients" },
];

export const categories = ["All", "Volume", "Weight", "Ingredients"];
