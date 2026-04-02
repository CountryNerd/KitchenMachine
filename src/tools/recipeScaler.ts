import { scaleRecipe } from '../utils/recipeScaler';

export function renderRecipeScaler(): string {
  return `
    <div class="card scaler-card">
      <div class="tool-header">
        <h2>Recipe Scaler</h2>
        <p>Scale any ingredient list.</p>
      </div>

      <div class="rs-dashboard tc-dashboard">
        <!-- LEFT PANE: SOURCE -->
        <div class="rs-pane tc-pane source-pane">
          <div class="tc-adjuster-group">
            <label class="tc-label">Original Servings</label>
            <div class="uc-input-wrapper tc-input-wrapper">
              <button type="button" class="icon-btn uc-adjust" id="rs-orig-dec" title="Decrease Original Servings"><span class="material-icons">remove</span></button>
              <input type="number" id="rs-original" class="uc-value" value="4" min="1" max="999" />
              <button type="button" class="icon-btn uc-adjust" id="rs-orig-inc" title="Increase Original Servings"><span class="material-icons">add</span></button>
            </div>
          </div>
          
          <div class="rs-group" style="display: flex; flex-direction: column; flex: 1;">
            <label class="tc-label">Ingredients (one per line)</label>
            <textarea 
              id="rs-ingredients" 
              class="rs-textarea"
              placeholder="2 cups flour&#10;1/2 cup sugar&#10;3 eggs&#10;1 tsp vanilla"
            ></textarea>
          </div>
        </div>

        <!-- MIDDLE ARROW -->
        <div class="tc-swap-container">
          <div class="uc-swap" style="cursor: default; transform: none;">
            <span class="material-icons">arrow_forward</span>
          </div>
        </div>

        <!-- RIGHT PANE: TARGET -->
        <div class="rs-pane tc-pane target-pane">
          <div class="tc-adjuster-group">
            <label class="tc-label">New Servings</label>
            <div class="uc-input-wrapper tc-input-wrapper">
              <button type="button" class="icon-btn uc-adjust" id="rs-new-dec" title="Decrease New Servings"><span class="material-icons">remove</span></button>
              <input type="number" id="rs-new" class="uc-value" value="8" min="1" max="999" />
              <button type="button" class="icon-btn uc-adjust" id="rs-new-inc" title="Increase New Servings"><span class="material-icons">add</span></button>
            </div>
          </div>

          <div class="rs-group rs-results-group" style="display: flex; flex-direction: column; flex: 1;">
            <label class="tc-label">Scaled Ingredients</label>
            <div id="rs-results" class="rs-results-box" style="margin-bottom: 12px;">
              <div class="rs-empty-state">
                 <p style="color: var(--md-sys-color-on-primary-container); opacity: 0.82; font-weight: 500;">Add ingredients to see the scaled list.</p>
              </div>
            </div>
            <button class="action-btn timer-pulse-btn" id="rs-copy-btn" style="align-self: flex-end; padding: 10px 20px; font-size: 0.95rem; margin-top: 0; display: none;">
              <span class="material-icons" style="font-size: 1.2rem;">content_copy</span>
              Copy List
            </button>
          </div>
        </div>
      </div>
      
      <div class="footer">
        <p>Paste one ingredient per line.</p>
      </div>
    </div>
  `;
}

export function attachRecipeScalerListeners() {
  const origDec = document.querySelector<HTMLButtonElement>('#rs-orig-dec');
  const origInc = document.querySelector<HTMLButtonElement>('#rs-orig-inc');
  const originalInput = document.querySelector<HTMLInputElement>('#rs-original');

  const newDec = document.querySelector<HTMLButtonElement>('#rs-new-dec');
  const newInc = document.querySelector<HTMLButtonElement>('#rs-new-inc');
  const newInput = document.querySelector<HTMLInputElement>('#rs-new');

  const ingredientsInput = document.querySelector<HTMLTextAreaElement>('#rs-ingredients');
  const resultsBox = document.querySelector<HTMLDivElement>('#rs-results');
  const copyBtn = document.querySelector<HTMLButtonElement>('#rs-copy-btn');

  if (!originalInput || !newInput || !ingredientsInput || !resultsBox) return;

  const calculate = () => {
    const originalServings = parseInt(originalInput.value) || 1;
    const newServings = parseInt(newInput.value) || 1;
    const ingredientsText = ingredientsInput.value;

    const ingredients = ingredientsText.split('\n').filter(line => line.trim().length > 0);

    if (ingredients.length === 0) {
      resultsBox.innerHTML = `
        <div class="rs-empty-state">
           <p style="color: var(--md-sys-color-on-primary-container); opacity: 0.82; font-weight: 500;">Add ingredients to see the scaled list.</p>
        </div>
      `;
      if (copyBtn) copyBtn.style.display = 'none';
      return;
    }

    const scaled = scaleRecipe(ingredients, originalServings, newServings);

    resultsBox.innerHTML = `<div class="scaled-list-container">` + scaled.map(item => `
      <div class="scaled-ingredient-item">
        <div class="scaled-original">${item.original}</div>
        <div class="scaled-arrow"><span class="material-icons">arrow_right_alt</span></div>
        <div class="scaled-new" data-scaled-value="${item.scaled}">${item.scaled}</div>
      </div>
    `).join('') + `</div>`;

    if (copyBtn) copyBtn.style.display = 'flex';
  };

  // Copy button logic
  copyBtn?.addEventListener('click', () => {
    const scaledItems = resultsBox.querySelectorAll('.scaled-new');
    if (scaledItems.length === 0) return;

    const copyText = Array.from(scaledItems)
      .map(el => el.getAttribute('data-scaled-value') || el.textContent)
      .join('\n');

    navigator.clipboard.writeText(copyText).then(() => {
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = '<span class="material-icons" style="font-size: 1.2rem;">check</span>Copied!';
      copyBtn.classList.add('clicked');

      setTimeout(() => {
        copyBtn.innerHTML = originalText;
        copyBtn.classList.remove('clicked');
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  });

  // Adjusters
  origDec?.addEventListener('click', () => {
    originalInput.value = Math.max(1, parseInt(originalInput.value) - 1).toString();
    calculate();
  });
  origInc?.addEventListener('click', () => {
    originalInput.value = (parseInt(originalInput.value) + 1).toString();
    calculate();
  });

  newDec?.addEventListener('click', () => {
    newInput.value = Math.max(1, parseInt(newInput.value) - 1).toString();
    calculate();
  });
  newInc?.addEventListener('click', () => {
    newInput.value = (parseInt(newInput.value) + 1).toString();
    calculate();
  });

  // Direct Input Listeners
  originalInput.addEventListener('input', calculate);
  newInput.addEventListener('input', calculate);
  ingredientsInput.addEventListener('input', calculate);

  // Initial render handles empty state
  calculate();
}
