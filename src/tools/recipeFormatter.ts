import { substitutions } from '../data/substitutionData';
import { formatRecipe, FormattedRecipe } from '../utils/recipeFormatter';
import { buildNutritionEstimate, NutritionEstimate } from '../utils/nutritionCalculator';

interface NutritionRowData {
  label: string;
  perServing: string;
  total: string;
  indented?: boolean;
  emphasized?: boolean;
}

interface RecipeExportState {
  title: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  usedIngredients: string[];
  removedIngredients: string[];
  instructions: string[];
  equipment: string[];
  nutritionEstimate: NutritionEstimate;
}

type ToastTone = 'success' | 'info' | 'warning';
type SubmitReason = 'format' | 'swap';

const DELIGHT_MESSAGES = {
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

const SAMPLE_RECIPE_INPUT = {
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function parseAmount(text: string): number {
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

function formatNumber(value: number, maximumFractionDigits = 1): string {
  if (Math.abs(value) < 0.05 && value > 0) {
    return '<0.1';
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits
  }).format(value);
}

function formatGramValue(value: number): string {
  return `${formatNumber(value)}g`;
}

function formatMilligramValue(value: number): string {
  if (value > 0 && value < 1) {
    return '<1mg';
  }

  return `${Math.round(value)}mg`;
}

function pickDelightMessage(key: keyof typeof DELIGHT_MESSAGES): string {
  const messages = DELIGHT_MESSAGES[key];
  return messages[Math.floor(Math.random() * messages.length)];
}

function getRecipeDisplayTitle(title: string): string {
  const trimmedTitle = title.trim();
  return trimmedTitle || 'Kitchen-ready recipe';
}

function formatIngredientDisplayName(line: string): string {
  return line
    .trim()
    .replace(/^([\d\s./-]+)\s*/, '')
    .replace(/^(cups?|c|tablespoons?|tbsp|tbsps?|teaspoons?|tsp|tsps?|ounces?|oz|pounds?|lbs?|lb|grams?|g|kilograms?|kgs?|kg|milliliters?|ml|liters?|liter|l|sticks?|cloves?)\s+/i, '')
    .replace(/^of\s+/i, '')
    .trim();
}

function sanitizeInstructionLine(line: string): string {
  return line
    .trim()
    .replace(/^step\s*\d+\s*[:.)-]?\s*/i, '')
    .replace(/^\d+\s*[.)-]\s*/, '')
    .replace(/^[*-]\s+/, '')
    .trim();
}

function normalizeInstructionLines(instructions: string): string[] {
  return instructions
    .split('\n')
    .map((line) => sanitizeInstructionLine(line))
    .filter((line) => line.length > 0);
}

function buildNutritionRows(estimate: NutritionEstimate): NutritionRowData[] {
  return [
    {
      label: 'Calories',
      perServing: Math.round(estimate.perServingNutrition.calories).toString(),
      total: Math.round(estimate.totalNutrition.calories).toString(),
      emphasized: true
    },
    {
      label: 'Total Fat',
      perServing: formatGramValue(estimate.perServingNutrition.fat),
      total: formatGramValue(estimate.totalNutrition.fat)
    },
    {
      label: 'Saturated Fat',
      perServing: formatGramValue(estimate.perServingNutrition.saturatedFat),
      total: formatGramValue(estimate.totalNutrition.saturatedFat),
      indented: true
    },
    {
      label: 'Sodium',
      perServing: formatMilligramValue(estimate.perServingNutrition.sodium),
      total: formatMilligramValue(estimate.totalNutrition.sodium)
    },
    {
      label: 'Total Carb',
      perServing: formatGramValue(estimate.perServingNutrition.carbs),
      total: formatGramValue(estimate.totalNutrition.carbs)
    },
    {
      label: 'Dietary Fiber',
      perServing: formatGramValue(estimate.perServingNutrition.fiber),
      total: formatGramValue(estimate.totalNutrition.fiber),
      indented: true
    },
    {
      label: 'Total Sugars',
      perServing: formatGramValue(estimate.perServingNutrition.sugar),
      total: formatGramValue(estimate.totalNutrition.sugar),
      indented: true
    },
    {
      label: 'Protein',
      perServing: formatGramValue(estimate.perServingNutrition.protein),
      total: formatGramValue(estimate.totalNutrition.protein)
    }
  ];
}

function buildNutritionTrustCopy(estimate: NutritionEstimate): string {
  if (estimate.matchedIngredientCount === 0) {
    return 'Estimate unavailable until recognizable ingredients appear in the final recipe.';
  }

  const ingredientCountLabel = `${estimate.matchedIngredientCount} recognized ingredient${estimate.matchedIngredientCount === 1 ? '' : 's'}`;
  const baseCopy = estimate.matchedIngredientCount === estimate.totalIngredientCount
    ? `Estimate based on all ${estimate.totalIngredientCount} ingredient${estimate.totalIngredientCount === 1 ? '' : 's'} in the final recipe.`
    : `Estimate based on ${ingredientCountLabel}.`;

  if (estimate.unmatchedIngredients.length === 0) {
    return baseCopy;
  }

  const excludedIngredients = Array.from(
    new Set(
      estimate.unmatchedIngredients
        .map((ingredient) => formatIngredientDisplayName(ingredient))
        .filter((ingredient) => ingredient.length > 0)
    )
  );

  if (excludedIngredients.length === 0) {
    return baseCopy;
  }

  const excludedCopy = excludedIngredients.join(', ');
  const verb = excludedIngredients.length === 1 ? 'was' : 'were';
  return `${baseCopy} ${excludedCopy} ${verb} excluded.`;
}

