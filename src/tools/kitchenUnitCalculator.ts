import {
  ingredientYields,
  IngredientYield,
  convertCupsToPounds,
  convertPoundsToCups,
  convertCupsToGrams,
  convertGramsToCups
} from '../utils/kitchenUnitCalculator';
import { formatResult } from '../utils/unitConversion';

export function renderKitchenUnitCalculator(): string {
  return `
    <div class="card scaler-card">
      <div class="tool-header">
        <h2>🧮 Kitchen Unit Calculator</h2>
        <p>Convert seamlessly between cups, pounds, and grams for specific ingredients</p>
      </div>

      <div class="tc-dashboard">
        <!-- LEFT PANE: SOURCE -->
        <div class="tc-pane source-pane" style="display: flex; flex-direction: column; gap: 16px;">
          <div class="tc-adjuster-group">
            <label class="tc-label">Ingredient</label>
            <select id="kuc-ingredient" class="uc-select">
              ${ingredientYields.map((ing: IngredientYield) => `
                <option value="${ing.ingredient}">${ing.icon} ${ing.ingredient}</option>
              `).join('')}
            </select>
          </div>

          <div class="tc-adjuster-group">
            <label class="tc-label">Amount</label>
            <div class="uc-input-wrapper tc-input-wrapper">
              <button type="button" class="icon-btn uc-adjust" id="kuc-dec" title="Decrease Amount"><span class="material-icons">remove</span></button>
              <input type="number" id="kuc-amount" class="uc-value" value="1" min="0" step="0.25" />
              <button type="button" class="icon-btn uc-adjust" id="kuc-inc" title="Increase Amount"><span class="material-icons">add</span></button>
            </div>
          </div>

          <div class="tc-adjuster-group">
            <label class="tc-label">From</label>
            <select id="kuc-from" class="uc-select">
              <option value="cups">Cups</option>
              <option value="pounds">Pounds</option>
              <option value="grams">Grams</option>
            </select>
          </div>
        </div>

        <!-- RIGHT PANE: TARGET RESULTS -->
        <div class="tc-pane target-pane" style="display: flex; flex-direction: column;">
          <label class="tc-label" style="text-align: center; margin-bottom: 16px; font-size: 1rem;">Conversion Results</label>
          <div style="display: flex; flex-direction: column; gap: 12px; flex: 1; justify-content: center;">
            <div style="background: var(--md-sys-color-surface); border-radius: 16px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; box-shadow: var(--elevation-1);">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="material-icons" style="color: var(--md-sys-color-primary); opacity: 0.8;">local_cafe</span>
                <span style="font-weight: 600; color: var(--md-sys-color-on-surface-variant);">Cups</span>
              </div>
              <span id="kuc-res-cups" class="tc-primary-num" style="font-size: 2.2rem;">0</span>
            </div>
            <div style="background: var(--md-sys-color-surface); border-radius: 16px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; box-shadow: var(--elevation-1);">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="material-icons" style="color: var(--md-sys-color-primary); opacity: 0.8;">monitor_weight</span>
                <span style="font-weight: 600; color: var(--md-sys-color-on-surface-variant);">Pounds</span>
              </div>
              <span id="kuc-res-pounds" class="tc-primary-num" style="font-size: 2.2rem;">0</span>
            </div>
            <div style="background: var(--md-sys-color-surface); border-radius: 16px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; box-shadow: var(--elevation-1);">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="material-icons" style="color: var(--md-sys-color-primary); opacity: 0.8;">scale</span>
                <span style="font-weight: 600; color: var(--md-sys-color-on-surface-variant);">Grams</span>
              </div>
              <span id="kuc-res-grams" class="tc-primary-num" style="font-size: 2.2rem;">0</span>
            </div>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>💡 Tip: Results adjust automatically using average ingredient densities.</p>
      </div>
    </div>
  `;
}

export function attachKitchenUnitCalculatorListeners() {
  const ingredientSelect = document.querySelector<HTMLSelectElement>('#kuc-ingredient');
  const fromSelect = document.querySelector<HTMLSelectElement>('#kuc-from');

  const amountInput = document.querySelector<HTMLInputElement>('#kuc-amount');
  const decBtn = document.querySelector<HTMLButtonElement>('#kuc-dec');
  const incBtn = document.querySelector<HTMLButtonElement>('#kuc-inc');

  const cupsEl = document.querySelector<HTMLSpanElement>('#kuc-res-cups');
  const poundsEl = document.querySelector<HTMLSpanElement>('#kuc-res-pounds');
  const gramsEl = document.querySelector<HTMLSpanElement>('#kuc-res-grams');

  if (!ingredientSelect || !amountInput || !fromSelect || !cupsEl || !poundsEl || !gramsEl) return;

  const calculate = () => {
    const ingredient = ingredientSelect.value;
    const amount = parseFloat(amountInput.value) || 0;
    const fromUnit = fromSelect.value;

    let cups = 0, pounds = 0, grams = 0;

    if (fromUnit === 'cups') {
      cups = amount;
      pounds = convertCupsToPounds(ingredient, amount);
      grams = convertCupsToGrams(ingredient, amount);
    } else if (fromUnit === 'pounds') {
      pounds = amount;
      cups = convertPoundsToCups(ingredient, amount);
      grams = convertCupsToGrams(ingredient, cups);
    } else if (fromUnit === 'grams') {
      grams = amount;
      cups = convertGramsToCups(ingredient, amount);
      pounds = convertCupsToPounds(ingredient, cups);
    }

    cupsEl.textContent = formatResult(cups);
    poundsEl.textContent = formatResult(pounds);
    gramsEl.textContent = formatResult(grams);
  };

  // Prevent default form submission from existing anywhere, 
  // although we removed the form tag, good to be safe with adjusters
  decBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    const customStep = fromSelect.value === 'grams' ? 10 : 0.25;
    const val = parseFloat(amountInput.value) || 0;
    amountInput.value = Math.max(0, val - customStep).toString();
    calculate();
  });

  incBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    const customStep = fromSelect.value === 'grams' ? 10 : 0.25;
    const val = parseFloat(amountInput.value) || 0;
    amountInput.value = (val + customStep).toString();
    calculate();
  });

  // Handle step attribute changes dynamically for Grams vs Cups/Pounds
  fromSelect.addEventListener('change', () => {
    if (fromSelect.value === 'grams') {
      amountInput.step = "5";
      // If they had 1 cup, let's auto convert it cleanly or just leave value
      const val = parseFloat(amountInput.value) || 0;
      if (val < 10) amountInput.value = "100";
    } else {
      amountInput.step = "0.25";
      const val = parseFloat(amountInput.value) || 0;
      if (val > 10) amountInput.value = "1";
    }
    calculate();
  });

  ingredientSelect.addEventListener('change', calculate);
  amountInput.addEventListener('input', calculate);

  // Initial run
  calculate();
}
