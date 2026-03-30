import { formatRecipe } from '../utils/recipeFormatter';
import { substitutions } from '../data/substitutionData';

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
            <input type="text" id="formatter-servings" class="rf-input" placeholder="e.g. 4 people">
          </div>
        </div>

        <div class="rf-input-group">
          <label for="formatter-ingredients" class="rf-label">Ingredients (one per line)</label>
          <textarea 
            id="formatter-ingredients" 
            class="rf-textarea"
            required 
            rows="6" 
            placeholder="2 cups flour&#10;1 cup sugar&#10;3 eggs&#10;1 tsp vanilla&#10;1/2 cup butter"
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
          <button type="submit" class="rf-btn-primary">Format Recipe 📝</button>
        </div>
      </form>

      <div class="rf-divider"></div>

      <div class="rf-footer">
        📝 Reorder ingredients to match instruction order
      </div>

      <div id="formatter-result-section" class="rf-result-section hidden">
        <div class="rf-result-header" style="display: flex; justify-content: space-between; align-items: center;">
          <span>Recipe Preview</span>
          <button type="button" id="rf-copy-btn" class="icon-btn" title="Copy to Clipboard" style="background:var(--md-sys-color-primary-container); color:var(--md-sys-color-on-primary-container); padding: 8px; border-radius: 50%;">
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

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const prepTime = (document.querySelector<HTMLInputElement>('#formatter-prep')!).value;
    const cookTime = (document.querySelector<HTMLInputElement>('#formatter-cook')!).value;
    const servings = (document.querySelector<HTMLInputElement>('#formatter-servings')!).value;

    const ingredientsText = (document.querySelector<HTMLTextAreaElement>('#formatter-ingredients')!).value;
    const instructions = (document.querySelector<HTMLTextAreaElement>('#formatter-instructions')!).value;

    const ingredients = ingredientsText.split('\n').filter(line => line.trim().length > 0);
    const result = formatRecipe(ingredients, instructions);

    const resultList = document.querySelector<HTMLDivElement>('#formatted-ingredients-list');
    const resultSection = document.querySelector<HTMLDivElement>('#formatter-result-section');

    if (resultList && resultSection) {

      const parseAmount = (text: string): number => {
        const match = text.trim().match(/^([\d\s\.\/]+)/);
        if (!match) return 1;

        let amountStr = match[1].trim();
        let total = 0;
        const parts = amountStr.split(' ');
        for (const part of parts) {
          if (part.includes('/')) {
            const [num, den] = part.split('/');
            if (den && !isNaN(Number(num)) && !isNaN(Number(den))) {
              total += Number(num) / Number(den);
            }
          } else if (!isNaN(Number(part))) {
            total += Number(part);
          }
        }
        return total || 1;
      };

      const getSubTooltip = (ingText: string, index: number, isMatched: boolean) => {
        const lowerText = ingText.toLowerCase();
        const foundSub = substitutions.find(sub => lowerText.includes(sub.ingredient.toLowerCase()));
        if (foundSub && foundSub.substitutes.length > 0) {

          // Rank substitutes: best > standard > vegan/emergency
          const rankedSubs = [...foundSub.substitutes].sort((a, b) => {
            const rank = { 'best': 1, 'standard': 2, 'vegan': 3, 'emergency': 4 };
            return (rank[a.matchQuality || 'standard'] || 5) - (rank[b.matchQuality || 'standard'] || 5);
          });

          const bestSub = rankedSubs[0];

          // Calculate proportional amount
          const recipeAmount = parseAmount(ingText);
          const multiplier = recipeAmount / (foundSub.baseAmount || 1);

          // Replace template portions like {1} or {0.5} by multiplying with the multiplier
          const subText = bestSub.ratio.replace(/\{([\d.]+)\}/g, (match, numStr) => {
            const baseVal = parseFloat(numStr);
            if (isNaN(baseVal)) return match;

            const calculated = baseVal * multiplier;
            // Format nicely: limit decimals, remove trailing zeros
            return Number.isInteger(calculated) ? calculated.toString() : parseFloat(calculated.toFixed(2)).toString();
          });

          return `<span class="rf-tooltip-container">
                    <span class="material-icons rf-tooltip-icon">info</span>
                    <span class="rf-tooltip-text">
                      <div style="margin-bottom: 8px;">${foundSub.icon} Substitute: <strong>${bestSub.substitute}</strong><br><small>(${subText})</small></div>
                      <button type="button" class="rf-swap-btn" title="Swap Ingredient" data-index="${index}" data-matched="${isMatched}" data-original="${ingText}" data-sub="${subText}">
                        <span class="material-icons" style="font-size: 1.2rem; margin-right: 4px;">swap_horiz</span> Swap
                      </button>
                    </span>
                  </span>`;
        }
        return '';
      };

      let html = '';

      // Meta data section
      if (prepTime || cookTime || servings) {
        html += '<div class="rf-preview-meta">';
        if (prepTime) html += `<span><strong>Prep Time:</strong> ${prepTime}</span>`;
        if (cookTime) html += `<span><strong>Cook Time:</strong> ${cookTime}</span>`;
        if (servings) html += `<span><strong>Servings:</strong> ${servings}</span>`;
        html += '</div>';
      }

      // Tools / Equipment section (Bust Out)
      if (result.equipment.length > 0) {
        html += '<div class="rf-formatted-section rf-equipment-section">';
        html += '<h4>🍳 Bust out these tools:</h4>';
        html += '<div class="rf-equipment-tags">';
        // Use a set to remove duplicates, format nice
        const uniqueTools = Array.from(new Set(result.equipment));
        uniqueTools.forEach(tool => {
          html += `<span class="rf-equip-tag">${tool}</span>`;
        });
        html += '</div></div>';
      }

      html += '<div class="rf-formatted-section">';
      html += '<h4>📝 Ingredients</h4>';
      html += '<ol class="rf-ingredients-list" id="rf-matched-list">';
      result.reorderedIngredients.forEach((ing, i) => {
        html += `<li><span class="rf-ing-text">${ing}</span> ${getSubTooltip(ing, i, true)}</li>`;
      });
      html += '</ol></div>';

      if (result.unmatchedIngredients.length > 0) {
        html += '<div class="rf-formatted-section">';
        html += '<h4>⚠️ Unmatched Ingredients (not explicitly mentioned in steps):</h4>';
        html += '<ul class="rf-ingredients-list" id="rf-unmatched-list">';
        result.unmatchedIngredients.forEach((ing, i) => {
          html += `<li><span class="rf-ing-text">${ing}</span> ${getSubTooltip(ing, i, false)}</li>`;
        });
        html += '</ul></div>';
      }

      // Append Instructions to the preview
      html += '<div class="rf-formatted-section">';
      html += '<h4>🧑‍🍳 Instructions</h4>';
      html += '<div class="rf-instructions-preview">';
      // parse newlines into paragraphs
      const pars = instructions.split('\n').filter(p => p.trim().length > 0);
      pars.forEach(p => {
        html += `<p>${p}</p>`;
      });
      html += '</div></div>';

      resultList.innerHTML = html;
      resultSection.classList.remove('hidden');
      resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      // Wire up swap buttons
      const swapBtns = resultList.querySelectorAll<HTMLButtonElement>('.rf-swap-btn');
      swapBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const target = e.currentTarget as HTMLButtonElement;
          const subText = target.dataset.sub;

          if (subText) {
            // visually update the UI list item
            const li = target.closest('li');
            if (li) {
              const textSpan = li.querySelector('.rf-ing-text');
              if (textSpan) textSpan.textContent = subText;
              // remove tooltip so you can't swap a swap
              const tooltip = li.querySelector('.rf-tooltip-container');
              if (tooltip) tooltip.remove();
            }

            // optionally update the main textarea
            const textarea = document.querySelector<HTMLTextAreaElement>('#formatter-ingredients');
            if (textarea) {
              const original = target.dataset.original;
              if (original) {
                textarea.value = textarea.value.replace(original, subText);
              }
            }
          }
        });
      });
    }
  });

  const copyBtn = document.querySelector<HTMLButtonElement>('#rf-copy-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const prepTime = (document.querySelector<HTMLInputElement>('#formatter-prep')!).value;
      const cookTime = (document.querySelector<HTMLInputElement>('#formatter-cook')!).value;
      const servings = (document.querySelector<HTMLInputElement>('#formatter-servings')!).value;
      const instructions = (document.querySelector<HTMLTextAreaElement>('#formatter-instructions')!).value;

      const matchedList = document.querySelector<HTMLOListElement>('#rf-matched-list');
      const unmatchedList = document.querySelector<HTMLUListElement>('#rf-unmatched-list');
      const equipTagsContainer = document.querySelector<HTMLDivElement>('.rf-equipment-tags');

      let textToCopy = "RECIPE\n\n";

      if (prepTime || cookTime || servings) {
        textToCopy += "Meta:\n";
        if (prepTime) textToCopy += `- Prep Time: ${prepTime}\n`;
        if (cookTime) textToCopy += `- Cook Time: ${cookTime}\n`;
        if (servings) textToCopy += `- Servings: ${servings}\n`;
        textToCopy += "\n";
      }

      if (equipTagsContainer) {
        const tags = Array.from(equipTagsContainer.querySelectorAll('.rf-equip-tag')).map(t => t.textContent).join(', ');
        textToCopy += `Equipment Needed: ${tags}\n\n`;
      }

      textToCopy += "Ingredients:\n";

      if (matchedList) {
        Array.from(matchedList.children).forEach(li => {
          // clone node to remove tooltip text from copy
          const clone = li.cloneNode(true) as HTMLElement;
          const tooltip = clone.querySelector('.rf-tooltip-container');
          const swapBtn = clone.querySelector('.rf-swap-btn');
          if (tooltip) tooltip.remove();
          if (swapBtn) swapBtn.remove();
          textToCopy += "- " + clone.textContent?.trim() + "\n";
        });
      }

      if (unmatchedList) {
        textToCopy += "\nAdditional Ingredients:\n";
        Array.from(unmatchedList.children).forEach(li => {
          const clone = li.cloneNode(true) as HTMLElement;
          const tooltip = clone.querySelector('.rf-tooltip-container');
          const swapBtn = clone.querySelector('.rf-swap-btn');
          if (tooltip) tooltip.remove();
          if (swapBtn) swapBtn.remove();
          textToCopy += "- " + clone.textContent?.trim() + "\n";
        });
      }

      textToCopy += "\nInstructions:\n" + instructions;

      navigator.clipboard.writeText(textToCopy).then(() => {
        const icon = copyBtn.querySelector('.material-icons')!;
        icon.textContent = 'check';
        setTimeout(() => icon.textContent = 'content_copy', 2000);
      });
    });
  }
}