function buildRecipeIngredientStatement(usedIngredients: string[], estimate: NutritionEstimate): string {
  const recognizedByName = new Map<string, number>();
  const recognizedOriginals = new Set<string>();

  estimate.matchedIngredients.forEach((ingredient) => {
    recognizedOriginals.add(ingredient.original);
    recognizedByName.set(
      ingredient.matchedIngredient,
      (recognizedByName.get(ingredient.matchedIngredient) || 0) + ingredient.grams
    );
  });

  const orderedRecognized = [...recognizedByName.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([ingredient]) => ingredient);

  const visibleUnrecognized = usedIngredients
    .filter((ingredient) => !recognizedOriginals.has(ingredient))
    .map((ingredient) => formatIngredientDisplayName(ingredient));

  return [...orderedRecognized, ...visibleUnrecognized].join(', ');
}

function renderRemovedIngredientNote(removedIngredients: string[]): string {
  if (removedIngredients.length === 0) {
    return '';
  }

  return `
    <section class="rf-sheet-note rf-live-section">
      <div class="rf-sheet-note-kicker">Cook's note</div>
      <p class="rf-sheet-note-copy">These ingredients never appear in the method, so they were left out of the final ingredient list and nutrition estimate.</p>
      <ul class="rf-sheet-note-list">
        ${removedIngredients.map((ingredient) => `<li>${escapeHtml(ingredient)}</li>`).join('')}
      </ul>
    </section>
  `;
}

