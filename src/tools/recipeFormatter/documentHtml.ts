import { escapeHtml, getRecipeDisplayTitle } from './helpers';
import { buildNutritionRows, buildNutritionTrustCopy, buildRecipeIngredientStatement } from './renderers';
import type { RecipeExportState } from './types';

export function buildRecipeDocumentHtml(
  state: RecipeExportState,
  options: { autoPrint?: boolean } = {}
): string {
  const displayTitle = getRecipeDisplayTitle(state.title);
  const nutritionRows = buildNutritionRows(state.nutritionEstimate);
  const hasServings = state.nutritionEstimate.servingsCount !== null;
  const ingredientStatement = buildRecipeIngredientStatement(state.usedIngredients, state.nutritionEstimate);
  const trustCopy = buildNutritionTrustCopy(state.nutritionEstimate);
  const autoPrintScript = options.autoPrint
    ? `
        <script>
          window.addEventListener('load', () => {
            window.setTimeout(() => {
              window.print();
            }, 180);

            window.addEventListener('afterprint', () => {
              window.setTimeout(() => window.close(), 120);
            }, { once: true });
          });
        </script>
      `
    : '';

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(displayTitle)}</title>
        <style>
          @page {
            margin: 0.55in;
          }

          * {
            box-sizing: border-box;
          }

          body {
            font-family: Georgia, "Times New Roman", serif;
            margin: 0;
            padding: 0;
            color: #2d251b;
            background: #f7f0e2;
          }

          .doc {
            max-width: 11in;
            margin: 0 auto;
            background: linear-gradient(180deg, #fffdfa, #fbf5ea);
            border: 1px solid #d8cbb8;
            border-radius: 24px;
            padding: 32px;
            box-shadow: 0 18px 42px rgba(71, 52, 28, 0.08);
          }

          .doc-overline {
            margin: 0 0 6px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: #7d5f2f;
          }

          h1,
          h2,
          h3 {
            margin: 0;
          }

          h1 {
            font-size: 42px;
            line-height: 0.95;
            letter-spacing: -0.04em;
            font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
            color: #241c14;
          }

          .summary {
            margin: 12px 0 0;
            max-width: 680px;
            font-size: 16px;
            line-height: 1.6;
            color: #5f5243;
          }

          .sheet-header {
            display: table;
            width: 100%;
            margin-bottom: 22px;
          }

          .sheet-header-copy,
          .sheet-header-utility {
            display: table-cell;
            vertical-align: top;
          }

          .sheet-header-utility {
            width: 200px;
            text-align: right;
          }

          .sheet-header-utility-label {
            display: inline-block;
            padding: 8px 12px;
            border: 1px solid #d7c9b3;
            border-radius: 999px;
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: #70572e;
            background: rgba(255, 255, 255, 0.72);
          }

          .meta {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin: 0 0 24px;
            padding-bottom: 22px;
            border-bottom: 1px solid #dfd2bf;
          }

          .meta span,
          .removed-chip {
            display: inline-block;
            padding: 10px 14px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.76);
            border: 1px solid #d8ccb8;
            margin: 0 8px 8px 0;
            font-size: 14px;
          }

          .meta strong {
            margin-right: 8px;
            color: #6c8a33;
          }

          .removed {
            margin: 0 0 22px;
            padding: 18px;
            border-radius: 18px;
            background: linear-gradient(180deg, #fff4de, #f9ead1);
            border: 1px solid #e5cf95;
          }

          .removed-title {
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 18px;
            font-weight: 700;
            color: #5b440f;
          }

          .removed-copy {
            margin: 8px 0 0;
            font-size: 14px;
            line-height: 1.5;
            color: #6a5731;
          }

          .removed-list {
            margin: 12px 0 0;
            padding-left: 22px;
            font-size: 14px;
            line-height: 1.6;
          }

          .sheet-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            background: rgba(255, 252, 246, 0.9);
            border: 1px solid #d8cbb8;
            border-radius: 22px;
            overflow: hidden;
          }

          .sheet-main,
          .sheet-sidebar {
            vertical-align: top;
            padding: 26px;
          }

          .sheet-main {
            width: 60%;
          }

          .sheet-sidebar {
            width: 40%;
            border-left: 1px solid #e2d6c5;
            background: linear-gradient(180deg, rgba(248, 243, 232, 0.82), rgba(255, 252, 246, 0.86));
          }

          .section {
            margin-top: 22px;
            padding-top: 18px;
            border-top: 1px solid #e1d6c5;
            page-break-inside: avoid;
          }

          .section:first-of-type {
            margin-top: 0;
            padding-top: 0;
            border-top: 0;
          }

          .section-head {
            display: table;
            width: 100%;
            margin-bottom: 12px;
          }

          .section-number,
          .section-copy {
            display: table-cell;
            vertical-align: top;
          }

          .section-number {
            width: 58px;
          }

          .section-number span {
            display: inline-flex;
            width: 44px;
            height: 44px;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            background: #eef2de;
            border: 1px solid #cfdaab;
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 13px;
            font-weight: 800;
            color: #536b22;
          }

          .section-kicker {
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: #7d5f2f;
          }

          .section-copy h2 {
            margin-top: 4px;
            font-size: 26px;
            font-family: Baskerville, "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
            font-weight: 700;
            color: #241c14;
          }

          .section-copy p {
            margin: 8px 0 0;
            font-family: Georgia, "Times New Roman", serif;
            font-size: 14px;
            line-height: 1.55;
            color: #5f5243;
          }

          .tools {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 14px;
          }

          .tool-chip {
            display: inline-block;
            padding: 8px 12px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.72);
            border: 1px solid #d6cab7;
            font-size: 14px;
            font-weight: 700;
          }

          ol {
            margin: 0;
            padding-left: 24px;
            line-height: 1.7;
          }

          ol li {
            margin-bottom: 12px;
            font-family: Georgia, "Times New Roman", serif;
            font-size: 16px;
          }

          .nutrition-kicker {
            margin-bottom: 10px;
            color: #6a5331;
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.16em;
            text-transform: uppercase;
          }

          .nutrition {
            padding: 0;
            page-break-inside: avoid;
          }

          .nutrition-label {
            background: linear-gradient(180deg, #fffefc, #fbf8f2);
            border: 2px solid #231b15;
            border-radius: 12px;
            padding: 18px;
            color: #201912;
          }

          .nutrition-title-row {
            display: table;
            width: 100%;
            border-bottom: 7px solid #1f1812;
            padding-bottom: 6px;
          }

          .nutrition-title,
          .nutrition-pill {
            display: table-cell;
            vertical-align: bottom;
          }

          .nutrition-title {
            font-family: "Arial Black", "Franklin Gothic Heavy", sans-serif;
            font-size: 42px;
            line-height: 0.95;
            text-transform: uppercase;
            letter-spacing: -0.05em;
          }

          .nutrition-pill {
            text-align: right;
          }

          .nutrition-pill span {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 999px;
            background: #1f1812;
            color: #fbf8f2;
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.12em;
            text-transform: uppercase;
          }

          .nutrition-serving-line {
            margin-top: 10px;
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 15px;
            font-weight: 600;
          }

          .nutrition-serving-size {
            display: table;
            width: 100%;
            margin-top: 5px;
            padding-bottom: 8px;
            border-bottom: 6px solid #1f1812;
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 18px;
            font-weight: 700;
          }

          .nutrition-serving-size span:last-child {
            float: right;
          }

          .nutrition-trust {
            margin: 12px 0 0;
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 14px;
            line-height: 1.5;
            color: #4d4135;
          }

          .nutrition table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
          }

          .nutrition th,
          .nutrition td {
            padding: 6px 8px;
            border-bottom: 1px solid rgba(30, 24, 18, 0.42);
          }

          .nutrition thead th {
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            text-align: right;
          }

          .nutrition thead th:first-child {
            text-align: left;
          }

          .nutrition tbody th {
            text-align: left;
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 17px;
            font-weight: 800;
          }

          .nutrition tbody td {
            text-align: right;
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 16px;
            font-weight: 700;
          }

          .nutrition tbody tr td + td,
          .nutrition thead tr th + th {
            border-left: 1px solid rgba(30, 24, 18, 0.12);
          }

          .nutrition .calories-row th,
          .nutrition .calories-row td {
            border-bottom: 6px solid #1f1812;
          }

          .nutrition .calories-row th {
            font-family: "Arial Black", "Franklin Gothic Heavy", sans-serif;
            font-size: 31px;
          }

          .nutrition .calories-row td {
            font-family: "Arial Black", "Franklin Gothic Heavy", sans-serif;
            font-size: 38px;
            line-height: 1;
          }

          .nutrition .sub-row th {
            padding-left: 20px;
            font-weight: 500;
          }

          .nutrition-ingredients {
            margin-top: 14px;
            padding-top: 12px;
            border-top: 3px solid #1f1812;
          }

          .nutrition-ingredients-label {
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.12em;
            text-transform: uppercase;
          }

          .nutrition-ingredients p {
            margin: 8px 0 0;
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 15px;
            line-height: 1.45;
            font-weight: 600;
          }

          .nutrition-note {
            margin-top: 6px;
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 12px;
            line-height: 1.35;
            color: #5e5348;
          }

          .nutrition-footnote {
            margin-top: 10px;
            padding-top: 8px;
            border-top: 1px solid rgba(30, 24, 18, 0.18);
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 12px;
            line-height: 1.35;
            color: #5f5448;
          }

          .nutrition-empty {
            border: 2px solid #231b15;
            border-radius: 12px;
            padding: 20px;
            background: linear-gradient(180deg, #fffefc, #fbf8f2);
          }

          .nutrition-empty h2 {
            font-family: "Arial Black", "Franklin Gothic Heavy", sans-serif;
            font-size: 32px;
            line-height: 0.98;
            text-transform: uppercase;
          }

          .nutrition-empty p {
            margin: 12px 0 0;
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 15px;
            line-height: 1.55;
          }
        </style>
      </head>
      <body>
        <main class="doc">
          <div class="sheet-header">
            <div class="sheet-header-copy">
              <div class="doc-overline">Heritage Recipe Sheet</div>
              <h1>${escapeHtml(displayTitle)}</h1>
              <p class="summary">Formatted from your working draft with instruction-matched ingredients and a pantry-style nutrition estimate ready to print, save, or share.</p>
            </div>
            <div class="sheet-header-utility">
              <div class="sheet-header-utility-label">Printable kitchen copy</div>
            </div>
          </div>

          ${(state.prepTime || state.cookTime || state.servings) ? `
            <div class="meta">
              ${state.prepTime ? `<span><strong>Prep Time</strong> ${escapeHtml(state.prepTime)}</span>` : ''}
              ${state.cookTime ? `<span><strong>Cook Time</strong> ${escapeHtml(state.cookTime)}</span>` : ''}
              ${state.servings ? `<span><strong>Servings</strong> ${escapeHtml(state.servings)}</span>` : ''}
            </div>
          ` : ''}

          <table class="sheet-table" role="presentation">
            <tr>
              <td class="sheet-main">
                ${state.removedIngredients.length > 0 ? `
                  <div class="removed">
                    <div class="removed-title">Cook's note</div>
                    <p class="removed-copy">These ingredients never appear in the method, so they were left out of the final ingredient list and nutrition estimate.</p>
                    <ul class="removed-list">
                      ${state.removedIngredients.map((ingredient) => `<li>${escapeHtml(ingredient)}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}

                ${state.equipment.length > 0 ? `
                  <section class="section">
                    <div class="section-head">
                      <div class="section-number"><span>00</span></div>
                      <div class="section-copy">
                        <div class="section-kicker">Setup</div>
                        <h2>Bust out these tools</h2>
                        <p>Everything you need before you start cooking.</p>
                      </div>
                    </div>
                    <div class="tools">${state.equipment.map((tool) => `<span class="tool-chip">${escapeHtml(tool)}</span>`).join('')}</div>
                  </section>
                ` : ''}

                <section class="section">
                  <div class="section-head">
                    <div class="section-number"><span>01</span></div>
                    <div class="section-copy">
                      <div class="section-kicker">Pantry</div>
                      <h2>Ingredients</h2>
                      <p>Only ingredients that still appear in the method stay in the printable recipe.</p>
                    </div>
                  </div>
                  <ol>${state.usedIngredients.map((ingredient) => `<li>${escapeHtml(ingredient)}</li>`).join('')}</ol>
                </section>

                <section class="section">
                  <div class="section-head">
                    <div class="section-number"><span>02</span></div>
                    <div class="section-copy">
                      <div class="section-kicker">Method</div>
                      <h2>Instructions</h2>
                      <p>Clear steps paired to the final ingredient list.</p>
                    </div>
                  </div>
                  <ol>${state.instructions.map((instruction) => `<li>${escapeHtml(instruction)}</li>`).join('')}</ol>
                </section>
              </td>

              <td class="sheet-sidebar">
                ${state.nutritionEstimate.matchedIngredientCount > 0 ? `
                  <section class="nutrition">
                    <div class="nutrition-kicker">Recipe Pantry Label</div>
                    <div class="nutrition-label">
                      <div class="nutrition-title-row">
                        <div class="nutrition-title">Nutrition Facts</div>
                        <div class="nutrition-pill"><span>Estimate</span></div>
                      </div>
                      <div class="nutrition-serving-line">${escapeHtml(state.nutritionEstimate.servingsText ?? 'Serving count not provided')}${state.nutritionEstimate.servingsText ? ' per recipe' : ''}</div>
                      <div class="nutrition-serving-size">
                        <span>Serving size</span>
                        <span>${hasServings ? '1 serving' : 'Whole recipe'}</span>
                      </div>
                      <div class="nutrition-trust">${escapeHtml(trustCopy)}</div>
                      <table>
                        <thead>
                          <tr>
                            <th></th>
                            <th>${hasServings ? 'Per serving' : 'Whole recipe'}</th>
                            ${hasServings ? '<th>Whole recipe</th>' : ''}
                          </tr>
                        </thead>
                        <tbody>
                          ${nutritionRows.map((row) => `
                            <tr class="${row.emphasized ? 'calories-row' : row.indented ? 'sub-row' : ''}">
                              <th>${escapeHtml(row.label)}</th>
                              <td>${escapeHtml(row.perServing)}</td>
                              ${hasServings ? `<td>${escapeHtml(row.total)}</td>` : ''}
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                      <div class="nutrition-ingredients">
                        <div class="nutrition-ingredients-label">Ingredients</div>
                        <p>${escapeHtml(ingredientStatement)}</p>
                        <div class="nutrition-note">Shown from the ingredients still used in the final recipe. Recognized pantry items are ordered first by estimated weight.</div>
                      </div>
                      <div class="nutrition-footnote">Calories and macros are estimated from the ingredients kept in the recipe, common kitchen weights, and your serving count.</div>
                    </div>
                  </section>
                ` : `
                  <section class="nutrition-empty">
                    <h2>Nutrition Facts</h2>
                    <p>We could not estimate this recipe yet. Use lines like <strong>2 cups flour</strong> or <strong>3 eggs</strong> so the label feels like a real pantry panel.</p>
                  </section>
                `}
              </td>
            </tr>
          </table>
        </main>
      ${autoPrintScript}
      </body>
    </html>
  `;
}
