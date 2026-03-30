export interface NutritionValues {
  calories: number;
  fat: number;
  saturatedFat: number;
  carbs: number;
  fiber: number;
  sugar: number;
  protein: number;
  sodium: number;
}

export interface NutritionCatalogItem {
  key: string;
  displayName: string;
  aliases: string[];
  unitWeights: Partial<Record<string, number>>;
  nutritionPer100g: NutritionValues;
}

export const nutritionCatalog: NutritionCatalogItem[] = [
  {
    key: 'all-purpose-flour',
    displayName: 'All-purpose flour',
    aliases: ['all purpose flour', 'all-purpose flour', 'plain flour', 'flour'],
    unitWeights: { cup: 125 },
    nutritionPer100g: {
      calories: 364,
      fat: 0.98,
      saturatedFat: 0.16,
      carbs: 76.31,
      fiber: 2.7,
      sugar: 0.27,
      protein: 10.33,
      sodium: 2
    }
  },
  {
    key: 'bread-flour',
    displayName: 'Bread flour',
    aliases: ['bread flour'],
    unitWeights: { cup: 130 },
    nutritionPer100g: {
      calories: 361,
      fat: 1.7,
      saturatedFat: 0.28,
      carbs: 72.5,
      fiber: 4.2,
      sugar: 0.4,
      protein: 12.5,
      sodium: 2
    }
  },
  {
    key: 'whole-wheat-flour',
    displayName: 'Whole wheat flour',
    aliases: ['whole wheat flour', 'whole-wheat flour'],
    unitWeights: { cup: 135 },
    nutritionPer100g: {
      calories: 340,
      fat: 2.5,
      saturatedFat: 0.43,
      carbs: 72.6,
      fiber: 10.7,
      sugar: 0.4,
      protein: 13.2,
      sodium: 5
    }
  },
  {
    key: 'granulated-sugar',
    displayName: 'Granulated sugar',
    aliases: ['granulated sugar', 'white sugar', 'sugar'],
    unitWeights: { cup: 200 },
    nutritionPer100g: {
      calories: 387,
      fat: 0,
      saturatedFat: 0,
      carbs: 100,
      fiber: 0,
      sugar: 100,
      protein: 0,
      sodium: 1
    }
  },
  {
    key: 'brown-sugar',
    displayName: 'Brown sugar',
    aliases: ['dark brown sugar', 'light brown sugar', 'brown sugar'],
    unitWeights: { cup: 220 },
    nutritionPer100g: {
      calories: 380,
      fat: 0,
      saturatedFat: 0,
      carbs: 98.1,
      fiber: 0,
      sugar: 97,
      protein: 0.1,
      sodium: 28
    }
  },
  {
    key: 'powdered-sugar',
    displayName: 'Powdered sugar',
    aliases: ['powdered sugar', 'confectioners sugar', 'icing sugar'],
    unitWeights: { cup: 120 },
    nutritionPer100g: {
      calories: 389,
      fat: 0,
      saturatedFat: 0,
      carbs: 99.8,
      fiber: 0,
      sugar: 97,
      protein: 0,
      sodium: 2
    }
  },
  {
    key: 'butter',
    displayName: 'Butter',
    aliases: ['unsalted butter', 'salted butter', 'butter'],
    unitWeights: { cup: 227, stick: 113.5 },
    nutritionPer100g: {
      calories: 717,
      fat: 81.11,
      saturatedFat: 51.37,
      carbs: 0.06,
      fiber: 0,
      sugar: 0.06,
      protein: 0.85,
      sodium: 643
    }
  },
  {
    key: 'olive-oil',
    displayName: 'Olive oil',
    aliases: ['extra virgin olive oil', 'olive oil'],
    unitWeights: { cup: 216 },
    nutritionPer100g: {
      calories: 884,
      fat: 100,
      saturatedFat: 13.8,
      carbs: 0,
      fiber: 0,
      sugar: 0,
      protein: 0,
      sodium: 2
    }
  },
  {
    key: 'vegetable-oil',
    displayName: 'Vegetable oil',
    aliases: ['vegetable oil', 'canola oil', 'oil'],
    unitWeights: { cup: 218 },
    nutritionPer100g: {
      calories: 884,
      fat: 100,
      saturatedFat: 14,
      carbs: 0,
      fiber: 0,
      sugar: 0,
      protein: 0,
      sodium: 0
    }
  },
  {
    key: 'whole-milk',
    displayName: 'Milk',
    aliases: ['whole milk', 'milk'],
    unitWeights: { cup: 245 },
    nutritionPer100g: {
      calories: 61,
      fat: 3.27,
      saturatedFat: 1.87,
      carbs: 4.8,
      fiber: 0,
      sugar: 5.05,
      protein: 3.15,
      sodium: 43
    }
  },
  {
    key: 'water',
    displayName: 'Water',
    aliases: ['water'],
    unitWeights: { cup: 236.6 },
    nutritionPer100g: {
      calories: 0,
      fat: 0,
      saturatedFat: 0,
      carbs: 0,
      fiber: 0,
      sugar: 0,
      protein: 0,
      sodium: 0
    }
  },
  {
    key: 'egg',
    displayName: 'Egg',
    aliases: ['large eggs', 'large egg', 'eggs', 'egg'],
    unitWeights: { unit: 50 },
    nutritionPer100g: {
      calories: 143,
      fat: 9.51,
      saturatedFat: 3.13,
      carbs: 0.72,
      fiber: 0,
      sugar: 0.37,
      protein: 12.56,
      sodium: 142
    }
  },
  {
    key: 'vanilla-extract',
    displayName: 'Vanilla extract',
    aliases: ['vanilla extract', 'vanilla'],
    unitWeights: { cup: 201.6 },
    nutritionPer100g: {
      calories: 288,
      fat: 0.06,
      saturatedFat: 0.01,
      carbs: 12.65,
      fiber: 0,
      sugar: 12.65,
      protein: 0.06,
      sodium: 9
    }
  },
  {
    key: 'baking-powder',
    displayName: 'Baking powder',
    aliases: ['baking powder'],
    unitWeights: { cup: 192 },
    nutritionPer100g: {
      calories: 53,
      fat: 0,
      saturatedFat: 0,
      carbs: 27.7,
      fiber: 0,
      sugar: 0,
      protein: 0,
      sodium: 10600
    }
  },
  {
    key: 'baking-soda',
    displayName: 'Baking soda',
    aliases: ['baking soda'],
    unitWeights: { cup: 230.4 },
    nutritionPer100g: {
      calories: 0,
      fat: 0,
      saturatedFat: 0,
      carbs: 0,
      fiber: 0,
      sugar: 0,
      protein: 0,
      sodium: 27360
    }
  },
  {
    key: 'salt',
    displayName: 'Salt',
    aliases: ['kosher salt', 'sea salt', 'table salt', 'salt'],
    unitWeights: { cup: 288 },
    nutritionPer100g: {
      calories: 0,
      fat: 0,
      saturatedFat: 0,
      carbs: 0,
      fiber: 0,
      sugar: 0,
      protein: 0,
      sodium: 38758
    }
  },
  {
    key: 'honey',
    displayName: 'Honey',
    aliases: ['honey'],
    unitWeights: { cup: 340 },
    nutritionPer100g: {
      calories: 304,
      fat: 0,
      saturatedFat: 0,
      carbs: 82.4,
      fiber: 0.2,
      sugar: 82.1,
      protein: 0.3,
      sodium: 4
    }
  },
  {
    key: 'rolled-oats',
    displayName: 'Rolled oats',
    aliases: ['rolled oats', 'old fashioned oats', 'old-fashioned oats', 'oats'],
    unitWeights: { cup: 90 },
    nutritionPer100g: {
      calories: 389,
      fat: 6.9,
      saturatedFat: 1.22,
      carbs: 66.3,
      fiber: 10.6,
      sugar: 0.99,
      protein: 16.9,
      sodium: 2
    }
  },
  {
    key: 'white-rice',
    displayName: 'White rice',
    aliases: ['white rice', 'rice'],
    unitWeights: { cup: 185 },
    nutritionPer100g: {
      calories: 365,
      fat: 0.66,
      saturatedFat: 0.18,
      carbs: 80,
      fiber: 1.3,
      sugar: 0.12,
      protein: 7.13,
      sodium: 5
    }
  },
  {
    key: 'cocoa-powder',
    displayName: 'Cocoa powder',
    aliases: ['unsweetened cocoa powder', 'cocoa powder', 'cocoa'],
    unitWeights: { cup: 100 },
    nutritionPer100g: {
      calories: 228,
      fat: 13.7,
      saturatedFat: 8.11,
      carbs: 57.9,
      fiber: 33.2,
      sugar: 1.75,
      protein: 19.6,
      sodium: 21
    }
  },
  {
    key: 'cream-cheese',
    displayName: 'Cream cheese',
    aliases: ['cream cheese'],
    unitWeights: { cup: 225 },
    nutritionPer100g: {
      calories: 342,
      fat: 34.4,
      saturatedFat: 19.3,
      carbs: 4.1,
      fiber: 0,
      sugar: 3.2,
      protein: 5.9,
      sodium: 321
    }
  },
  {
    key: 'sour-cream',
    displayName: 'Sour cream',
    aliases: ['sour cream'],
    unitWeights: { cup: 230 },
    nutritionPer100g: {
      calories: 193,
      fat: 19.4,
      saturatedFat: 10.1,
      carbs: 4.6,
      fiber: 0,
      sugar: 3.6,
      protein: 2.4,
      sodium: 47
    }
  },
  {
    key: 'cheddar-cheese',
    displayName: 'Cheddar cheese',
    aliases: ['shredded cheddar cheese', 'cheddar cheese'],
    unitWeights: { cup: 113 },
    nutritionPer100g: {
      calories: 403,
      fat: 33.1,
      saturatedFat: 18.9,
      carbs: 1.28,
      fiber: 0,
      sugar: 0.52,
      protein: 24.9,
      sodium: 621
    }
  },
  {
    key: 'onion',
    displayName: 'Onion',
    aliases: ['yellow onion', 'white onion', 'red onion', 'onion'],
    unitWeights: { cup: 160, unit: 110 },
    nutritionPer100g: {
      calories: 40,
      fat: 0.1,
      saturatedFat: 0.04,
      carbs: 9.34,
      fiber: 1.7,
      sugar: 4.24,
      protein: 1.1,
      sodium: 4
    }
  },
  {
    key: 'garlic',
    displayName: 'Garlic',
    aliases: ['garlic cloves', 'garlic clove', 'garlic'],
    unitWeights: { clove: 3 },
    nutritionPer100g: {
      calories: 149,
      fat: 0.5,
      saturatedFat: 0.09,
      carbs: 33.1,
      fiber: 2.1,
      sugar: 1,
      protein: 6.36,
      sodium: 17
    }
  },
  {
    key: 'tomato',
    displayName: 'Tomato',
    aliases: ['roma tomato', 'tomatoes', 'tomato'],
    unitWeights: { cup: 180, unit: 123 },
    nutritionPer100g: {
      calories: 18,
      fat: 0.2,
      saturatedFat: 0.03,
      carbs: 3.9,
      fiber: 1.2,
      sugar: 2.63,
      protein: 0.88,
      sodium: 5
    }
  },
  {
    key: 'carrot',
    displayName: 'Carrot',
    aliases: ['carrots', 'carrot'],
    unitWeights: { cup: 128, unit: 61 },
    nutritionPer100g: {
      calories: 41,
      fat: 0.24,
      saturatedFat: 0.04,
      carbs: 9.58,
      fiber: 2.8,
      sugar: 4.74,
      protein: 0.93,
      sodium: 69
    }
  },
  {
    key: 'potato',
    displayName: 'Potato',
    aliases: ['russet potato', 'yukon gold potato', 'potatoes', 'potato'],
    unitWeights: { unit: 173 },
    nutritionPer100g: {
      calories: 77,
      fat: 0.09,
      saturatedFat: 0.03,
      carbs: 17.6,
      fiber: 2.2,
      sugar: 0.82,
      protein: 2.05,
      sodium: 6
    }
  },
  {
    key: 'chicken-breast',
    displayName: 'Chicken breast',
    aliases: ['boneless skinless chicken breast', 'chicken breasts', 'chicken breast'],
    unitWeights: { unit: 174 },
    nutritionPer100g: {
      calories: 120,
      fat: 2.62,
      saturatedFat: 0.56,
      carbs: 0,
      fiber: 0,
      sugar: 0,
      protein: 22.5,
      sodium: 45
    }
  },
  {
    key: 'ground-beef',
    displayName: 'Ground beef',
    aliases: ['lean ground beef', 'ground beef'],
    unitWeights: { cup: 225 },
    nutritionPer100g: {
      calories: 254,
      fat: 17.2,
      saturatedFat: 6.78,
      carbs: 0,
      fiber: 0,
      sugar: 0,
      protein: 25.9,
      sodium: 72
    }
  },
  {
    key: 'black-beans',
    displayName: 'Black beans',
    aliases: ['black beans', 'beans'],
    unitWeights: { cup: 172 },
    nutritionPer100g: {
      calories: 132,
      fat: 0.54,
      saturatedFat: 0.14,
      carbs: 23.7,
      fiber: 8.7,
      sugar: 0.32,
      protein: 8.86,
      sodium: 1
    }
  }
];