function renderNutritionLabel(estimate: NutritionEstimate, usedIngredients: string[]): string {
  if (estimate.matchedIngredientCount === 0) {
    return `
      <div class="rf-nutrition-shell rf-live-section">
        <div class="rf-nutrition-empty">
          <div class="rf-nutrition-empty-title">Nutrition Facts</div>
          <p>We could not estimate this recipe yet. Use lines like <strong>2 cups flour</strong> or <strong>3 eggs</strong> so the label feels like a real pantry panel.</p>
        </div>
      </div>
    `;
  }

  const hasServings = estimate.servingsCount !== null;
  const ingredientStatement = buildRecipeIngredientStatement(usedIngredients, estimate);
  const nutritionRows = buildNutritionRows(estimate);
  const trustCopy = buildNutritionTrustCopy(estimate);

  return `
    <div class="rf-nutrition-shell rf-live-section">
      <div class="rf-nutrition-kicker">Recipe Pantry Label</div>
      <div class="rf-nutrition-label" role="img" aria-label="Estimated nutrition facts">
        <div class="rf-nutrition-title-row">
          <div class="rf-nutrition-title">Nutrition Facts</div>
          <div class="rf-nutrition-estimate-pill">Estimate</div>
        </div>
        <div class="rf-nutrition-serving-line">${escapeHtml(estimate.servingsText ?? 'Serving count not provided')}${estimate.servingsText ? ' per recipe' : ''}</div>
        <div class="rf-nutrition-serving-size">
          <span>Serving size</span>
          <strong>${hasServings ? '1 serving' : 'Whole recipe'}</strong>
        </div>
        <p class="rf-nutrition-trust">${escapeHtml(trustCopy)}</p>

        <table class="rf-nutrition-table">
          <thead>
            <tr>
              <th scope="col"></th>
              <th scope="col">${hasServings ? 'Per serving' : 'Whole recipe'}</th>
              ${hasServings ? '<th scope="col">Whole recipe</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${nutritionRows.map((row) => `
              <tr class="${row.emphasized ? 'rf-nutrition-calories-row' : row.indented ? 'rf-nutrition-sub-row' : ''}">
                <th scope="row">${row.label}</th>
                <td>${row.perServing}</td>
                ${hasServings ? `<td>${row.total}</td>` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="rf-nutrition-ingredients-block">
          <div class="rf-nutrition-ingredients-label">Ingredients</div>
          <p class="rf-nutrition-ingredients-copy">${escapeHtml(ingredientStatement)}</p>
          <div class="rf-nutrition-ingredients-note">Shown from the ingredients still used in the final recipe. Recognized pantry items are ordered first by estimated weight.</div>
        </div>

        <div class="rf-nutrition-footnote">Calories and macros are estimated from the ingredients kept in the recipe, common kitchen weights, and your serving count.</div>
      </div>
    </div>
  `;
}

function renderRecipeActionRail(): string {
  return `
    <div class="rf-sheet-utility rf-live-section">
      <div class="rf-sheet-utility-label">Export &amp; share</div>
      <div class="rf-sheet-action-row">
        <button type="button" id="rf-export-pdf" class="rf-action-btn rf-action-btn-primary" aria-label="Export recipe to PDF">
          <span class="material-icons" aria-hidden="true">picture_as_pdf</span>
          <span class="rf-action-btn-label">PDF</span>
        </button>
        <button type="button" id="rf-export-word" class="rf-action-btn" aria-label="Export recipe to Word">
          <span class="material-icons" aria-hidden="true">description</span>
          <span class="rf-action-btn-label">Word</span>
        </button>
        <button type="button" id="rf-export-md" class="rf-action-btn" aria-label="Export recipe to Markdown">
          <span class="material-icons" aria-hidden="true">notes</span>
          <span class="rf-action-btn-label">Markdown</span>
        </button>
        <button type="button" id="rf-copy-btn" class="rf-action-btn" aria-label="Copy recipe to clipboard">
          <span class="material-icons" aria-hidden="true">content_copy</span>
          <span class="rf-action-btn-label">Copy</span>
        </button>
      </div>
    </div>
  `;
}

function renderRecipeSheet(state: RecipeExportState): string {
  const displayTitle = getRecipeDisplayTitle(state.title);
  const hasMeta = Boolean(state.prepTime || state.cookTime || state.servings);

  return `
    <article class="rf-sheet">
      <header class="rf-sheet-header">
        <div class="rf-sheet-header-copy rf-live-section">
          <div class="rf-sheet-overline">Heritage Recipe Sheet</div>
          <h3 class="rf-sheet-title">${escapeHtml(displayTitle)}</h3>
          <p class="rf-sheet-summary">Formatted from your working draft with instruction-matched ingredients and a pantry-style nutrition estimate ready to print, save, or share.</p>
        </div>
        ${renderRecipeActionRail()}
      </header>

      ${hasMeta ? `
        <div class="rf-sheet-meta-strip rf-live-section">
          ${state.prepTime ? `<span><strong>Prep Time</strong> ${escapeHtml(state.prepTime)}</span>` : ''}
          ${state.cookTime ? `<span><strong>Cook Time</strong> ${escapeHtml(state.cookTime)}</span>` : ''}
          ${state.servings ? `<span><strong>Servings</strong> ${escapeHtml(state.servings)}</span>` : ''}
        </div>
      ` : ''}

      <div class="rf-sheet-grid">
        <section class="rf-sheet-main">
          ${renderRemovedIngredientNote(state.removedIngredients)}

          ${state.equipment.length > 0 ? `
            <section class="rf-sheet-section rf-sheet-tools rf-live-section">
              <div class="rf-sheet-section-top">
                <div class="rf-sheet-section-number">00</div>
                <div class="rf-sheet-section-copy">
                  <div class="rf-sheet-section-kicker">Setup</div>
                  <h4>Bust out these tools</h4>
                  <p>Everything you need before you start mixing, simmering, or baking.</p>
                </div>
              </div>
              <div class="rf-equipment-tags">
                ${state.equipment.map((tool) => `<span class="rf-equip-tag">${escapeHtml(tool)}</span>`).join('')}
              </div>
            </section>
          ` : ''}

          <section class="rf-sheet-section rf-live-section">
            <div class="rf-sheet-section-top">
              <div class="rf-sheet-section-number">01</div>
              <div class="rf-sheet-section-copy">
                <div class="rf-sheet-section-kicker">Pantry</div>
                <h4>Ingredients</h4>
                <p>Only ingredients that still appear in the method stay in the final list.</p>
              </div>
            </div>
            <ol class="rf-sheet-list rf-ingredients-list" id="rf-matched-list">
              ${state.usedIngredients.map((ingredient, index) => `
                <li>
                  <span class="rf-ing-text">${escapeHtml(ingredient)}</span>
                  ${buildSubstitutionTooltip(ingredient, index, true)}
                </li>
              `).join('')}
            </ol>
          </section>

          <section class="rf-sheet-section rf-live-section">
            <div class="rf-sheet-section-top">
              <div class="rf-sheet-section-number">02</div>
              <div class="rf-sheet-section-copy">
                <div class="rf-sheet-section-kicker">Method</div>
                <h4>Instructions</h4>
                <p>Clear, printable steps paired to the final ingredient list.</p>
              </div>
            </div>
            <ol class="rf-sheet-steps">
              ${state.instructions.map((paragraph) => `<li>${escapeHtml(paragraph)}</li>`).join('')}
            </ol>
          </section>
        </section>

        <aside class="rf-sheet-sidebar">
          ${renderNutritionLabel(state.nutritionEstimate, state.usedIngredients)}
        </aside>
      </div>
    </article>
  `;
}

function buildSubstitutionTooltip(ingredientText: string, index: number, isMatched: boolean): string {
  const lowerText = ingredientText.toLowerCase();
  const foundSubstitution = substitutions.find((entry) => lowerText.includes(entry.ingredient.toLowerCase()));

  if (!foundSubstitution || foundSubstitution.substitutes.length === 0) {
    return '';
  }

  const rankedSubstitutes = [...foundSubstitution.substitutes].sort((left, right) => {
    const qualityRank = { best: 1, standard: 2, vegan: 3, emergency: 4 };
    return (qualityRank[left.matchQuality || 'standard'] || 5) - (qualityRank[right.matchQuality || 'standard'] || 5);
  });

  const bestSubstitute = rankedSubstitutes[0];
  const recipeAmount = parseAmount(ingredientText);
  const multiplier = recipeAmount / (foundSubstitution.baseAmount || 1);

  const substitutedText = bestSubstitute.ratio.replace(/\{([\d.]+)\}/g, (match, numericValue) => {
    const baseValue = Number.parseFloat(numericValue);
    if (Number.isNaN(baseValue)) {
      return match;
    }

    const calculatedValue = baseValue * multiplier;
    return Number.isInteger(calculatedValue)
      ? calculatedValue.toString()
      : Number.parseFloat(calculatedValue.toFixed(2)).toString();
  });

  return `
    <span class="rf-tooltip-container">
      <span class="material-icons rf-tooltip-icon">info</span>
      <span class="rf-tooltip-text">
        <div style="margin-bottom: 8px;">${foundSubstitution.icon} Substitute: <strong>${escapeHtml(bestSubstitute.substitute)}</strong><br><small>(${escapeHtml(substitutedText)})</small></div>
        <button
          type="button"
          class="rf-swap-btn"
          title="Swap Ingredient"
          data-index="${index}"
          data-matched="${isMatched}"
          data-original="${escapeAttribute(ingredientText)}"
          data-sub="${escapeAttribute(substitutedText)}"
        >
          <span class="material-icons" style="font-size: 1.2rem; margin-right: 4px;">swap_horiz</span> Swap
        </button>
      </span>
    </span>
  `;
}

function buildRecipeTextExport(state: RecipeExportState): string {
  const displayTitle = getRecipeDisplayTitle(state.title);
  const textLines: string[] = [displayTitle, ''];

  if (state.prepTime || state.cookTime || state.servings) {
    textLines.push('Meta:');
    if (state.prepTime) textLines.push(`- Prep Time: ${state.prepTime}`);
    if (state.cookTime) textLines.push(`- Cook Time: ${state.cookTime}`);
    if (state.servings) textLines.push(`- Servings: ${state.servings}`);
    textLines.push('');
  }

  if (state.removedIngredients.length > 0) {
    textLines.push('Cook\'s Note:');
    textLines.push('- Removed from the final recipe because they do not appear in the method:');
    state.removedIngredients.forEach((ingredient) => {
      textLines.push(`  - ${ingredient}`);
    });
    textLines.push('');
  }

  if (state.nutritionEstimate.matchedIngredientCount > 0) {
    const nutritionRows = buildNutritionRows(state.nutritionEstimate);
    textLines.push('Nutrition Facts (Estimate):');
    textLines.push(`- ${buildNutritionTrustCopy(state.nutritionEstimate)}`);
    nutritionRows.forEach((row) => {
      const servingLabel = row.emphasized ? row.perServing : row.perServing;
      textLines.push(`- ${row.label}: ${servingLabel}${state.nutritionEstimate.servingsCount ? ` per serving | ${row.total} whole recipe` : ''}`);
    });
    textLines.push(`- Ingredients: ${buildRecipeIngredientStatement(state.usedIngredients, state.nutritionEstimate)}`);
    textLines.push('');
  }

  if (state.equipment.length > 0) {
    textLines.push(`Equipment Needed: ${state.equipment.join(', ')}`);
    textLines.push('');
  }

  textLines.push('Ingredients:');
  state.usedIngredients.forEach((ingredient) => {
    textLines.push(`- ${ingredient}`);
  });
  textLines.push('');
  textLines.push('Instructions:');
  state.instructions.forEach((instruction, index) => {
    textLines.push(`${index + 1}. ${instruction}`);
  });

  return textLines.join('\n');
}

function buildRecipeMarkdownExport(state: RecipeExportState): string {
  const displayTitle = getRecipeDisplayTitle(state.title);
  const lines: string[] = [`# ${displayTitle}`, ''];

  if (state.prepTime || state.cookTime || state.servings) {
    lines.push('## Meta');
    if (state.prepTime) lines.push(`- Prep Time: ${state.prepTime}`);
    if (state.cookTime) lines.push(`- Cook Time: ${state.cookTime}`);
    if (state.servings) lines.push(`- Servings: ${state.servings}`);
    lines.push('');
  }

  if (state.removedIngredients.length > 0) {
    lines.push('## Cook\'s Note');
    lines.push('These ingredients were left out of the final recipe because they do not appear in the method:');
    lines.push('');
    state.removedIngredients.forEach((ingredient) => lines.push(`- ${ingredient}`));
    lines.push('');
  }

  if (state.nutritionEstimate.matchedIngredientCount > 0) {
    lines.push('## Nutrition Facts (Estimate)');
    lines.push(`- Trust note: ${buildNutritionTrustCopy(state.nutritionEstimate)}`);
    buildNutritionRows(state.nutritionEstimate).forEach((row) => {
      lines.push(`- ${row.label}: ${row.perServing}${state.nutritionEstimate.servingsCount ? ` per serving | ${row.total} whole recipe` : ''}`);
    });
    lines.push(`- Ingredients: ${buildRecipeIngredientStatement(state.usedIngredients, state.nutritionEstimate)}`);
    lines.push('');
  }

  if (state.equipment.length > 0) {
    lines.push('## Equipment');
    state.equipment.forEach((tool) => lines.push(`- ${tool}`));
    lines.push('');
  }

  lines.push('## Ingredients');
  state.usedIngredients.forEach((ingredient) => lines.push(`- ${ingredient}`));
  lines.push('');
  lines.push('## Instructions');
  state.instructions.forEach((instruction, index) => lines.push(`${index + 1}. ${instruction}`));

  return lines.join('\n');
}

function buildRecipeDocumentHtml(state: RecipeExportState, options: { autoPrint?: boolean } = {}): string {
  const displayTitle = getRecipeDisplayTitle(state.title);
  const nutritionRows = buildNutritionRows(state.nutritionEstimate);
  const hasServings = state.nutritionEstimate.servingsCount !== null;
  const ingredientStatement = buildRecipeIngredientStatement(state.usedIngredients, state.nutritionEstimate);
  const trustCopy = buildNutritionTrustCopy(state.nutritionEstimate);
  const autoPrintScript = options.autoPrint
    ? `
        <script>
          window.addEventListener('load', () => {
            window.setTimeout(() => {
              window.print();
            }, 180);

            window.addEventListener('afterprint', () => {
              window.setTimeout(() => window.close(), 120);
            }, { once: true });
          });
        </script>
      `
    : '';

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(displayTitle)}</title>
        <style>
          @page {
            margin: 0.55in;
          }

          * {
            box-sizing: border-box;
          }

          body {
            font-family: Georgia, "Times New Roman", serif;
            margin: 0;
            padding: 0;
            color: #2d251b;
            background: #f7f0e2;
          }

          .doc {
            max-width: 11in;
            margin: 0 auto;
            background: linear-gradient(180deg, #fffdfa, #fbf5ea);
            border: 1px solid #d8cbb8;
            border-radius: 24px;
            padding: 32px;
            box-shadow: 0 18px 42px rgba(71, 52, 28, 0.08);
          }

          .doc-overline {
            margin: 0 0 6px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: #7d5f2f;
          }

          h1,
          h2,
          h3 {
            margin: 0;
          }

          h1 {
            font-size: 42px;
            line-height: 0.95;
            letter-spacing: -0.04em;
            font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
            color: #241c14;
          }

          .summary {
            margin: 12px 0 0;
            max-width: 680px;
            font-size: 16px;
            line-height: 1.6;
            color: #5f5243;
          }

          .sheet-header {
            display: table;
            width: 100%;
            margin-bottom: 22px;
          }

          .sheet-header-copy,
          .sheet-header-utility {
            display: table-cell;
            vertical-align: top;
          }

          .sheet-header-utility {
            width: 200px;
            text-align: right;
          }

          .sheet-header-utility-label {
            display: inline-block;
            padding: 8px 12px;
            border: 1px solid #d7c9b3;
            border-radius: 999px;
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: #70572e;
            background: rgba(255, 255, 255, 0.72);
          }

          .meta {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin: 0 0 24px;
            padding-bottom: 22px;
            border-bottom: 1px solid #dfd2bf;
          }

          .meta span,
          .removed-chip {
            display: inline-block;
            padding: 10px 14px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.76);
            border: 1px solid #d8ccb8;
            margin: 0 8px 8px 0;
            font-size: 14px;
          }

          .meta strong {
            margin-right: 8px;
            color: #6c8a33;
          }

          .removed {
            margin: 0 0 22px;
            padding: 18px;
            border-radius: 18px;
            background: linear-gradient(180deg, #fff4de, #f9ead1);
            border: 1px solid #e5cf95;
          }

          .removed-title {
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 18px;
            font-weight: 700;
            color: #5b440f;
          }

          .removed-copy {
            margin: 8px 0 0;
            font-size: 14px;
            line-height: 1.5;
            color: #6a5731;
          }

          .removed-list {
            margin: 12px 0 0;
            padding-left: 22px;
            font-size: 14px;
            line-height: 1.6;
          }

          .sheet-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            background: rgba(255, 252, 246, 0.9);
            border: 1px solid #d8cbb8;
            border-radius: 22px;
            overflow: hidden;
          }

          .sheet-main,
          .sheet-sidebar {
            vertical-align: top;
            padding: 26px;
          }

          .sheet-main {
            width: 60%;
          }

          .sheet-sidebar {
            width: 40%;
            border-left: 1px solid #e2d6c5;
            background: linear-gradient(180deg, rgba(248, 243, 232, 0.82), rgba(255, 252, 246, 0.86));
          }

          .section {
            margin-top: 22px;
            padding-top: 18px;
            border-top: 1px solid #e1d6c5;
            page-break-inside: avoid;
          }

          .section:first-of-type {
            margin-top: 0;
            padding-top: 0;
            border-top: 0;
          }

          .section-head {
            display: table;
            width: 100%;
            margin-bottom: 12px;
          }

          .section-number,
          .section-copy {
            display: table-cell;
            vertical-align: top;
          }

          .section-number {
            width: 58px;
          }

          .section-number span {
            display: inline-flex;
            width: 44px;
            height: 44px;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            background: #eef2de;
            border: 1px solid #cfdaab;
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 13px;
            font-weight: 800;
            color: #536b22;
          }

          .section-kicker {
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: #7d5f2f;
          }

          .section-copy h2 {
            margin-top: 4px;
            font-size: 26px;
            font-family: Baskerville, "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
            font-weight: 700;
            color: #241c14;
          }

          .section-copy p {
            margin: 8px 0 0;
            font-family: Georgia, "Times New Roman", serif;
            font-size: 14px;
            line-height: 1.55;
            color: #5f5243;
          }

          .tools {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 14px;
          }

          .tool-chip {
            display: inline-block;
            padding: 8px 12px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.72);
            border: 1px solid #d6cab7;
            font-size: 14px;
            font-weight: 700;
          }

          ol {
            margin: 0;
            padding-left: 24px;
            line-height: 1.7;
          }

          ol li {
            margin-bottom: 12px;
            font-family: Georgia, "Times New Roman", serif;
            font-size: 16px;
          }

          .nutrition-kicker {
            margin-bottom: 10px;
            color: #6a5331;
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.16em;
            text-transform: uppercase;
          }

          .nutrition {
            padding: 0;
            page-break-inside: avoid;
          }

          .nutrition-label {
            background: linear-gradient(180deg, #fffefc, #fbf8f2);
            border: 2px solid #231b15;
            border-radius: 12px;
            padding: 18px;
            color: #201912;
          }

          .nutrition-title-row {
            display: table;
            width: 100%;
            border-bottom: 7px solid #1f1812;
            padding-bottom: 6px;
          }

          .nutrition-title,
          .nutrition-pill {
            display: table-cell;
            vertical-align: bottom;
          }

          .nutrition-title {
            font-family: "Arial Black", "Franklin Gothic Heavy", sans-serif;
            font-size: 42px;
            line-height: 0.95;
            text-transform: uppercase;
            letter-spacing: -0.05em;
          }

          .nutrition-pill {
            text-align: right;
          }

          .nutrition-pill span {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 999px;
            background: #1f1812;
            color: #fbf8f2;
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.12em;
            text-transform: uppercase;
          }

          .nutrition-serving-line {
            margin-top: 10px;
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 15px;
            font-weight: 600;
          }

          .nutrition-serving-size {
            display: table;
            width: 100%;
            margin-top: 5px;
            padding-bottom: 8px;
            border-bottom: 6px solid #1f1812;
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 18px;
            font-weight: 700;
          }

          .nutrition-serving-size span:last-child {
            float: right;
          }

          .nutrition-trust {
            margin: 12px 0 0;
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 14px;
            line-height: 1.5;
            color: #4d4135;
          }

          .nutrition table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
          }

          .nutrition th,
          .nutrition td {
            padding: 6px 8px;
            border-bottom: 1px solid rgba(30, 24, 18, 0.42);
          }

          .nutrition thead th {
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            text-align: right;
          }

          .nutrition thead th:first-child {
            text-align: left;
          }

          .nutrition tbody th {
            text-align: left;
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 17px;
            font-weight: 800;
          }

          .nutrition tbody td {
            text-align: right;
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 16px;
            font-weight: 700;
          }

          .nutrition tbody tr td + td,
          .nutrition thead tr th + th {
            border-left: 1px solid rgba(30, 24, 18, 0.12);
          }

          .nutrition .calories-row th,
          .nutrition .calories-row td {
            border-bottom: 6px solid #1f1812;
          }

          .nutrition .calories-row th {
            font-family: "Arial Black", "Franklin Gothic Heavy", sans-serif;
            font-size: 31px;
          }

          .nutrition .calories-row td {
            font-family: "Arial Black", "Franklin Gothic Heavy", sans-serif;
            font-size: 38px;
            line-height: 1;
          }

          .nutrition .sub-row th {
            padding-left: 20px;
            font-weight: 500;
          }

          .nutrition-ingredients {
            margin-top: 14px;
            padding-top: 12px;
            border-top: 3px solid #1f1812;
          }

          .nutrition-ingredients-label {
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.12em;
            text-transform: uppercase;
          }

          .nutrition-ingredients p {
            margin: 8px 0 0;
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 15px;
            line-height: 1.45;
            font-weight: 600;
          }

          .nutrition-note {
            margin-top: 6px;
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 12px;
            line-height: 1.35;
            color: #5e5348;
          }

          .nutrition-footnote {
            margin-top: 10px;
            padding-top: 8px;
            border-top: 1px solid rgba(30, 24, 18, 0.18);
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 12px;
            line-height: 1.35;
            color: #5f5448;
          }

          .nutrition-empty {
            border: 2px solid #231b15;
            border-radius: 12px;
            padding: 20px;
            background: linear-gradient(180deg, #fffefc, #fbf8f2);
          }

          .nutrition-empty h2 {
            font-family: "Arial Black", "Franklin Gothic Heavy", sans-serif;
            font-size: 32px;
            line-height: 0.98;
            text-transform: uppercase;
          }

          .nutrition-empty p {
            margin: 12px 0 0;
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 15px;
            line-height: 1.55;
          }
        </style>
      </head>
      <body>
        <main class="doc">
          <div class="sheet-header">
            <div class="sheet-header-copy">
              <div class="doc-overline">Heritage Recipe Sheet</div>
              <h1>${escapeHtml(displayTitle)}</h1>
              <p class="summary">Formatted from your working draft with instruction-matched ingredients and a pantry-style nutrition estimate ready to print, save, or share.</p>
            </div>
            <div class="sheet-header-utility">
              <div class="sheet-header-utility-label">Printable kitchen copy</div>
            </div>
          </div>

          ${(state.prepTime || state.cookTime || state.servings) ? `
            <div class="meta">
              ${state.prepTime ? `<span><strong>Prep Time</strong> ${escapeHtml(state.prepTime)}</span>` : ''}
              ${state.cookTime ? `<span><strong>Cook Time</strong> ${escapeHtml(state.cookTime)}</span>` : ''}
              ${state.servings ? `<span><strong>Servings</strong> ${escapeHtml(state.servings)}</span>` : ''}
            </div>
          ` : ''}

          <table class="sheet-table" role="presentation">
            <tr>
              <td class="sheet-main">
                ${state.removedIngredients.length > 0 ? `
                  <div class="removed">
                    <div class="removed-title">Cook's note</div>
                    <p class="removed-copy">These ingredients never appear in the method, so they were left out of the final ingredient list and nutrition estimate.</p>
                    <ul class="removed-list">
                      ${state.removedIngredients.map((ingredient) => `<li>${escapeHtml(ingredient)}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}

                ${state.equipment.length > 0 ? `
                  <section class="section">
                    <div class="section-head">
                      <div class="section-number"><span>00</span></div>
                      <div class="section-copy">
                        <div class="section-kicker">Setup</div>
                        <h2>Bust out these tools</h2>
                        <p>Everything you need before you start cooking.</p>
                      </div>
                    </div>
                    <div class="tools">${state.equipment.map((tool) => `<span class="tool-chip">${escapeHtml(tool)}</span>`).join('')}</div>
                  </section>
                ` : ''}

                <section class="section">
                  <div class="section-head">
                    <div class="section-number"><span>01</span></div>
                    <div class="section-copy">
                      <div class="section-kicker">Pantry</div>
                      <h2>Ingredients</h2>
                      <p>Only ingredients that still appear in the method stay in the printable recipe.</p>
                    </div>
                  </div>
                  <ol>${state.usedIngredients.map((ingredient) => `<li>${escapeHtml(ingredient)}</li>`).join('')}</ol>
                </section>

                <section class="section">
                  <div class="section-head">
                    <div class="section-number"><span>02</span></div>
                    <div class="section-copy">
                      <div class="section-kicker">Method</div>
                      <h2>Instructions</h2>
                      <p>Clear steps paired to the final ingredient list.</p>
                    </div>
                  </div>
                  <ol>${state.instructions.map((instruction) => `<li>${escapeHtml(instruction)}</li>`).join('')}</ol>
                </section>
              </td>

              <td class="sheet-sidebar">
                ${state.nutritionEstimate.matchedIngredientCount > 0 ? `
                  <section class="nutrition">
                    <div class="nutrition-kicker">Recipe Pantry Label</div>
                    <div class="nutrition-label">
                      <div class="nutrition-title-row">
                        <div class="nutrition-title">Nutrition Facts</div>
                        <div class="nutrition-pill"><span>Estimate</span></div>
                      </div>
                      <div class="nutrition-serving-line">${escapeHtml(state.nutritionEstimate.servingsText ?? 'Serving count not provided')}${state.nutritionEstimate.servingsText ? ' per recipe' : ''}</div>
                      <div class="nutrition-serving-size">
                        <span>Serving size</span>
                        <span>${hasServings ? '1 serving' : 'Whole recipe'}</span>
                      </div>
                      <div class="nutrition-trust">${escapeHtml(trustCopy)}</div>
                      <table>
                        <thead>
                          <tr>
                            <th></th>
                            <th>${hasServings ? 'Per serving' : 'Whole recipe'}</th>
                            ${hasServings ? '<th>Whole recipe</th>' : ''}
                          </tr>
                        </thead>
                        <tbody>
                          ${nutritionRows.map((row) => `
                            <tr class="${row.emphasized ? 'calories-row' : row.indented ? 'sub-row' : ''}">
                              <th>${escapeHtml(row.label)}</th>
                              <td>${escapeHtml(row.perServing)}</td>
                              ${hasServings ? `<td>${escapeHtml(row.total)}</td>` : ''}
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                      <div class="nutrition-ingredients">
                        <div class="nutrition-ingredients-label">Ingredients</div>
                        <p>${escapeHtml(ingredientStatement)}</p>
                        <div class="nutrition-note">Shown from the ingredients still used in the final recipe. Recognized pantry items are ordered first by estimated weight.</div>
                      </div>
                      <div class="nutrition-footnote">Calories and macros are estimated from the ingredients kept in the recipe, common kitchen weights, and your serving count.</div>
                    </div>
                  </section>
                ` : `
                  <section class="nutrition-empty">
                    <h2>Nutrition Facts</h2>
                    <p>We could not estimate this recipe yet. Use lines like <strong>2 cups flour</strong> or <strong>3 eggs</strong> so the label feels like a real pantry panel.</p>
                  </section>
                `}
              </td>
            </tr>
          </table>
        </main>
      ${autoPrintScript}
      </body>
    </html>
  `;
}

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 1200);
}

