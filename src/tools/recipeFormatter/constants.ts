export const DELIGHT_MESSAGES = {
  format: [
    'Recipe polished and pantry label refreshed.',
    'Kitchen-ready format complete.',
    'Your pantry label is ready to share.'
  ],
  swap: [
    'Swap applied and label refreshed.',
    'Ingredient updated. Numbers refreshed.',
    'Substitution tucked in and recalculated.'
  ],
  copy: [
    'Copied with label, ingredients, and instructions.',
    'Recipe copied and ready to paste.',
    'Pantry label copied for easy sharing.'
  ],
  pdf: [
    'Print view opened. Save as PDF from the dialog.',
    'Your pantry sheet is ready for print.',
    'Print-ready export is on deck.'
  ],
  word: [
    'Word-friendly recipe downloaded.',
    'Document export is ready to tweak.',
    'Kitchen copy downloaded for editing.'
  ],
  markdown: [
    'Markdown export downloaded.',
    'Shareable markdown is ready to go.',
    'Markdown sheet downloaded for your notes.'
  ],
  blocked: [
    'Pop-up blocked. Please allow the print window and try again.'
  ]
} as const;

export const SAMPLE_RECIPE_INPUT = {
  title: 'Sunday Cinnamon Cake',
  prepTime: '15 mins',
  cookTime: '25 mins',
  servings: '8',
  ingredients: [
    '1/2 cup butter',
    '3/4 cup brown sugar',
    '2 eggs',
    '1 tsp vanilla extract',
    '1 1/2 cups all-purpose flour',
    '1/4 cup cocoa powder',
    '1 tsp baking powder',
    '1/2 cup sour cream',
    '1 tsp cinnamon',
    '1/4 tsp salt'
  ].join('\n'),
  instructions: [
    '1. Whisk together the flour, cocoa powder, baking powder, cinnamon, and salt in a medium bowl.',
    '2. In a second bowl, cream the butter and brown sugar until smooth.',
    '3. Beat in the eggs, vanilla extract, and sour cream.',
    '4. Fold the dry ingredients into the wet mixture until no dry streaks remain.',
    '5. Divide into 8 muffin cups and bake until set.'
  ].join('\n\n')
} as const;
