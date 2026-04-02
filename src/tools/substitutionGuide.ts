import { substitutions, categories } from '../data/substitutionData';

let activeCategory = "All";

export function renderSubstitutionGuide(): string {
  return `
    <div class="card">
      <div class="tool-header">
        <h2>Substitutions</h2>
        <p>Start with the closest match.</p>
      </div>
      
      <div class="category-chips">
        ${categories.map(cat => `
          <button class="category-chip ${cat === activeCategory ? 'active' : ''}" data-category="${cat}">
            ${cat}
          </button>
        `).join('')}
      </div>

      <div class="search-box">
        <input type="text" id="sub-search" placeholder="Search an ingredient or substitute" />
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

function getSubstitutePriority(quality?: string): number {
  if (quality === 'best') return 0;
  if (quality === 'standard' || !quality) return 1;
  if (quality === 'vegan') return 2;
  return 3;
}

function sortSubstitutes<T extends { matchQuality?: string }>(items: T[]): T[] {
  return [...items].sort((left, right) => getSubstitutePriority(left.matchQuality) - getSubstitutePriority(right.matchQuality));
}

function getFeaturedKicker(quality?: string): string {
  if (quality === 'best') return 'Start here';
  if (quality === 'vegan') return 'Best plant-based option';
  if (quality === 'emergency') return 'Use if you are stuck';
  return 'Best place to start';
}

function getCardSummary(bestOption: { substitute: string; matchQuality?: string }): string {
  if (bestOption.matchQuality === 'best') {
    return `Start with ${bestOption.substitute}. It is the closest match.`;
  }

  if (bestOption.matchQuality === 'vegan') {
    return `Start with ${bestOption.substitute} for the cleanest plant-based swap.`;
  }

  if (bestOption.matchQuality === 'emergency') {
    return `${bestOption.substitute} works in a pinch when you need a fast backup.`;
  }

  return `Start with ${bestOption.substitute}, then compare backups only if needed.`;
}

function splitImpact(impact?: string): { label: string; body: string } | null {
  if (!impact) {
    return null;
  }

  const match = impact.match(/^([^:]+):\s*(.+)$/);
  if (match) {
    return {
      label: match[1].trim(),
      body: match[2].trim()
    };
  }

  return {
    label: 'Heads up',
    body: impact.trim()
  };
}

function renderSubstituteMeta(notes?: string, impact?: string): string {
  const impactParts = splitImpact(impact);
  const chips: string[] = [];

  if (notes) {
    chips.push(`
      <div class="sub-meta-chip sub-meta-note">
        <span class="material-icons" aria-hidden="true">schedule</span>
        <span>${notes}</span>
      </div>
    `);
  }

  if (impactParts) {
    chips.push(`
      <div class="sub-meta-chip sub-meta-impact">
        <span class="sub-meta-chip-label">${impactParts.label}</span>
        <span>${impactParts.body}</span>
      </div>
    `);
  }

  return chips.length > 0 ? `<div class="sub-meta-row">${chips.join('')}</div>` : '';
}

function renderExplanationDisclosure(explanation?: string): string {
  if (!explanation) {
    return '';
  }

  return `
    <details class="sub-details">
      <summary>Why this works</summary>
      <p>${explanation}</p>
    </details>
  `;
}

function renderFeaturedSubstitute(substitute: {
  substitute: string;
  ratio: string;
  explanation?: string;
  notes?: string;
  impact?: string;
  matchQuality?: 'best' | 'emergency' | 'vegan' | 'standard';
}): string {
  return `
    <section class="sub-featured">
      <div class="sub-section-label">${getFeaturedKicker(substitute.matchQuality)}</div>
      <div class="sub-name-row">
        <div class="sub-name">${substitute.substitute}</div>
        ${getBadgeHTML(substitute.matchQuality)}
      </div>
      <div class="sub-ratio sub-ratio-prominent" data-template="${substitute.ratio}">
        <span class="ratio-text">${formatRatio(substitute.ratio, 1)}</span>
        <button class="copy-ratio-btn sub-copy-btn" title="Copy exact substitution">
          <span class="material-icons" aria-hidden="true">content_copy</span>
          <span>Copy</span>
        </button>
      </div>
      ${renderSubstituteMeta(substitute.notes, substitute.impact)}
      ${renderExplanationDisclosure(substitute.explanation)}
    </section>
  `;
}

function renderAlternateSubstitute(substitute: {
  substitute: string;
  ratio: string;
  explanation?: string;
  notes?: string;
  impact?: string;
  matchQuality?: 'best' | 'emergency' | 'vegan' | 'standard';
}): string {
  return `
    <details class="sub-alt-item">
      <summary>
        <div class="sub-alt-summary-copy">
          <div class="sub-name-row">
            <div class="sub-name">${substitute.substitute}</div>
            ${getBadgeHTML(substitute.matchQuality)}
          </div>
          <div class="sub-alt-summary-ratio" data-template="${substitute.ratio}">
            <span class="ratio-text">${formatRatio(substitute.ratio, 1)}</span>
          </div>
        </div>
        <span class="material-icons sub-alt-expand-icon" aria-hidden="true">expand_more</span>
      </summary>
      <div class="sub-alt-body">
        <div class="sub-ratio" data-template="${substitute.ratio}">
          <span class="ratio-text">${formatRatio(substitute.ratio, 1)}</span>
          <button class="copy-ratio-btn sub-copy-btn" title="Copy exact substitution">
            <span class="material-icons" aria-hidden="true">content_copy</span>
            <span>Copy</span>
          </button>
        </div>
        ${renderSubstituteMeta(substitute.notes, substitute.impact)}
        ${renderExplanationDisclosure(substitute.explanation)}
      </div>
    </details>
  `;
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

  const shouldAutoExpand = searchTerm.trim().length > 0 && filtered.length === 1;

  return filtered.map((sub, index) => {
    const orderedSubstitutes = sortSubstitutes(sub.substitutes);
    const [featuredSubstitute, ...alternateSubstitutes] = orderedSubstitutes;

    return `
    <div class="substitution-card ${shouldAutoExpand && index === 0 ? 'expanded' : ''}">
      <div class="sub-header">
        <span class="sub-icon">${sub.icon}</span>
        <div class="sub-header-copy">
          <h3>${sub.ingredient}</h3>
          <p class="sub-header-summary">${getCardSummary(featuredSubstitute)}</p>
        </div>
        <span class="sub-category-badge">${sub.category}</span>
        <span class="material-icons sub-expand-icon" aria-hidden="true">expand_more</span>
      </div>
      <div class="sub-options">
        <div class="sub-options-inner">
          <div class="sub-calculator">
            <span class="calc-label">Need</span>
            <input type="number" class="sub-qty-input" value="${sub.baseAmount}" min="0" step="0.25" data-base="${sub.baseAmount}" />
            <span class="calc-unit">${sub.baseUnit} of <strong>${sub.ingredient}</strong></span>
          </div>

          ${renderFeaturedSubstitute(featuredSubstitute)}

          ${alternateSubstitutes.length > 0 ? `
            <section class="sub-alt-section">
              <div class="sub-section-label">Other workable swaps</div>
              <div class="sub-alt-list">
                ${alternateSubstitutes.map((substitute) => renderAlternateSubstitute(substitute)).join('')}
              </div>
            </section>
          ` : ''}
        </div>
      </div>
    </div>
  `;
  }).join('');
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
          const ratios = card.querySelectorAll<HTMLElement>('[data-template]');
          ratios.forEach(r => {
            const template = r.dataset.template;
            const textSpan = r.querySelector('.ratio-text');
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
          const isExpanded = card.classList.contains('expanded');
          substitutionList.querySelectorAll('.substitution-card.expanded').forEach((openCard) => {
            openCard.classList.remove('expanded');
          });

          if (!isExpanded) {
            card.classList.add('expanded');
          }
        }
      }
    });
  }
}