function buildExportFilename(title: string, extension: string): string {
  const recipeSlug = getRecipeDisplayTitle(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'formatted-recipe';
  const dateTag = new Date().toISOString().slice(0, 10);
  return `${recipeSlug}-${dateTag}.${extension}`;
}

function flashActionButtonLabel(button: HTMLButtonElement, nextLabel: string, resetLabel: string) {
  const label = button.querySelector<HTMLElement>('.rf-action-btn-label');
  if (!label) {
    return;
  }

  label.textContent = nextLabel;
  window.setTimeout(() => {
    label.textContent = resetLabel;
  }, 1800);
}

function showFormatterToast(message: string, tone: ToastTone = 'success') {
  const toastStack = document.querySelector<HTMLDivElement>('#rf-toast-stack');
  if (!toastStack) {
    return;
  }

  const toneIcon: Record<ToastTone, string> = {
    success: 'check_circle',
    info: 'auto_awesome',
    warning: 'warning'
  };

  const toast = document.createElement('div');
  toast.className = `rf-toast rf-toast-${tone}`;
  toast.innerHTML = `
    <span class="material-icons rf-toast-icon" aria-hidden="true">${toneIcon[tone]}</span>
    <span class="rf-toast-copy">${escapeHtml(message)}</span>
  `;

  toastStack.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('is-visible');
  });

  window.setTimeout(() => {
    toast.classList.add('is-exiting');
    window.setTimeout(() => {
      toast.remove();
    }, 280);
  }, 2200);
}

