import { describe, expect, it } from 'vitest';
import { buildNutritionEstimate } from './nutritionCalculator';

describe('Nutrition calculator', () => {
  it('builds an estimated label for common baking ingredients', () => {
    const estimate = buildNutritionEstimate(
      [
        '2 cups all-purpose flour',
        '1 cup sugar',
        '3 eggs',
        '1 tsp vanilla extract',
        '1/2 cup butter'
      ],
      '8 servings'
    );

    expect(estimate.matchedIngredientCount).toBe(5);
    expect(estimate.unmatchedIngredients).toHaveLength(0);
    expect(Math.round(estimate.totalNutrition.calories)).toBe(2724);
    expect(Math.round(estimate.perServingNutrition.calories)).toBe(341);
    expect(Math.round(estimate.perServingNutrition.protein)).toBe(6);
  });

  it('handles servings text and leaves unsupported lines unmatched', () => {
    const estimate = buildNutritionEstimate(
      [
        '2 large eggs',
        '1 tbsp olive oil',
        'pinch of cinnamon'
      ],
      'Serves 2 people'
    );

    expect(estimate.servingsCount).toBe(2);
    expect(estimate.matchedIngredientCount).toBe(2);
    expect(estimate.unmatchedIngredients).toEqual(['pinch of cinnamon']);
    expect(Math.round(estimate.totalNutrition.calories)).toBe(262);
    expect(Math.round(estimate.perServingNutrition.calories)).toBe(131);
  });
});
