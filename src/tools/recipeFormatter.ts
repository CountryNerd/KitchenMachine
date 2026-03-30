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

function formatIngredientDisplayName(line: string): string {
  return line
    .trim()
    .replace(/^([\d\s./-]+)\s*/, '')
    .replace(/^(cups?|c|tablespoons?|tbsp|tbsps?|teaspoons?|tsp|tsps?|ounces?|oz|pounds?|lbs?|lb|grams?|g|kilograms?|kgs?|kg|milliliters?|ml|liters?|liter|l|sticks?|cloves?)\s+/i, '')
    .replace(/^of\s+/i, '')
    .trim();
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
    <div class="rf-formatted-section rf-removed-note rf-live-section">
      <div class="rf-removed-note-title">Removed from the recipe list</div>
      <p class="rf-removed-note-copy">These ingredients were not mentioned in the instructions, so they were left out of the final ingredient list and nutrition card.</p>
      <div class="rf-removed-note-items">
        ${removedIngredients.map((ingredient) => `<span class="rf-removed-note-chip">${escapeHtml(ingredient)}</span>`).join('')}
      </div>
    </div>
  `;
}

function renderNutritionLabel(estimate: NutritionEstimate, usedIngredients: string[]): string {
  if (estimate.matchedIngredientCount === 0) {
    return `
      <div class="rf-formatted-section rf-nutrition-shell">
        <div class="rf-nutrition-empty">
          <div class="rf-nutrition-empty-title">Nutrition Facts</div>
          <p>We could not estimate this recipe yet. Use lines like <strong>2 cups flour</strong> or <strong>3 eggs</strong> so the label feels like a real pantry panel.</p>
        </div>
      </div>
    `;
  }

  const hasServings = estimate.servingsCount !== null;
  const coverageLabel = `${estimate.matchedIngredientCount} of ${estimate.totalIngredientCount} ingredients recognized`;
  const unmatchedLabel = estimate.unmatchedIngredients.length > 0
    ? `Still estimating: ${escapeHtml(estimate.unmatchedIngredients.join(', '))}`
    : 'Every ingredient still in the recipe is included in this estimate.';
  const ingredientStatement = buildRecipeIngredientStatement(usedIngredients, estimate);
  const nutritionRows = buildNutritionRows(estimate);

  return `
    <div class="rf-formatted-section rf-nutrition-shell rf-live-section">
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

        <div class="rf-nutrition-meta-row">
          <div class="rf-nutrition-meta-pill">${coverageLabel}</div>
          <div class="rf-nutrition-meta-copy">${unmatchedLabel}</div>
        </div>

        <div class="rf-nutrition-footnote">Calories and macros are estimated from the ingredients kept in the recipe, common kitchen weights, and your serving count.</div>
      </div>
    </div>
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
  const textLines: string[] = ['RECIPE', ''];

  if (state.prepTime || state.cookTime || state.servings) {
    textLines.push('Meta:');
    if (state.prepTime) textLines.push(`- Prep Time: ${state.prepTime}`);
    if (state.cookTime) textLines.push(`- Cook Time: ${state.cookTime}`);
    if (state.servings) textLines.push(`- Servings: ${state.servings}`);
    textLines.push('');
  }

  if (state.removedIngredients.length > 0) {
    textLines.push(`Removed Ingredients: ${state.removedIngredients.join(', ')}`);
    textLines.push('');
  }

  if (state.nutritionEstimate.matchedIngredientCount > 0) {
    const nutritionRows = buildNutritionRows(state.nutritionEstimate);
    textLines.push('Nutrition Facts (Estimate):');
    nutritionRows.forEach((row) => {
      const servingLabel = row.emphasized ? row.perServing : row.perServing;
      textLines.push(`- ${row.label}: ${servingLabel}${state.nutritionEstimate.servingsCount ? ` per serving | ${row.total} whole recipe` : ''}`);
    });
    textLines.push(`- Ingredients: ${buildRecipeIngredientStatement(state.usedIngredients, state.nutritionEstimate)}`);
    if (state.nutritionEstimate.unmatchedIngredients.length > 0) {
      textLines.push(`- Still Estimating: ${state.nutritionEstimate.unmatchedIngredients.join(', ')}`);
    }
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
  const lines: string[] = ['# Recipe', ''];

  if (state.prepTime || state.cookTime || state.servings) {
    lines.push('## Meta');
    if (state.prepTime) lines.push(`- Prep Time: ${state.prepTime}`);
    if (state.cookTime) lines.push(`- Cook Time: ${state.cookTime}`);
    if (state.servings) lines.push(`- Servings: ${state.servings}`);
    lines.push('');
  }

  if (state.removedIngredients.length > 0) {
    lines.push(`> Removed from final recipe list: ${state.removedIngredients.join(', ')}`);
    lines.push('');
  }

  if (state.nutritionEstimate.matchedIngredientCount > 0) {
    lines.push('## Nutrition Facts (Estimate)');
    buildNutritionRows(state.nutritionEstimate).forEach((row) => {
      lines.push(`- ${row.label}: ${row.perServing}${state.nutritionEstimate.servingsCount ? ` per serving | ${row.total} whole recipe` : ''}`);
    });
    lines.push(`- Ingredients: ${buildRecipeIngredientStatement(state.usedIngredients, state.nutritionEstimate)}`);
    if (state.nutritionEstimate.unmatchedIngredients.length > 0) {
      lines.push(`- Still Estimating: ${state.nutritionEstimate.unmatchedIngredients.join(', ')}`);
    }
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

function buildRecipeDocumentHtml(state: RecipeExportState): string {
  const nutritionRows = buildNutritionRows(state.nutritionEstimate);

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Recipe Export</title>
        <style>
          body {
            font-family: Georgia, "Times New Roman", serif;
            margin: 0;
            padding: 40px;
            color: #221d17;
            background: #f8f4ea;
          }

          .doc {
            max-width: 820px;
            margin: 0 auto;
            background: #fffdf8;
            border: 1px solid #d9d0be;
            border-radius: 18px;
            padding: 32px;
          }

          h1, h2 {
            margin: 0 0 16px;
            font-family: "Arial Black", "Franklin Gothic Heavy", sans-serif;
          }

          .meta {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 20px;
          }

          .meta span,
          .removed-chip {
            display: inline-block;
            padding: 8px 12px;
            border-radius: 999px;
            background: #eef3df;
            border: 1px solid #d4deba;
            margin: 0 8px 8px 0;
          }

          .removed {
            margin: 0 0 20px;
            padding: 18px;
            border-radius: 16px;
            background: #fbf1db;
            border: 1px solid #e5cf95;
          }

          .nutrition {
            margin-bottom: 22px;
            padding: 20px;
            border: 2px solid #1f1a14;
            border-radius: 12px;
            background: #fffdf8;
          }

          .nutrition h2 {
            border-bottom: 6px solid #1f1a14;
            padding-bottom: 8px;
            margin-bottom: 10px;
          }

          .nutrition table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
          }

          .nutrition th,
          .nutrition td {
            text-align: left;
            padding: 8px 6px;
            border-bottom: 1px solid #cfc2ab;
          }

          .nutrition td {
            text-align: right;
          }

          .ingredients-block {
            margin-top: 14px;
            padding-top: 12px;
            border-top: 2px solid #1f1a14;
          }

          .section {
            margin-top: 26px;
          }

          ul, ol {
            padding-left: 22px;
            line-height: 1.7;
          }
        </style>
      </head>
      <body>
        <main class="doc">
          <h1>Recipe Preview</h1>
          ${(state.prepTime || state.cookTime || state.servings) ? `
            <div class="meta">
              ${state.prepTime ? `<span><strong>Prep Time:</strong> ${escapeHtml(state.prepTime)}</span>` : ''}
              ${state.cookTime ? `<span><strong>Cook Time:</strong> ${escapeHtml(state.cookTime)}</span>` : ''}
              ${state.servings ? `<span><strong>Servings:</strong> ${escapeHtml(state.servings)}</span>` : ''}
            </div>
          ` : ''}

          ${state.removedIngredients.length > 0 ? `
            <div class="removed">
              <strong>Removed from final recipe list:</strong>
              <div style="margin-top: 10px;">
                ${state.removedIngredients.map((ingredient) => `<span class="removed-chip">${escapeHtml(ingredient)}</span>`).join('')}
              </div>
            </div>
          ` : ''}

          ${state.nutritionEstimate.matchedIngredientCount > 0 ? `
            <section class="nutrition">
              <h2>Nutrition Facts</h2>
              <div><strong>Estimate</strong></div>
              <table>
                <thead>
                  <tr>
                    <th></th>
                    <th>${state.nutritionEstimate.servingsCount ? 'Per serving' : 'Whole recipe'}</th>
                    ${state.nutritionEstimate.servingsCount ? '<th>Whole recipe</th>' : ''}
                  </tr>
                </thead>
                <tbody>
                  ${nutritionRows.map((row) => `
                    <tr>
                      <th>${escapeHtml(row.label)}</th>
                      <td>${escapeHtml(row.perServing)}</td>
                      ${state.nutritionEstimate.servingsCount ? `<td>${escapeHtml(row.total)}</td>` : ''}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div class="ingredients-block">
                <strong>Ingredients:</strong> ${escapeHtml(buildRecipeIngredientStatement(state.usedIngredients, state.nutritionEstimate))}
              </div>
            </section>
          ` : ''}

          ${state.equipment.length > 0 ? `
            <section class="section">
              <h2>Equipment</h2>
              <ul>${state.equipment.map((tool) => `<li>${escapeHtml(tool)}</li>`).join('')}</ul>
            </section>
          ` : ''}

          <section class="section">
            <h2>Ingredients</h2>
            <ul>${state.usedIngredients.map((ingredient) => `<li>${escapeHtml(ingredient)}</li>`).join('')}</ul>
          </section>

          <section class="section">
            <h2>Instructions</h2>
            <ol>${state.instructions.map((instruction) => `<li>${escapeHtml(instruction)}</li>`).join('')}</ol>
          </section>
        </main>
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
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildExportFilename(extension: string): string {
  const dateTag = new Date().toISOString().slice(0, 10);
  return `formatted-recipe-${dateTag}.${extension}`;
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
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=960,height=1280');
  if (!printWindow) {
    return false;
  }

  printWindow.document.open();
  printWindow.document.write(buildRecipeDocumentHtml(state));
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
  }, 250);

  return true;
}

function exportRecipeToWord(state: RecipeExportState) {
  downloadFile(
    buildExportFilename('doc'),
    buildRecipeDocumentHtml(state),
    'application/msword'
  );
}

function exportRecipeToMarkdown(state: RecipeExportState) {
  downloadFile(
    buildExportFilename('md'),
    buildRecipeMarkdownExport(state),
    'text/markdown;charset=utf-8'
  );
}

function buildRecipeState(
  prepTime: string,
  cookTime: string,
  servings: string,
  formattedRecipe: FormattedRecipe,
  nutritionEstimate: NutritionEstimate,
  instructions: string
): RecipeExportState {
  return {
    prepTime,
    cookTime,
    servings,
    usedIngredients: formattedRecipe.reorderedIngredients,
    removedIngredients: formattedRecipe.unmatchedIngredients,
    instructions: instructions.split('\n').filter((paragraph) => paragraph.trim().length > 0),
    equipment: Array.from(new Set(formattedRecipe.equipment)),
    nutritionEstimate
  };
}

export function renderRecipeFormatter(): string {
  return `
    <div class="card rf-card">
      <form id="recipe-formatter-form">
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
          <button type="submit" class="rf-btn-primary">Format Recipe + Label</button>
        </div>
      </form>

      <div class="rf-divider"></div>

      <div class="rf-footer">
        Format the recipe, remove unused ingredients, estimate a nutrition label, and export it however you need.
      </div>

      <div id="formatter-result-section" class="rf-result-section hidden">
        <div class="rf-result-header">
          <div class="rf-result-title-wrap">
            <span class="rf-result-eyebrow">Formatted Recipe</span>
            <span>Recipe Preview</span>
          </div>
          <div class="rf-result-actions">
            <button type="button" id="rf-copy-btn" class="rf-action-btn rf-action-btn-primary" aria-label="Copy recipe to clipboard">
              <span class="material-icons" aria-hidden="true">content_copy</span>
              <span class="rf-action-btn-label">Copy</span>
            </button>
            <button type="button" id="rf-export-pdf" class="rf-action-btn" aria-label="Export recipe to PDF">
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
          </div>
        </div>
        <div id="formatted-ingredients-list" class="rf-formatted-list"></div>
      </div>
      <div id="rf-toast-stack" class="rf-toast-stack" aria-live="polite" aria-atomic="false"></div>
    </div>
  `;
}

export function attachRecipeFormatterListeners() {
  const form = document.querySelector<HTMLFormElement>('#recipe-formatter-form');
  const copyButton = document.querySelector<HTMLButtonElement>('#rf-copy-btn');
  const pdfButton = document.querySelector<HTMLButtonElement>('#rf-export-pdf');
  const wordButton = document.querySelector<HTMLButtonElement>('#rf-export-word');
  const markdownButton = document.querySelector<HTMLButtonElement>('#rf-export-md');
  let lastRecipeState: RecipeExportState | null = null;
  let submitReason: SubmitReason = 'format';

  if (!form) {
    return;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const prepTime = document.querySelector<HTMLInputElement>('#formatter-prep')!.value;
    const cookTime = document.querySelector<HTMLInputElement>('#formatter-cook')!.value;
    const servings = document.querySelector<HTMLInputElement>('#formatter-servings')!.value;
    const ingredientsText = document.querySelector<HTMLTextAreaElement>('#formatter-ingredients')!.value;
    const instructions = document.querySelector<HTMLTextAreaElement>('#formatter-instructions')!.value;

    const ingredients = ingredientsText.split('\n').filter((line) => line.trim().length > 0);
    const formattedRecipe = formatRecipe(ingredients, instructions);
    const nutritionEstimate = buildNutritionEstimate(formattedRecipe.reorderedIngredients, servings);

    lastRecipeState = buildRecipeState(
      prepTime,
      cookTime,
      servings,
      formattedRecipe,
      nutritionEstimate,
      instructions
    );

    const resultList = document.querySelector<HTMLDivElement>('#formatted-ingredients-list');
    const resultSection = document.querySelector<HTMLDivElement>('#formatter-result-section');

    if (!resultList || !resultSection || !lastRecipeState) {
      return;
    }

    let html = '';

    if (prepTime || cookTime || servings) {
      html += '<div class="rf-preview-meta rf-live-section">';
      if (prepTime) html += `<span><strong>Prep Time:</strong> ${escapeHtml(prepTime)}</span>`;
      if (cookTime) html += `<span><strong>Cook Time:</strong> ${escapeHtml(cookTime)}</span>`;
      if (servings) html += `<span><strong>Servings:</strong> ${escapeHtml(servings)}</span>`;
      html += '</div>';
    }

    html += renderRemovedIngredientNote(lastRecipeState.removedIngredients);
    html += renderNutritionLabel(lastRecipeState.nutritionEstimate, lastRecipeState.usedIngredients);

    if (lastRecipeState.equipment.length > 0) {
      html += '<div class="rf-formatted-section rf-equipment-section rf-live-section">';
      html += '<h4>🍳 Bust out these tools:</h4>';
      html += '<div class="rf-equipment-tags">';
      lastRecipeState.equipment.forEach((tool) => {
        html += `<span class="rf-equip-tag">${escapeHtml(tool)}</span>`;
      });
      html += '</div></div>';
    }

    html += '<div class="rf-formatted-section rf-live-section">';
    html += '<h4>📝 Ingredients</h4>';
    html += '<ol class="rf-ingredients-list" id="rf-matched-list">';
    lastRecipeState.usedIngredients.forEach((ingredient, index) => {
      html += `<li><span class="rf-ing-text">${escapeHtml(ingredient)}</span> ${buildSubstitutionTooltip(ingredient, index, true)}</li>`;
    });
    html += '</ol></div>';

    html += '<div class="rf-formatted-section rf-live-section">';
    html += '<h4>🧑‍🍳 Instructions</h4>';
    html += '<div class="rf-instructions-preview">';
    lastRecipeState.instructions.forEach((paragraph) => {
      html += `<p>${escapeHtml(paragraph)}</p>`;
    });
    html += '</div></div>';

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

    const swapButtons = resultList.querySelectorAll<HTMLButtonElement>('.rf-swap-btn');
    swapButtons.forEach((button) => {
      button.addEventListener('click', (buttonEvent) => {
        const target = buttonEvent.currentTarget as HTMLButtonElement;
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
      });
    });
  });

  if (copyButton) {
    copyButton.addEventListener('click', () => {
      if (!lastRecipeState) {
        return;
      }

      navigator.clipboard.writeText(buildRecipeTextExport(lastRecipeState)).then(() => {
        flashActionButtonLabel(copyButton, 'Copied', 'Copy');
        showFormatterToast(pickDelightMessage('copy'), 'success');
      });
    });
  }

  if (pdfButton) {
    pdfButton.addEventListener('click', () => {
      if (lastRecipeState) {
        const didOpen = exportRecipeToPdf(lastRecipeState);
        if (didOpen) {
          flashActionButtonLabel(pdfButton, 'Opened', 'PDF');
          showFormatterToast(pickDelightMessage('pdf'), 'info');
        } else {
          showFormatterToast(pickDelightMessage('blocked'), 'warning');
        }
      }
    });
  }

  if (wordButton) {
    wordButton.addEventListener('click', () => {
      if (lastRecipeState) {
        exportRecipeToWord(lastRecipeState);
        flashActionButtonLabel(wordButton, 'Saved', 'Word');
        showFormatterToast(pickDelightMessage('word'), 'success');
      }
    });
  }

  if (markdownButton) {
    markdownButton.addEventListener('click', () => {
      if (lastRecipeState) {
        exportRecipeToMarkdown(lastRecipeState);
        flashActionButtonLabel(markdownButton, 'Saved', 'Markdown');
        showFormatterToast(pickDelightMessage('markdown'), 'success');
      }
    });
  }
}