function applySectionRevealStagger(container: HTMLElement) {
  const sections = Array.from(container.querySelectorAll<HTMLElement>('.rf-live-section'));
  sections.forEach((section, index) => {
    section.style.setProperty('--rf-stagger-index', index.toString());
  });
}

function exportRecipeToPdf(state: RecipeExportState): boolean {
  const printableHtml = buildRecipeDocumentHtml(state, { autoPrint: true });
  const blob = new Blob([printableHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank', 'width=960,height=1280');
  if (!printWindow) {
    URL.revokeObjectURL(url);
    return false;
  }

  printWindow.focus();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 60_000);

  return true;
}

function exportRecipeToWord(state: RecipeExportState) {
  downloadFile(
    buildExportFilename(state.title, 'doc'),
    `\ufeff${buildRecipeDocumentHtml(state)}`,
    'application/vnd.ms-word;charset=utf-8'
  );
}

function exportRecipeToMarkdown(state: RecipeExportState) {
  downloadFile(
    buildExportFilename(state.title, 'md'),
    `\ufeff${buildRecipeMarkdownExport(state)}`,
    'text/markdown;charset=utf-8'
  );
}

function buildRecipeState(
  title: string,
  prepTime: string,
  cookTime: string,
  servings: string,
  formattedRecipe: FormattedRecipe,
  nutritionEstimate: NutritionEstimate,
  instructions: string[]
): RecipeExportState {
  return {
    title,
    prepTime,
    cookTime,
    servings,
    usedIngredients: formattedRecipe.reorderedIngredients,
    removedIngredients: formattedRecipe.unmatchedIngredients,
    instructions,
    equipment: Array.from(new Set(formattedRecipe.equipment)),
    nutritionEstimate
  };
}

export function renderRecipeFormatter(): string {
  return `
    <div class="card rf-card">
      <form id="recipe-formatter-form">
        <div class="rf-input-group">
          <label for="formatter-title" class="rf-label">Recipe Title</label>
          <input type="text" id="formatter-title" class="rf-input" placeholder="e.g. Sunday Cinnamon Cake">
        </div>

        <div class="rf-meta-inputs">
          <div class="rf-input-group">
            <label for="formatter-prep" class="rf-label">Prep Time</label>
            <input type="text" id="formatter-prep" class="rf-input" placeholder="e.g. 15 mins">
          </div>
          <div class="rf-input-group">
            <label for="formatter-cook" class="rf-label">Cook Time</label>
            <input type="text" id="formatter-cook" class="rf-input" placeholder="e.g. 45 mins">
          </div>
          <div class="rf-input-group">
            <label for="formatter-servings" class="rf-label">Servings</label>
            <input type="text" id="formatter-servings" class="rf-input" placeholder="e.g. 4 servings">
          </div>
        </div>

        <div class="rf-input-group">
          <label for="formatter-ingredients" class="rf-label">Ingredients (one per line)</label>
          <textarea
            id="formatter-ingredients"
            class="rf-textarea"
            required
            rows="6"
            placeholder="2 cups flour&#10;1 cup sugar&#10;3 eggs&#10;1 tsp vanilla extract&#10;1/2 cup butter"
          ></textarea>
        </div>

        <div class="rf-input-group">
          <label for="formatter-instructions" class="rf-label">Instructions</label>
          <textarea
            id="formatter-instructions"
            class="rf-textarea"
            required
            rows="6"
            placeholder="Cream butter and sugar. Add eggs and vanilla. Mix in flour..."
          ></textarea>
        </div>

        <div class="rf-submit-wrapper">
          <div class="rf-submit-actions">
            <button type="button" id="rf-load-sample" class="rf-btn-secondary">
              <span class="material-icons" aria-hidden="true">menu_book</span>
              Load Sample
            </button>
            <button type="submit" class="rf-btn-primary">Format Recipe + Label</button>
          </div>
          <p class="rf-submit-hint">Need a quick test? Load a ready-to-format sample recipe.</p>
        </div>
      </form>

      <div class="rf-divider"></div>

      <div class="rf-footer">
        Format the recipe, remove unused ingredients, estimate a nutrition label, and export it however you need.
      </div>

      <div id="formatter-result-section" class="rf-result-section hidden">
        <div id="formatted-ingredients-list" class="rf-formatted-list"></div>
      </div>
      <div id="rf-toast-stack" class="rf-toast-stack" aria-live="polite" aria-atomic="false"></div>
    </div>
  `;
}

export function attachRecipeFormatterListeners() {
  const form = document.querySelector<HTMLFormElement>('#recipe-formatter-form');
  const titleInput = document.querySelector<HTMLInputElement>('#formatter-title');
  const prepInput = document.querySelector<HTMLInputElement>('#formatter-prep');
  const cookInput = document.querySelector<HTMLInputElement>('#formatter-cook');
  const servingsInput = document.querySelector<HTMLInputElement>('#formatter-servings');
  const ingredientsTextarea = document.querySelector<HTMLTextAreaElement>('#formatter-ingredients');
  const instructionsTextarea = document.querySelector<HTMLTextAreaElement>('#formatter-instructions');
  const loadSampleButton = document.querySelector<HTMLButtonElement>('#rf-load-sample');
  const card = form?.closest<HTMLElement>('.rf-card') ?? null;
  let lastRecipeState: RecipeExportState | null = null;
  let submitReason: SubmitReason = 'format';

  if (!form || !titleInput || !prepInput || !cookInput || !servingsInput || !ingredientsTextarea || !instructionsTextarea) {
    return;
  }

  loadSampleButton?.addEventListener('click', () => {
    titleInput.value = SAMPLE_RECIPE_INPUT.title;
    prepInput.value = SAMPLE_RECIPE_INPUT.prepTime;
    cookInput.value = SAMPLE_RECIPE_INPUT.cookTime;
    servingsInput.value = SAMPLE_RECIPE_INPUT.servings;
    ingredientsTextarea.value = SAMPLE_RECIPE_INPUT.ingredients;
    instructionsTextarea.value = SAMPLE_RECIPE_INPUT.instructions;

    lastRecipeState = null;
    const resultList = document.querySelector<HTMLDivElement>('#formatted-ingredients-list');
    const resultSection = document.querySelector<HTMLDivElement>('#formatter-result-section');
    if (resultList) {
      resultList.innerHTML = '';
    }
    if (resultSection) {
      resultSection.classList.add('hidden');
    }

    titleInput.focus();
    titleInput.setSelectionRange(titleInput.value.length, titleInput.value.length);
    showFormatterToast('Sample recipe loaded. Tap Format Recipe + Label when you are ready.', 'info');
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const title = titleInput.value;
    const prepTime = prepInput.value;
    const cookTime = cookInput.value;
    const servings = servingsInput.value;
    const ingredientsText = ingredientsTextarea.value;
    const instructions = instructionsTextarea.value;
    const normalizedInstructions = normalizeInstructionLines(instructions);
    const normalizedInstructionText = normalizedInstructions.join('\n');

    const ingredients = ingredientsText.split('\n').filter((line) => line.trim().length > 0);
    const formattedRecipe = formatRecipe(ingredients, normalizedInstructionText);
    const nutritionEstimate = buildNutritionEstimate(formattedRecipe.reorderedIngredients, servings);

    lastRecipeState = buildRecipeState(
      title,
      prepTime,
      cookTime,
      servings,
      formattedRecipe,
      nutritionEstimate,
      normalizedInstructions
    );

    const resultList = document.querySelector<HTMLDivElement>('#formatted-ingredients-list');
    const resultSection = document.querySelector<HTMLDivElement>('#formatter-result-section');

    if (!resultList || !resultSection || !lastRecipeState) {
      return;
    }

    let html = '';
    html += renderRecipeSheet(lastRecipeState);

    resultList.innerHTML = html;
    applySectionRevealStagger(resultList);
    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    if (submitReason === 'swap') {
      showFormatterToast(pickDelightMessage('swap'), 'success');
    } else if (lastRecipeState.removedIngredients.length > 0) {
      showFormatterToast(
        `${pickDelightMessage('format')} ${lastRecipeState.removedIngredients.length} ingredient${lastRecipeState.removedIngredients.length === 1 ? '' : 's'} trimmed to match your instructions.`,
        'info'
      );
    } else {
      showFormatterToast(pickDelightMessage('format'), 'success');
    }
    submitReason = 'format';
  });

  if (card) {
    card.addEventListener('click', (event) => {
      const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
      if (!target) {
        return;
      }

      if (target.classList.contains('rf-swap-btn')) {
        const substituteText = target.dataset.sub;
        if (!substituteText) {
          return;
        }

        const ingredientsTextarea = document.querySelector<HTMLTextAreaElement>('#formatter-ingredients');
        if (ingredientsTextarea) {
          const original = target.dataset.original;
          if (original) {
            ingredientsTextarea.value = ingredientsTextarea.value.replace(original, substituteText);
          }
        }

        submitReason = 'swap';
        form.requestSubmit();
        return;
      }

      if (!lastRecipeState) {
        return;
      }

      if (target.id === 'rf-copy-btn') {
        navigator.clipboard.writeText(buildRecipeTextExport(lastRecipeState)).then(() => {
          flashActionButtonLabel(target, 'Copied', 'Copy');
          showFormatterToast(pickDelightMessage('copy'), 'success');
        });
        return;
      }

      if (target.id === 'rf-export-pdf') {
        const didOpen = exportRecipeToPdf(lastRecipeState);
        if (didOpen) {
          flashActionButtonLabel(target, 'Opened', 'PDF');
          showFormatterToast(pickDelightMessage('pdf'), 'info');
        } else {
          showFormatterToast(pickDelightMessage('blocked'), 'warning');
        }
        return;
      }

      if (target.id === 'rf-export-word') {
        exportRecipeToWord(lastRecipeState);
        flashActionButtonLabel(target, 'Saved', 'Word');
        showFormatterToast(pickDelightMessage('word'), 'success');
        return;
      }

      if (target.id === 'rf-export-md') {
        exportRecipeToMarkdown(lastRecipeState);
        flashActionButtonLabel(target, 'Saved', 'Markdown');
        showFormatterToast(pickDelightMessage('markdown'), 'success');
      }
    });
  }
}
