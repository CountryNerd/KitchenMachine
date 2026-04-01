import { describe, expect, it } from 'vitest';
import { parseRecipeText } from './recipePhotoImport';

describe('Recipe photo import parser', () => {
  it('extracts a structured recipe from printed-style headings', () => {
    const draft = parseRecipeText([
      'Sunday Cinnamon Cake',
      'Prep Time: 15 mins',
      'Cook Time: 25 mins',
      'Servings: 8',
      'Ingredients',
      '1/2 cup butter',
      '3/4 cup brown sugar',
      '2 eggs',
      '1 tsp vanilla extract',
      'Instructions',
      '1. Whisk the flour, cinnamon, and salt together.',
      '2. Cream the butter and brown sugar.',
      '3. Beat in the eggs and vanilla.'
    ].join('\n'));

    expect(draft.title).toBe('Sunday Cinnamon Cake');
    expect(draft.prepTime).toBe('15 mins');
    expect(draft.cookTime).toBe('25 mins');
    expect(draft.servings).toBe('8');
    expect(draft.ingredients).toEqual([
      '1/2 cup butter',
      '3/4 cup brown sugar',
      '2 eggs',
      '1 tsp vanilla extract'
    ]);
    expect(draft.instructions).toEqual([
      'Whisk the flour, cinnamon, and salt together.',
      'Cream the butter and brown sugar.',
      'Beat in the eggs and vanilla.'
    ]);
    expect(draft.confidence).toBe('high');
  });

  it('infers ingredients and numbered instructions when headings are missing', () => {
    const draft = parseRecipeText([
      'Weeknight Banana Bread',
      'Prep Time 10 mins',
      'Bake Time 55 mins',
      'Makes 1 loaf',
      '2 cups flour',
      '1 tsp baking soda',
      '3 ripe bananas',
      '2 eggs',
      '1. Mash the bananas in a large bowl.',
      '2. Mix in the eggs and dry ingredients.',
      '3. Bake until golden brown.'
    ].join('\n'));

    expect(draft.title).toBe('Weeknight Banana Bread');
    expect(draft.cookTime).toBe('55 mins');
    expect(draft.servings).toBe('1 loaf');
    expect(draft.ingredients).toHaveLength(4);
    expect(draft.instructions).toEqual([
      'Mash the bananas in a large bowl.',
      'Mix in the eggs and dry ingredients.',
      'Bake until golden brown.'
    ]);
    expect(draft.warnings).toContain('Section headings were not clearly detected, so the ingredient list and method were inferred.');
    expect(draft.confidence).toBe('medium');
  });

  it('returns low-confidence warnings when the OCR text is too ambiguous', () => {
    const draft = parseRecipeText([
      'Cake Page',
      'Sunday brunch notes',
      'soft and good',
      'warm oven soon'
    ].join('\n'));

    expect(draft.ingredients).toEqual([]);
    expect(draft.instructions).toEqual([]);
    expect(draft.confidence).toBe('low');
    expect(draft.warnings).toContain('Ingredients were hard to separate. Review the draft before formatting.');
    expect(draft.warnings).toContain('Instructions were hard to separate. Review the draft before formatting.');
  });

  it('cleans package-style OCR into a recipe-ready draft', () => {
    const draft = parseRecipeText([
      '=]',
      'Bi Ghirardelli Premium All-in-One Baking Kit',
      '=a',
      'INGREDIENTS',
      '1 cup Butter or margarine, softened',
      '3/4 cup Sugar',
      '3/4 cup Brown sugar, packed',
      '2 Eggs, large',
      '2 teaspoons Vanilla',
      '2 1/4 cups Flour, unsifted',
      '1 teaspoon Baking soda',
      '1/2 teaspoon Salt',
      '1 cup Walnuts or pecans, chopped (optional)',
      '2 cups Ghirardelli Bittersweet 60% Cacao Baking',
      'Chips',
      'Note: The 2 cups of Ghirardelli Bittersweet 60%',
      'Cacao Baking Chips can be substituted with any',
      'variety of chip flavor (i.e.- Ghirardelli Milk Chocolate',
      'Chips, Semi-Sweet Chocolate Chips, etc.)',
      '® 10 MmINuTES 100 EASY',
      'DIRECTIONS',
      'Heat oven to 375°F.',
      'Stir flour with baking soda and salt; set aside.',
      'In large mixing bowl, beat butter with sugar, and brown sugar at',
      'medium speed until creamy and lightened in color.',
      'Add eggs and vanilla, one at a time. Mix on low speed until',
      'incorporated.',
      'Gradually blend dry mixture into creamed mixture. Stir in nuts and',
      'chocolate chips.',
      'Drop by tablespoon onto ungreased cookie sheets.',
      'Bake for 9 to 11 minutes or until chocolate chip cookies are golden',
      'brown.'
    ].join('\n'));

    expect(draft.title).toBe('Ghirardelli Premium All-in-One Baking Kit');
    expect(draft.prepTime).toBe('10 minutes');
    expect(draft.ingredients).toEqual([
      '1 cup Butter or margarine, softened',
      '3/4 cup Sugar',
      '3/4 cup Brown sugar, packed',
      '2 Eggs, large',
      '2 teaspoons Vanilla',
      '2 1/4 cups Flour, unsifted',
      '1 teaspoon Baking soda',
      '1/2 teaspoon Salt',
      '1 cup Walnuts or pecans, chopped (optional)',
      '2 cups Ghirardelli Bittersweet 60% Cacao Baking Chips'
    ]);
    expect(draft.ingredients.join(' ')).not.toMatch(/substituted with any/i);
    expect(draft.ingredients.join(' ')).not.toMatch(/10 MmINuTES/i);
    expect(draft.instructions).toEqual([
      'Heat oven to 375°F.',
      'Stir flour with baking soda and salt; set aside.',
      'In large mixing bowl, beat butter with sugar, and brown sugar at medium speed until creamy and lightened in color.',
      'Add eggs and vanilla, one at a time. Mix on low speed until incorporated.',
      'Gradually blend dry mixture into creamed mixture. Stir in nuts and chocolate chips.',
      'Drop by tablespoon onto ungreased cookie sheets.',
      'Bake for 9 to 11 minutes or until chocolate chip cookies are golden brown.'
    ]);
    expect(draft.warnings).toContain('Package notes were left out of the ingredient list so the draft stays recipe-ready.');
  });
});
