import { convert, type DeviceType } from '../utils/conversion';

export function renderTemperatureConverter(): string {
  return `
    <div class="card temp-converter-card">
      <div class="tool-header">
        <h2>Device Converter</h2>
        <p>Convert time and temperature between devices.</p>
      </div>

      <div class="tc-dashboard">
        <!-- LEFT PANE: SOURCE -->
        <div class="tc-pane source-pane">
          <div class="tc-device-select">
            <label class="tc-label">From Device</label>
            <select id="tc-source" class="uc-select">
              <option value="oven">Oven</option>
              <option value="convection">Convection Oven</option>
              <option value="airfryer">Air Fryer</option>
              <option value="grill">Grill</option>
            </select>
          </div>

          <div class="tc-adjusters">
            <div class="tc-adjuster-group">
              <label class="tc-label">Temp (°F)</label>
              <div class="uc-input-wrapper tc-input-wrapper">
                <button class="icon-btn uc-adjust" id="tc-temp-dec" title="Decrease Temp"><span class="material-icons">remove</span></button>
                <input type="number" id="tc-temp-input" class="uc-value" value="350" min="0" max="600" step="5" />
                <button class="icon-btn uc-adjust" id="tc-temp-inc" title="Increase Temp"><span class="material-icons">add</span></button>
              </div>
            </div>

            <div class="tc-adjuster-group">
              <label class="tc-label">Time (min)</label>
              <div class="uc-input-wrapper tc-input-wrapper">
                <button class="icon-btn uc-adjust" id="tc-time-dec" title="Decrease Time"><span class="material-icons">remove</span></button>
                <input type="number" id="tc-time-input" class="uc-value" value="30" min="1" max="600" step="1" />
                <button class="icon-btn uc-adjust" id="tc-time-inc" title="Increase Time"><span class="material-icons">add</span></button>
              </div>
            </div>
          </div>
        </div>

        <!-- SWAP BUTTON -->
        <div class="tc-swap-container">
          <button id="tc-swap-btn" class="icon-btn uc-swap" title="Swap Devices">
            <span class="material-icons">swap_horiz</span>
          </button>
        </div>

        <!-- RIGHT PANE: TARGET -->
        <div class="tc-pane target-pane">
          <div class="tc-device-select">
            <label class="tc-label">To Device</label>
            <select id="tc-target" class="uc-select">
              <option value="oven">Oven</option>
              <option value="convection">Convection Oven</option>
              <option value="airfryer" selected>Air Fryer</option>
              <option value="grill">Grill</option>
            </select>
          </div>

          <div class="tc-results">
            <div class="tc-result-group">
              <label class="tc-label">Converted Temp</label>
              <div class="tc-result-value">
                <span id="tc-result-temp" class="tc-primary-num">325</span>
                <span class="tc-unit">°F</span>
              </div>
            </div>

            <div class="tc-result-group">
              <label class="tc-label">Converted Time</label>
              <div class="tc-result-value">
                <span id="tc-result-time" class="tc-primary-num">24</span>
                <span class="tc-unit">min</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>Use these as starting points. Check doneness with a thermometer.</p>
      </div>
    </div>
  `;
}

export function attachTemperatureConverterListeners() {
  const sourceSelect = document.querySelector<HTMLSelectElement>('#tc-source');
  const targetSelect = document.querySelector<HTMLSelectElement>('#tc-target');
  const tempInput = document.querySelector<HTMLInputElement>('#tc-temp-input');
  const timeInput = document.querySelector<HTMLInputElement>('#tc-time-input');
  const swapBtn = document.querySelector<HTMLButtonElement>('#tc-swap-btn');

  const tempDec = document.querySelector<HTMLButtonElement>('#tc-temp-dec');
  const tempInc = document.querySelector<HTMLButtonElement>('#tc-temp-inc');
  const timeDec = document.querySelector<HTMLButtonElement>('#tc-time-dec');
  const timeInc = document.querySelector<HTMLButtonElement>('#tc-time-inc');

  const resultTemp = document.querySelector<HTMLSpanElement>('#tc-result-temp');
  const resultTime = document.querySelector<HTMLSpanElement>('#tc-result-time');

  if (!sourceSelect || !targetSelect || !tempInput || !timeInput || !swapBtn || !resultTemp || !resultTime) return;

  const calculate = () => {
    const sourceDevice = sourceSelect.value as DeviceType;
    const targetDevice = targetSelect.value as DeviceType;
    const temperature = parseInt(tempInput.value) || 0;
    const time = parseInt(timeInput.value) || 0;

    const result = convert({
      sourceDevice,
      targetDevice,
      temperature,
      time,
    });

    resultTemp.textContent = result.temperature.toString();
    resultTime.textContent = result.time.toString();
  };

  // Adjusters logic
  tempDec?.addEventListener('click', () => {
    tempInput.value = (parseInt(tempInput.value) - 5).toString();
    calculate();
  });
  tempInc?.addEventListener('click', () => {
    tempInput.value = (parseInt(tempInput.value) + 5).toString();
    calculate();
  });

  timeDec?.addEventListener('click', () => {
    timeInput.value = Math.max(1, parseInt(timeInput.value) - 1).toString();
    calculate();
  });
  timeInc?.addEventListener('click', () => {
    timeInput.value = (parseInt(timeInput.value) + 1).toString();
    calculate();
  });

  // Real-time Event Listeners
  sourceSelect.addEventListener('change', calculate);
  targetSelect.addEventListener('change', calculate);
  tempInput.addEventListener('input', calculate);
  timeInput.addEventListener('input', calculate);

  // Swap functionality
  swapBtn.addEventListener('click', () => {
    const tempDev = sourceSelect.value;
    sourceSelect.value = targetSelect.value;
    targetSelect.value = tempDev;

    // We don't necessarily want to swap the *values* back and forth infinitely if they click it a lot,
    // but typically swapping the conversion direction implies grabbing the current results to be the new source.
    // However, for this tool, swapping just the "To" and "From" devices is the most expected behavior.
    calculate();
  });

  // Run initial calculation
  calculate();
}
