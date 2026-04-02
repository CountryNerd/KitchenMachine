import { measurementEquivalents, categories } from '../data/measurementData';

let activeCategory = "All";

export function renderMeasurementConverter(): string {
  return `
    <div class="card">
      <div class="tool-header">
        <h2>📐 Measurement Quick Reference</h2>
        <p>Common kitchen measurement conversions at a glance</p>
      </div>

      <p class="measure-guide-copy">Tap or click any line to copy it.</p>
      
      <div class="category-chips">
        ${categories.map(cat => `
          <button class="category-chip ${cat === activeCategory ? 'active' : ''}" data-category="${cat}">
            ${cat}
          </button>
        `).join('')}
      </div>

      <div class="search-box">
        <input type="text" id="measure-search" placeholder="Search measurements..." />
      </div>

      <div id="measurement-list" class="measurement-list">
        ${renderMeasurements()}
      </div>
    </div>
  `;
}

function renderMeasurements(searchTerm = ""): string {
  const filtered = measurementEquivalents.filter(eq => {
    const matchesCategory = activeCategory === "All" || eq.category === activeCategory;
    const matchesSearch = searchTerm === "" ||
      eq.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.value.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    return '<div class="no-results">No measurements found. Try a different search or category.</div>';
  }

  return `
    <div class="measurement-table">
      ${filtered.map(eq => `
        <button
          type="button"
          class="measurement-row"
          data-copy="${eq.from} = ${eq.value}"
          aria-label="Copy ${eq.from} equals ${eq.value}"
        >
          <div class="measure-from">${eq.from}</div>
          <div class="measure-equals">=</div>
          <div class="measure-to">${eq.value}</div>
          <div class="measure-copy-hint">
            <span class="material-icons" aria-hidden="true">content_copy</span>
            <span class="measure-copy-label">Copy</span>
          </div>
        </button>
      `).join('')}
    </div>
  `;
}

export function attachMeasurementConverterListeners() {
  const categoryChips = document.querySelectorAll<HTMLButtonElement>('.category-chip');
  const searchInput = document.querySelector<HTMLInputElement>('#measure-search');
  const measurementList = document.querySelector<HTMLDivElement>('#measurement-list');

  categoryChips.forEach(chip => {
    chip.addEventListener('click', () => {
      activeCategory = chip.dataset.category || "All";
      categoryChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      if (measurementList) {
        measurementList.innerHTML = renderMeasurements(searchInput?.value || "");
      }
    });
  });

  if (searchInput && measurementList) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = (e.target as HTMLInputElement).value;
      measurementList.innerHTML = renderMeasurements(searchTerm);
    });

    const copyMeasurement = async (row: HTMLButtonElement) => {
      if (!row.dataset.copy) {
        return;
      }

      try {
        await navigator.clipboard.writeText(row.dataset.copy);
      } catch {
        return;
      }

      const hintIcon = row.querySelector('.measure-copy-hint .material-icons');
      const hintLabel = row.querySelector('.measure-copy-label');

      row.classList.add('copied');
      if (hintIcon) {
        hintIcon.textContent = 'check';
      }
      if (hintLabel) {
        hintLabel.textContent = 'Copied';
      }

      window.setTimeout(() => {
        row.classList.remove('copied');
        if (hintIcon) {
          hintIcon.textContent = 'content_copy';
        }
        if (hintLabel) {
          hintLabel.textContent = 'Copy';
        }
      }, 1000);
    };

    measurementList.addEventListener('click', (e) => {
      const row = (e.target as Element).closest('.measurement-row') as HTMLButtonElement | null;
      if (row) {
        void copyMeasurement(row);
      }
    });
  }
}
