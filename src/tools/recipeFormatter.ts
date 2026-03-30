import { substitutions } from '../data/substitutionData';
import { formatRecipe } from '../utils/recipeFormatter';
import { buildNutritionEstimate, NutritionEstimate } from '../utils/nutritionCalculator';

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

function renderNutritionLabel(estimate: NutritionEstimate): string {
  if (estimate.matchedIngredientCount === 0) {
    return `
      <div class="rf-formatted-section rf-nutrition-shell">
        <div class="rf-nutrition-empty">
          <div class="rf-nutrition-empty-title">Nutrition Facts</div>
          <p>We could not estimate this recipe yet. Use lines like <strong>2 cups flour</strong> or <strong>3 eggs</strong> to generate a label.</p>
        </div>
      </div>
    `;
  }

  const perServing = estimate.perServingNutrition;
  const total = estimate.totalNutrition;
  const hasServings = estimate.servingsCount !== null;

  const nutrientRows = [
    { label: 'Total Fat', perServing: formatGramValue(perServing.fat), total: formatGramValue(total.fat) },
    { label: 'Saturated Fat', perServing: formatGramValue(perServing.saturatedFat), total: formatGramValue(total.saturatedFat), indented: true },
    { label: 'Sodium', perServing: formatMilligramValue(perServing.sodium), total: formatMilligramValue(total.sodium) },
    { label: 'Total Carb', perServing: formatGramValue(perServing.carbs), total: formatGramValue(total.carbs) },
    { label: 'Dietary Fiber', perServing: formatGramValue(perServing.fiber), total: formatGramValue(total.fiber), indented: true },
    { label: 'Total Sugars', perServing: formatGramValue(perServing.sugar), total: formatGramValue(total.sugar), indented: true },
    { label: 'Protein', perServing: formatGramValue(perServing.protein), total: formatGramValue(total.protein) }
  ];

  const servingsLabel = hasServings
    ? `${escapeHtml(estimate.servingsText ?? `${formatNumber(estimate.servingsCount!, 0)} servings`)} per recipe`
    : 'Serving count not provided';

  const servingSizeLabel = hasServings ? '1 serving' : 'Whole recipe';
  const coverageLabel = `${estimate.matchedIngredientCount} of ${estimate.totalIngredientCount} ingredients matched`;
  const unmatchedLabel = estimate.unmatchedIngredients.length > 0
    ? `Still missing: ${escapeHtml(estimate.unmatchedIngredients.join(', '))}`
    : 'All listed ingredients were included in the estimate.';

  return `
    <div class="rf-formatted-section rf-nutrition-shell">
      <div class="rf-nutrition-label" role="img" aria-label="Estimated nutrition facts">
        <div class="rf-nutrition-title-row">
          <div class="rf-nutrition-title">Nutrition Facts</div>
          <div class="rf-nutrition-estimate-pill">Estimate</div>
        </div>
        <div class="rf-nutrition-serving-line">${servingsLabel}</div>
        <div class="rf-nutrition-serving-size">
          <span>Serving size</span>
          <strong>${servingSizeLabel}</strong>
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
            <tr class="rf-nutrition-calories-row">
              <th scope="row">Calories</th>
              <td>${Math.round(perServing.calories)}</td>
              ${hasServings ? `<td>${Math.round(total.calories)}</td>` : ''}
            </tr>
            ${nutrientRows.map((row) => `
              <tr class="${row.indented ? 'rf-nutrition-sub-row' : ''}">
                <th scope="row">${row.label}</th>
                <td>${row.perServing}</td>
                ${hasServings ? `<td>${row.total}</td>` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="rf-nutrition-footnote">Calories and macros are estimated from recognized ingredients and entered serving count.</div>
      </div>

      <div class="rf-nutrition-summary">
        <div class="rf-nutrition-summary-chip">${coverageLabel}</div>
        <div class="rf-nutrition-summary-copy">${unmatchedLabel}</div>
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
        Format the recipe, reorder ingredients, and estimate a nutrition label in one pass.
      </div>

      <div id="formatter-result-section" class="rf-result-section hidden">
        <div class="rf-result-header" style="display: flex; justify-content: space-between; align-items: center;">
          <span>Recipe Preview</span>
          <button type="button" id="rf-copy-btn" class="icon-btn" title="Copy to Clipboard" aria-label="Copy recipe to clipboard" style="background:var(--md-sys-color-primary-container); color:var(--md-sys-color-on-primary-container); padding: 8px; border-radius: 50%;">
            <span class="material-icons">content_copy</span>
          </button>
        </div>
        <div id="formatted-ingredients-list" class="rf-formatted-list"></div>
      </div>
    </div>
  `;
}

export function attachRecipeFormatterListeners() {
  const form = document.querySelector<HTMLFormElement>('#recipe-formatter-form');
  const copyButton = document.querySelector<HTMLButtonElement>('#rf-copy-btn');
  let lastNutritionEstimate: NutritionEstimate | null = null;

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
    const nutritionEstimate = buildNutritionEstimate(ingredients, servings);

    lastNutritionEstimate = nutritionEstimate;

    const resultList = document.querySelector<HTMLDivElement>('#formatted-ingredients-list');
    const resultSection = document.querySelector<HTMLDivElement>('#formatter-result-section');

    if (!resultList || !resultSection) {
      return;
    }

    let html = '';

    if (prepTime || cookTime || servings) {
      html += '<div class="rf-preview-meta">';
      if (prepTime) html += `<span><strong>Prep Time:</strong> ${escapeHtml(prepTime)}</span>`;
      if (cookTime) html += `<span><strong>Cook Time:</strong> ${escapeHtml(cookTime)}</span>`;
      if (servings) html += `<span><strong>Servings:</strong> ${escapeHtml(servings)}</span>`;
      html += '</div>';
    }

    html += renderNutritionLabel(nutritionEstimate);

    if (formattedRecipe.equipment.length > 0) {
      html += '<div class="rf-formatted-section rf-equipment-section">';
      html += '<h4>🍳 Bust out these tools:</h4>';
      html += '<div class="rf-equipment-tags">';

      const uniqueTools = Array.from(new Set(formattedRecipe.equipment));
      uniqueTools.forEach((tool) => {
        html += `<span class="rf-equip-tag">${escapeHtml(tool)}</span>`;
      });

      html += '</div></div>';
    }

    html += '<div class="rf-formatted-section">';
    html += '<h4>📝 Ingredients</h4>';
    html += '<ol class="rf-ingredients-list" id="rf-matched-list">';
    formattedRecipe.reorderedIngredients.forEach((ingredient, index) => {
      html += `<li><span class="rf-ing-text">${escapeHtml(ingredient)}</span> ${buildSubstitutionTooltip(ingredient, index, true)}</li>`;
    });
    html += '</ol></div>';

    if (formattedRecipe.unmatchedIngredients.length > 0) {
      html += '<div class="rf-formatted-section">';
      html += '<h4>⚠️ Unmatched Ingredients (not explicitly mentioned in steps):</h4>';
      html += '<ul class="rf-ingredients-list" id="rf-unmatched-list">';
      formattedRecipe.unmatchedIngredients.forEach((ingredient, index) => {
        html += `<li><span class="rf-ing-text">${escapeHtml(ingredient)}</span> ${buildSubstitutionTooltip(ingredient, index, false)}</li>`;
      });
      html += '</ul></div>';
    }

    html += '<div class="rf-formatted-section">';
    html += '<h4>🧑‍🍳 Instructions</h4>';
    html += '<div class="rf-instructions-preview">';
    const paragraphs = instructions.split('\n').filter((paragraph) => paragraph.trim().length > 0);
    paragraphs.forEach((paragraph) => {
      html += `<p>${escapeHtml(paragraph)}</p>`;
    });
    html += '</div></div>';

    resultList.innerHTML = html;
    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    const swapButtons = resultList.querySelectorAll<HTMLButtonElement>('.rf-swap-btn');
    swapButtons.forEach((button) => {
      button.addEventListener('click', (buttonEvent) => {
        const target = buttonEvent.currentTarget as HTMLButtonElement;
        const substituteText = target.dataset.sub;

        if (!substituteText) {
          return;
        }

        const listItem = target.closest('li');
        if (listItem) {
          const textSpan = listItem.querySelector('.rf-ing-text');
          if (textSpan) {
            textSpan.textContent = substituteText;
          }

          const tooltip = listItem.querySelector('.rf-tooltip-container');
          if (tooltip) {
            tooltip.remove();
          }
        }

        const ingredientsTextarea = document.querySelector<HTMLTextAreaElement>('#formatter-ingredients');
        if (ingredientsTextarea) {
          const original = target.dataset.original;
          if (original) {
            ingredientsTextarea.value = ingredientsTextarea.value.replace(original, substituteText);
          }
        }

        form.requestSubmit();
      });
    });
  });

  if (copyButton) {
    copyButton.addEventListener('click', () => {
      const prepTime = document.querySelector<HTMLInputElement>('#formatter-prep')!.value;
      const cookTime = document.querySelector<HTMLInputElement>('#formatter-cook')!.value;
      const servings = document.querySelector<HTMLInputElement>('#formatter-servings')!.value;
      const instructions = document.querySelector<HTMLTextAreaElement>('#formatter-instructions')!.value;

      const matchedList = document.querySelector<HTMLOListElement>('#rf-matched-list');
      const unmatchedList = document.querySelector<HTMLUListElement>('#rf-unmatched-list');
      const equipmentContainer = document.querySelector<HTMLDivElement>('.rf-equipment-tags');

      let textToCopy = 'RECIPE\n\n';

      if (prepTime || cookTime || servings) {
        textToCopy += 'Meta:\n';
        if (prepTime) textToCopy += `- Prep Time: ${prepTime}\n`;
        if (cookTime) textToCopy += `- Cook Time: ${cookTime}\n`;
        if (servings) textToCopy += `- Servings: ${servings}\n`;
        textToCopy += '\n';
      }

      if (lastNutritionEstimate && lastNutritionEstimate.matchedIngredientCount > 0) {
        textToCopy += 'Nutrition Facts (Estimate):\n';
        textToCopy += `- Calories: ${Math.round(lastNutritionEstimate.perServingNutrition.calories)}${lastNutritionEstimate.servingsCount ? ' per serving' : ' total'}\n`;
        if (lastNutritionEstimate.servingsCount) {
          textToCopy += `- Whole Recipe Calories: ${Math.round(lastNutritionEstimate.totalNutrition.calories)}\n`;
        }
        textToCopy += `- Total Fat: ${formatGramValue(lastNutritionEstimate.perServingNutrition.fat)}\n`;
        textToCopy += `- Saturated Fat: ${formatGramValue(lastNutritionEstimate.perServingNutrition.saturatedFat)}\n`;
        textToCopy += `- Sodium: ${formatMilligramValue(lastNutritionEstimate.perServingNutrition.sodium)}\n`;
        textToCopy += `- Total Carbs: ${formatGramValue(lastNutritionEstimate.perServingNutrition.carbs)}\n`;
        textToCopy += `- Fiber: ${formatGramValue(lastNutritionEstimate.perServingNutrition.fiber)}\n`;
        textToCopy += `- Sugars: ${formatGramValue(lastNutritionEstimate.perServingNutrition.sugar)}\n`;
        textToCopy += `- Protein: ${formatGramValue(lastNutritionEstimate.perServingNutrition.protein)}\n`;
        textToCopy += `- Coverage: ${lastNutritionEstimate.matchedIngredientCount}/${lastNutritionEstimate.totalIngredientCount} ingredients matched\n`;

        if (lastNutritionEstimate.unmatchedIngredients.length > 0) {
          textToCopy += `- Missing Ingredients: ${lastNutritionEstimate.unmatchedIngredients.join(', ')}\n`;
        }

        textToCopy += '\n';
      }

      if (equipmentContainer) {
        const tags = Array.from(equipmentContainer.querySelectorAll('.rf-equip-tag'))
          .map((tag) => tag.textContent)
          .filter(Boolean)
          .join(', ');

        if (tags) {
          textToCopy += `Equipment Needed: ${tags}\n\n`;
        }
      }

      textToCopy += 'Ingredients:\n';

      if (matchedList) {
        Array.from(matchedList.children).forEach((listItem) => {
          const clone = listItem.cloneNode(true) as HTMLElement;
          const tooltip = clone.querySelector('.rf-tooltip-container');
          if (tooltip) {
            tooltip.remove();
          }
          textToCopy += `- ${clone.textContent?.trim()}\n`;
        });
      }

      if (unmatchedList && unmatchedList.children.length > 0) {
        textToCopy += '\nAdditional Ingredients:\n';
        Array.from(unmatchedList.children).forEach((listItem) => {
          const clone = listItem.cloneNode(true) as HTMLElement;
          const tooltip = clone.querySelector('.rf-tooltip-container');
          if (tooltip) {
            tooltip.remove();
          }
          textToCopy += `- ${clone.textContent?.trim()}\n`;
        });
      }

      textToCopy += `\nInstructions:\n${instructions}`;

      navigator.clipboard.writeText(textToCopy).then(() => {
        const icon = copyButton.querySelector('.material-icons');
        if (icon) {
          icon.textContent = 'check';
          setTimeout(() => {
            icon.textContent = 'content_copy';
          }, 2000);
        }
      });
    });
  }
}
