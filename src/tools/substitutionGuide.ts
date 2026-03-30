import { substitutions, categories } from '../data/substitutionData';

let activeCategory = "All";

export function renderSubstitutionGuide(): string {
  return `
    <div class="card">
      <div class="tool-header">
        <h2>🔄 Ingredient Substitutions</h2>
        <p>Out of an ingredient? Find the perfect substitute!</p>
      </div>
      
      <div class="category-chips">
        ${categories.map(cat => `
          <button class="category-chip ${cat === activeCategory ? 'active' : ''}" data-category="${cat}">
            ${cat}
          </button>
        `).join('')}
      </div>

      <div class="search-box">
        <input type="text" id="sub-search" placeholder="Search ingredients..." />
      </div>

      <div id="substitution-list" class="substitution-list">
        ${renderSubstitutions()}
      </div>
    </div>
  `;
}

function toFraction(decimal: number): string {
  if (decimal === 0) return "0";
  const whole = Math.floor(decimal);
  const fraction = decimal - whole;
  let fractionStr = "";

  if (Math.abs(fraction - 0.125) < 0.01) fractionStr = "1/8";
  else if (Math.abs(fraction - 0.25) < 0.01) fractionStr = "1/4";
  else if (Math.abs(fraction - 0.33) < 0.02) fractionStr = "1/3";
  else if (Math.abs(fraction - 0.375) < 0.01) fractionStr = "3/8";
  else if (Math.abs(fraction - 0.5) < 0.01) fractionStr = "1/2";
  else if (Math.abs(fraction - 0.625) < 0.01) fractionStr = "5/8";
  else if (Math.abs(fraction - 0.66) < 0.02) fractionStr = "2/3";
  else if (Math.abs(fraction - 0.75) < 0.01) fractionStr = "3/4";
  else if (Math.abs(fraction - 0.875) < 0.01) fractionStr = "7/8";
  else if (fraction > 0.01) fractionStr = fraction.toFixed(2).replace(/\.00$/, '');

  if (whole > 0 && fractionStr) {
    return `${whole} ${fractionStr}`;
  } else if (fractionStr) {
    return fractionStr;
  } else {
    return whole.toString();
  }
}

function formatRatio(template: string, multiplier: number): string {
  return template.replace(/\{([\d.]+)\}/g, (_, numStr) => {
    const val = parseFloat(numStr) * multiplier;
    return toFraction(val);
  });
}

function getBadgeHTML(quality?: string): string {
  if (quality === 'best') return `<span class="sub-badge badge-best"><span class="material-icons">star</span> Best Overall</span>`;
  if (quality === 'emergency') return `<span class="sub-badge badge-emergency"><span class="material-icons">warning</span> Emergency Sub</span>`;
  if (quality === 'vegan') return `<span class="sub-badge badge-vegan"><span class="material-icons">eco</span> Vegan Option</span>`;
  return '';
}

function renderSubstitutions(searchTerm = ""): string {
  const filtered = substitutions.filter(sub => {
    const matchesCategory = activeCategory === "All" || sub.category === activeCategory;
    const matchesSearch = searchTerm === "" ||
      sub.ingredient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.substitutes.some(s => s.substitute.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    return '<div class="no-results">No substitutions found. Try a different search or category.</div>';
  }

  return filtered.map(sub => `
    <div class="substitution-card">
      <div class="sub-header">
        <span class="sub-icon">${sub.icon}</span>
        <h3>${sub.ingredient}</h3>
        <span class="sub-category-badge">${sub.category}</span>
        <span class="material-icons sub-expand-icon" aria-hidden="true">expand_more</span>
      </div>
      <div class="sub-options">
        <div class="sub-options-inner">
          <div class="sub-calculator">
            <span class="calc-label">I need:</span>
            <input type="number" class="sub-qty-input" value="${sub.baseAmount}" min="0" step="0.25" data-base="${sub.baseAmount}" />
            <span class="calc-unit">${sub.baseUnit} <strong>${sub.ingredient}</strong></span>
          </div>

          ${sub.substitutes.map(s => `
            <div class="sub-option">
              <div class="sub-name-row">
                <div class="sub-name">${s.substitute}</div>
                ${getBadgeHTML(s.matchQuality)}
              </div>
              <div class="sub-ratio" data-template="${s.ratio}">
                <span class="ratio-text">${formatRatio(s.ratio, 1)}</span>
                <button class="icon-btn copy-ratio-btn" title="Copy exact substitution"><span class="material-icons">content_copy</span></button>
              </div>
              ${s.explanation ? `<div class="sub-explanation">${s.explanation}</div>` : ''}
              ${s.notes ? `<div class="sub-notes"><span class="material-icons note-icon">lightbulb</span> ${s.notes}</div>` : ''}
              ${s.impact ? `<div class="sub-impact"><span class="material-icons impact-icon">auto_awesome</span> ${s.impact}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `).join('');
}

export function attachSubstitutionGuideListeners() {
  const categoryChips = document.querySelectorAll<HTMLButtonElement>('.category-chip');
  const searchInput = document.querySelector<HTMLInputElement>('#sub-search');
  const substitutionList = document.querySelector<HTMLDivElement>('#substitution-list');

  categoryChips.forEach(chip => {
    chip.addEventListener('click', () => {
      activeCategory = chip.dataset.category || "All";
      categoryChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      if (substitutionList) {
        substitutionList.innerHTML = renderSubstitutions(searchInput?.value || "");
      }
    });
  });

  if (searchInput && substitutionList) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = (e.target as HTMLInputElement).value;
      substitutionList.innerHTML = renderSubstitutions(searchTerm);
    });

    // Dynamic calculation listener
    substitutionList.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.classList.contains('sub-qty-input')) {
        const val = parseFloat(target.value) || 0;
        const base = parseFloat(target.dataset.base || "1");
        const multiplier = val / base;

        const card = target.closest('.substitution-card');
        if (card) {
          const ratios = card.querySelectorAll('.sub-ratio');
          ratios.forEach(r => {
            const el = r as HTMLElement;
            const template = el.dataset.template;
            const textSpan = el.querySelector('.ratio-text');
            if (template && textSpan) {
              textSpan.textContent = formatRatio(template, multiplier);
            }
          });
        }
      }
    });

    // Accordion & Copy functionality
    substitutionList.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      const copyBtn = target.closest('.copy-ratio-btn');
      if (copyBtn) {
        const ratioText = copyBtn.closest('.sub-ratio')?.querySelector('.ratio-text')?.textContent;
        if (ratioText) {
          navigator.clipboard.writeText(ratioText);
          const origHtml = copyBtn.innerHTML;
          copyBtn.innerHTML = '<span class="material-icons">check</span>';
          setTimeout(() => copyBtn.innerHTML = origHtml, 2000);
        }
        return;
      }

      const header = target.closest('.sub-header');
      if (header) {
        const card = header.closest('.substitution-card');
        if (card) {
          card.classList.toggle('expanded');
        }
      }
    });
  }
}
