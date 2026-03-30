import { donenessTemps, categories } from '../data/donenessData';

let activeCategory = "All";

function getDefaultUnit(): 'F' | 'C' {
  const ftLocales = ['en-US', 'en-BZ', 'en-BS', 'en-KY', 'en-PW', 'en-PR', 'en-GU', 'en-VI'];
  if (navigator.languages && navigator.languages.some(lang => ftLocales.includes(lang))) {
    return 'F';
  }
  return navigator.language === 'en-US' ? 'F' : 'C';
}

let activeUnit: 'F' | 'C' = getDefaultUnit();

export function renderDonenessGuide(): string {
  return `
    <div class="card">
      <div class="tool-header doneness-tool-header">
        <div>
          <h2>🌡️ Doneness Temperature Guide</h2>
          <p>Safe internal temperatures for perfectly cooked proteins</p>
        </div>
        <div class="unit-toggle">
          <button class="unit-btn ${activeUnit === 'F' ? 'active' : ''}" data-unit="F">°F</button>
          <button class="unit-btn ${activeUnit === 'C' ? 'active' : ''}" data-unit="C">°C</button>
        </div>
      </div>
      
      <div class="category-chips">
        ${categories.map(cat => `
          <button class="category-chip ${cat === activeCategory ? 'active' : ''}" data-category="${cat}">
            ${cat}
          </button>
        `).join('')}
      </div>

      <div id="doneness-list" class="doneness-list">
        ${renderDonenessCards()}
      </div>

      <div class="usda-notice">
        ⚠️ Temperatures shown are USDA recommended safe minimums. Always use a food thermometer.
      </div>
    </div>
  `;
}

function renderDonenessCards(): string {
  const filtered = donenessTemps.filter(temp =>
    activeCategory === "All" || temp.category === activeCategory
  );

  return filtered.map(temp => {
    const isMultiStage = temp.temperatures.length > 1;

    return `
    <div class="doneness-card">
      <div class="doneness-header">
        <span class="doneness-icon">${temp.icon}</span>
        <h3>${temp.protein}</h3>
      </div>
      ${temp.usda_minimum ? `<div class="usda-minimum">🛡️ USDA Safe Minimum: ${activeUnit === 'F' ? temp.usda_minimum + '°F' : Math.round((temp.usda_minimum - 32) * 5 / 9) + '°C'}</div>` : ''}
      
      ${isMultiStage ? `
      <div class="temp-spectrum-container">
        <div class="temp-spectrum-track">
          ${temp.temperatures.map(t => `
            <div class="temp-segment" style="--seg-color: ${t.color}; ${t.image ? `--bg-image: url('${t.image}');` : ''}">
              <div class="temp-segment-label">${t.level}</div>
              <div class="temp-segment-details">
                <div class="temp-segment-degrees">${activeUnit === 'F' ? t.fahrenheit + '°F' : t.celsius + '°C'}</div>
                <div class="temp-segment-desc">${t.description}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : `
      <div class="${temp.temperatures.some(t => t.image) ? 'temp-spectrum-container' : 'temp-single-container'}">
        ${temp.temperatures.map(t => `
          <div class="temp-single-target ${t.image ? 'has-bg' : ''}" style="--seg-color: ${t.color || '#4caf50'}; ${t.image ? `--bg-image: url('${t.image}');` : ''}">
            <div class="temp-single-icon">
              <span class="material-icons">thermostat</span>
            </div>
            <div class="temp-single-info">
              <div class="temp-single-name">${t.level}</div>
              <div class="temp-single-degrees">${activeUnit === 'F' ? t.fahrenheit + '°F' : t.celsius + '°C'}</div>
              <div class="temp-single-desc">${t.description}</div>
            </div>
          </div>
        `).join('')}
      </div>
      `}
    </div>
  `;
  }).join('');
}

export function attachDonenessGuideListeners() {
  const categoryChips = document.querySelectorAll<HTMLButtonElement>('.category-chip');
  const donenessList = document.querySelector<HTMLDivElement>('#doneness-list');
  const unitBtns = document.querySelectorAll<HTMLButtonElement>('.unit-btn');

  function updateView() {
    if (donenessList) donenessList.innerHTML = renderDonenessCards();
  }

  categoryChips.forEach(chip => {
    chip.addEventListener('click', () => {
      activeCategory = chip.dataset.category || "All";
      categoryChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      updateView();
    });
  });

  unitBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      activeUnit = (btn.dataset.unit as 'F' | 'C') || 'F';
      unitBtns.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      updateView();
    });
  });
}
