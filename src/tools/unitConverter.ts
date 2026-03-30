import {
  convertVolume,
  convertWeight,
  convertTemperature,
  type VolumeUnit,
  type WeightUnit,
  type TemperatureUnit
} from '../utils/unitConversion';

export function renderUnitConverter(): string {
  return `
    <div class="card unit-converter-card">
      <div class="tool-header">
        <h2>⚖️ Universal Unit Converter</h2>
        <p>Instant precision conversions for cooking</p>
      </div>

      <div class="uc-categories">
        <button class="uc-cat active" data-category="volume"><span class="material-icons">water_drop</span> Volume</button>
        <button class="uc-cat" data-category="weight"><span class="material-icons">scale</span> Weight</button>
        <button class="uc-cat" data-category="temperature"><span class="material-icons">thermostat</span> Temp</button>
      </div>

      <div class="uc-workbench">
        <!-- LEFT PANE -->
        <div class="uc-pane">
          <div class="uc-input-wrapper">
            <button class="icon-btn uc-adjust" id="uc-left-dec" title="Decrease"><span class="material-icons">remove</span></button>
            <input type="text" id="uc-left-input" class="uc-value" value="1" />
            <button class="icon-btn uc-adjust" id="uc-left-inc" title="Increase"><span class="material-icons">add</span></button>
          </div>
          <select id="uc-from" class="uc-select">
              <optgroup label="Volume Units">
                  <option value="cup">Cup</option>
                  <option value="ml">Milliliter</option>
                  <option value="floz">Fluid Ounce</option>
                  <option value="liter">Liter</option>
                  <option value="tbsp">Tablespoon</option>
                  <option value="tsp">Teaspoon</option>
              </optgroup>
          </select>
        </div>

        <!-- SWAP BUTTON -->
        <button id="uc-swap-btn" class="icon-btn uc-swap" title="Swap Units">
          <span class="material-icons">swap_horiz</span>
        </button>

        <!-- RIGHT PANE -->
        <div class="uc-pane uc-result-pane">
          <div class="uc-input-wrapper">
            <button class="icon-btn uc-adjust" id="uc-right-dec" title="Decrease"><span class="material-icons">remove</span></button>
            <input type="text" id="uc-right-input" class="uc-value output" value="" />
            <button class="icon-btn uc-adjust" id="uc-right-inc" title="Increase"><span class="material-icons">add</span></button>
          </div>
          <select id="uc-to" class="uc-select">
              <optgroup label="Volume Units">
                  <option value="cup">Cup</option>
                  <option value="ml" selected>Milliliter</option>
                  <option value="floz">Fluid Ounce</option>
                  <option value="liter">Liter</option>
                  <option value="tbsp">Tablespoon</option>
                  <option value="tsp">Teaspoon</option>
              </optgroup>
          </select>
        </div>
      </div>
    </div>
  `;
}

// Helpers
function parseFraction(val: string): number {
  if (!val) return 0;
  const parts = val.trim().split(/\s+/);
  let total = 0;
  for (const p of parts) {
    if (p.includes('/')) {
      const [num, den] = p.split('/');
      total += (parseFloat(num) || 0) / (parseFloat(den) || 1);
    } else {
      total += parseFloat(p) || 0;
    }
  }
  return total;
}

