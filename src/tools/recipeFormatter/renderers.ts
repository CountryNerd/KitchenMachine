import { substitutions } from '../../data/substitutionData';
import type { NutritionEstimate } from '../../utils/nutritionCalculator';
import {
  escapeAttribute,
  escapeHtml,
  formatGramValue,
  formatIngredientDisplayName,
  formatMilligramValue,
  parseAmount,
  getRecipeDisplayTitle
} from './helpers';
import type { NutritionRowData, RecipeExportState } from './types';

export function buildNutritionRows(estimate: NutritionEstimate): NutritionRowData[] {
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

export function buildNutritionTrustCopy(estimate: NutritionEstimate): string {
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

export function buildRecipeIngredientStatement(usedIngredients: string[], estimate: NutritionEstimate): string {
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

export function renderRecipeSheet(state: RecipeExportState): string {
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
