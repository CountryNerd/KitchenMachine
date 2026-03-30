import { calculateCookingTime, cookingFormulas } from '../utils/cookingTimeCalculator';

export function renderCookingTimeCalculator(): string {
  return `
    <div class="card time-calculator-card">
      <div class="tool-header">
        <h2>⏱️ Cooking Time Calculator</h2>
        <p>Instant prep & temp guides based on weight</p>
      </div>

      <div class="ct-controls">
        <div class="ct-food-select-wrapper">
          <label class="ct-label">Protein/Dish</label>
          <select id="ct-food-type" class="uc-select">
            ${cookingFormulas.map(f => `
              <option value="${f.foodType}">${f.icon} ${f.foodType}</option>
            `).join('')}
          </select>
        </div>

        <div class="ct-weight-wrapper">
          <label class="ct-label">Weight (lbs)</label>
          <div class="uc-input-wrapper ct-weight-adjuster">
            <button class="icon-btn uc-adjust" id="ct-weight-dec" title="Decrease Weight"><span class="material-icons">remove</span></button>
            <input type="number" id="ct-weight-input" class="uc-value" value="12" min="0.5" step="0.5" />
            <button class="icon-btn uc-adjust" id="ct-weight-inc" title="Increase Weight"><span class="material-icons">add</span></button>
          </div>
        </div>
      </div>

      <div id="ct-result-dashboard" class="ct-dashboard">
        <div class="ct-method-badge" id="ct-method-badge">
          <span class="material-icons ct-method-icon">local_fire_department</span>
          <span id="ct-method-text">Roast at 325°F</span>
        </div>

        <div class="cooking-time-display ct-primary-display">
          <div class="time-result">
            <span id="ct-hours" class="time-value">0</span>
            <span class="time-label">hr</span>
            <span id="ct-minutes" class="time-value">0</span>
            <span class="time-label">min</span>
          </div>
          <div id="ct-notes" class="cooking-notes"></div>
          
          <button id="ct-start-timer-btn" class="action-btn timer-pulse-btn">
            <span class="material-icons">timer</span>
            Start Cooking Timer
          </button>
        </div>
      </div>

      <div class="footer">
        <p>🌡️ Times are estimates. Always use a meat thermometer for safety!</p>
      </div>
    </div>
  `;
}

let calculatedMinutes = 0;

export function attachCookingTimeCalculatorListeners() {
  const foodSelect = document.querySelector<HTMLSelectElement>('#ct-food-type');
  const weightInput = document.querySelector<HTMLInputElement>('#ct-weight-input');
  const weightDec = document.querySelector<HTMLButtonElement>('#ct-weight-dec');
  const weightInc = document.querySelector<HTMLButtonElement>('#ct-weight-inc');

  const hoursEl = document.querySelector<HTMLSpanElement>('#ct-hours');
  const minutesEl = document.querySelector<HTMLSpanElement>('#ct-minutes');
  const methodTextEl = document.querySelector<HTMLSpanElement>('#ct-method-text');
  const notesEl = document.querySelector<HTMLDivElement>('#ct-notes');
  const startTimerBtn = document.querySelector<HTMLButtonElement>('#ct-start-timer-btn');

  if (!foodSelect || !weightInput || !hoursEl || !minutesEl || !methodTextEl || !notesEl) return;

  const calculate = () => {
    const foodType = foodSelect.value;
    const weight = parseFloat(weightInput.value) || 0;

    if (weight <= 0) {
      hoursEl.textContent = "0";
      minutesEl.textContent = "0";
      calculatedMinutes = 0;
      return;
    }

    const result = calculateCookingTime(foodType, weight);

    if (result.formula) {
      hoursEl.textContent = result.hours.toString();
      minutesEl.textContent = result.minutes.toString();
      methodTextEl.textContent = result.formula.method;

      if (result.formula.notes) {
        notesEl.innerHTML = `<span class="material-icons note-icon">info</span> ${result.formula.notes}`;
      } else {
        notesEl.innerHTML = '';
      }

      calculatedMinutes = result.hours * 60 + result.minutes;
    }
  };

  // Weight Adjusters
  weightDec?.addEventListener('click', () => {
    let current = parseFloat(weightInput.value) || 0;
    if (current > 0.5) {
      weightInput.value = (current - 0.5).toFixed(1);
      calculate();
    }
  });

  weightInc?.addEventListener('click', () => {
    let current = parseFloat(weightInput.value) || 0;
    weightInput.value = (current + 0.5).toFixed(1);
    calculate();
  });

  // Real-time calculation triggers
  foodSelect.addEventListener('change', calculate);
  weightInput.addEventListener('input', calculate);

  // Timer Integration
  startTimerBtn?.addEventListener('click', () => {
    if (calculatedMinutes > 0) {
      const timerNavBtn = document.querySelector<HTMLButtonElement>('[data-tool="timer"]');
      if (timerNavBtn) {
        // Aesthetic click feedback
        startTimerBtn.classList.add('clicked');
        setTimeout(() => startTimerBtn.classList.remove('clicked'), 200);

        timerNavBtn.click();
        setTimeout(() => {
          window.history.pushState({}, '', `${window.location.pathname}?timerMinutes=${calculatedMinutes}`);
          window.dispatchEvent(new CustomEvent('initTimer', { detail: { minutes: calculatedMinutes } }));
        }, 50);
      }
    }
  });

  // Initial calculation
  calculate();
}