function formatFraction(val: number, unit: string): string {
  const fractionUnits = ['cup', 'tbsp', 'tsp', 'oz', 'lb', 'floz'];
  if (!fractionUnits.includes(unit)) {
    let formatted = val.toFixed(2);
    if (formatted.endsWith('.00')) formatted = val.toFixed(0);
    return formatted;
  }

  if (val === 0) return "0";
  const whole = Math.floor(val);
  const fraction = val - whole;
  let fractionStr = "";

  const tolerance = 0.05;
  if (Math.abs(fraction) < tolerance && whole > 0) return whole.toString();
  if (Math.abs(fraction - 1 / 8) < tolerance) fractionStr = "1/8";
  else if (Math.abs(fraction - 1 / 4) < tolerance) fractionStr = "1/4";
  else if (Math.abs(fraction - 1 / 3) < tolerance) fractionStr = "1/3";
  else if (Math.abs(fraction - 3 / 8) < tolerance) fractionStr = "3/8";
  else if (Math.abs(fraction - 1 / 2) < tolerance) fractionStr = "1/2";
  else if (Math.abs(fraction - 5 / 8) < tolerance) fractionStr = "5/8";
  else if (Math.abs(fraction - 2 / 3) < tolerance) fractionStr = "2/3";
  else if (Math.abs(fraction - 3 / 4) < tolerance) fractionStr = "3/4";
  else if (Math.abs(fraction - 7 / 8) < tolerance) fractionStr = "7/8";
  else if (Math.abs(fraction - 1) < tolerance) return (whole + 1).toString();
  else {
    let formatted = val.toFixed(2);
    if (formatted.endsWith('.00')) formatted = val.toFixed(0);
    return formatted;
  }

  if (whole > 0 && fractionStr) return `${whole} ${fractionStr}`;
  else if (fractionStr) return fractionStr;
  else return whole.toString();
}

function getStepValue(current: number, direction: 1 | -1, unit: string): number {
  const fractionUnits = ['cup', 'tbsp', 'tsp', 'oz', 'lb', 'floz'];
  if (!fractionUnits.includes(unit)) {
    let step = 1;
    if (current >= 100) step = 10;
    else if (current >= 10) step = 5;
    else if (current < 1 && current > 0) step = 0.1;

    if (direction === 1) {
      return Math.floor(current / step) * step + step;
    } else {
      let next = Math.ceil(current / step) * step - step;
      return next < 0 ? 0 : next;
    }
  }

  const steps = [0, 0.25, 0.333, 0.5, 0.666, 0.75, 1];
  let whole = Math.floor(current);
  let frac = current - whole;

  let closestIdx = 0;
  let minDiff = 100;
  for (let i = 0; i < steps.length; i++) {
    const diff = Math.abs(frac - steps[i]);
    if (diff < minDiff) {
      minDiff = diff;
      closestIdx = i;
    }
  }

  if (direction === 1) {
    closestIdx++;
    if (closestIdx >= steps.length) {
      return whole + 1 + steps[1];
    } else {
      return whole + steps[closestIdx];
    }
  } else {
    closestIdx--;
    if (closestIdx < 0) {
      if (whole === 0) return 0;
      return whole - 1 + steps[steps.length - 2];
    } else {
      return whole + steps[closestIdx];
    }
  }
}

export function attachUnitConverterListeners() {
  const categories = document.querySelectorAll<HTMLButtonElement>('.uc-cat');
  const leftInput = document.querySelector<HTMLInputElement>('#uc-left-input');
  const rightInput = document.querySelector<HTMLInputElement>('#uc-right-input');
  const fromSelect = document.querySelector<HTMLSelectElement>('#uc-from');
  const toSelect = document.querySelector<HTMLSelectElement>('#uc-to');
  const swapBtn = document.querySelector<HTMLButtonElement>('#uc-swap-btn');

  const leftInc = document.querySelector<HTMLButtonElement>('#uc-left-inc');
  const leftDec = document.querySelector<HTMLButtonElement>('#uc-left-dec');
  const rightInc = document.querySelector<HTMLButtonElement>('#uc-right-inc');
  const rightDec = document.querySelector<HTMLButtonElement>('#uc-right-dec');

  if (!categories.length || !leftInput || !rightInput || !fromSelect || !toSelect || !swapBtn) return;

  const updateUnitOptions = (category: string) => {
    let options: { value: string; label: string }[] = [];
    let groupLabel = "";

    if (category === 'volume') {
      groupLabel = "Volume Units";
      options = [
        { value: 'cup', label: 'Cup' },
        { value: 'ml', label: 'Milliliter' },
        { value: 'floz', label: 'Fluid Ounce' },
        { value: 'liter', label: 'Liter' },
        { value: 'tbsp', label: 'Tablespoon' },
        { value: 'tsp', label: 'Teaspoon' },
      ];
    } else if (category === 'weight') {
      groupLabel = "Weight Units";
      options = [
        { value: 'oz', label: 'Ounce' },
        { value: 'gram', label: 'Gram' },
        { value: 'lb', label: 'Pound' },
        { value: 'kg', label: 'Kilogram' },
      ];
    } else if (category === 'temperature') {
      groupLabel = "Temperature Units";
      options = [
        { value: 'fahrenheit', label: 'Fahrenheit' },
        { value: 'celsius', label: 'Celsius' },
      ];
    }

    const html = `<optgroup label="${groupLabel}">` +
      options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('') +
      `</optgroup>`;

    fromSelect.innerHTML = html;
    toSelect.innerHTML = html;
    if (options.length > 1) toSelect.selectedIndex = 1;
    calculate('left');
  };

  const calculate = (source: 'left' | 'right' = 'left') => {
    const activeCat = document.querySelector<HTMLButtonElement>('.uc-cat.active')?.dataset.category;

    // Default empty strings to 0
    const inStr = source === 'left' ? leftInput.value : rightInput.value;
    const inVal = parseFraction(inStr);
    const inUnit = source === 'left' ? fromSelect.value : toSelect.value;
    const outUnit = source === 'left' ? toSelect.value : fromSelect.value;

    let result = 0;
    if (activeCat === 'volume') {
      result = convertVolume(inVal, inUnit as VolumeUnit, outUnit as VolumeUnit);
    } else if (activeCat === 'weight') {
      result = convertWeight(inVal, inUnit as WeightUnit, outUnit as WeightUnit);
    } else if (activeCat === 'temperature') {
      result = convertTemperature(inVal, inUnit as TemperatureUnit, outUnit as TemperatureUnit);
    }

    if (source === 'left') {
      rightInput.value = formatFraction(result, outUnit);
    } else {
      leftInput.value = formatFraction(result, outUnit);
    }
  };

  const handleStep = (source: 'left' | 'right', direction: 1 | -1) => {
    const input = source === 'left' ? leftInput : rightInput;
    const unit = source === 'left' ? fromSelect.value : toSelect.value;
    const current = parseFraction(input.value);
    const next = getStepValue(current, direction, unit);
    input.value = formatFraction(next, unit);
    calculate(source);
  }

  // Category switching
  categories.forEach(btn => {
    btn.addEventListener('click', () => {
      categories.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      leftInput.value = "1";
      updateUnitOptions(btn.dataset.category || 'volume');
    });
  });

  // Swap button (swaps both values and units)
  swapBtn.addEventListener('click', () => {
    const tempUnit = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = tempUnit;

    const tempVal = leftInput.value;
    leftInput.value = rightInput.value;
    rightInput.value = tempVal;

    calculate('left');
  });

  // Real-time calculation listeners
  leftInput.addEventListener('input', () => calculate('left'));
  rightInput.addEventListener('input', () => calculate('right'));

  // Format fractions nicely on blur
  leftInput.addEventListener('blur', () => {
    leftInput.value = formatFraction(parseFraction(leftInput.value), fromSelect.value);
  });
  rightInput.addEventListener('blur', () => {
    rightInput.value = formatFraction(parseFraction(rightInput.value), toSelect.value);
  });

  fromSelect.addEventListener('change', () => calculate('left'));
  toSelect.addEventListener('change', () => calculate('left'));

  // Button listeners
  leftInc?.addEventListener('click', () => handleStep('left', 1));
  leftDec?.addEventListener('click', () => handleStep('left', -1));
  rightInc?.addEventListener('click', () => handleStep('right', 1));
  rightDec?.addEventListener('click', () => handleStep('right', -1));

  // Initial calculation
  calculate('left');
}
