import { escapeHtml, getRecipeDisplayTitle } from './helpers';
import { buildNutritionRows, buildNutritionTrustCopy, buildRecipeIngredientStatement } from './renderers';
import type { RecipeExportState } from './types';

export function buildRecipeWordHtml(state: RecipeExportState): string {
  const displayTitle = getRecipeDisplayTitle(state.title);
  const nutritionRows = buildNutritionRows(state.nutritionEstimate);
  const hasServings = state.nutritionEstimate.servingsCount !== null;
  const ingredientStatement = buildRecipeIngredientStatement(state.usedIngredients, state.nutritionEstimate);
  const trustCopy = buildNutritionTrustCopy(state.nutritionEstimate);
  const metaParts = [
    state.prepTime ? `<strong>Prep Time:</strong> ${escapeHtml(state.prepTime)}` : '',
    state.cookTime ? `<strong>Cook Time:</strong> ${escapeHtml(state.cookTime)}` : '',
    state.servings ? `<strong>Servings:</strong> ${escapeHtml(state.servings)}` : ''
  ].filter(Boolean);

  return `
    <!doctype html>
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40"
          lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="ProgId" content="Word.Document">
        <meta name="Generator" content="Kitchen Toolbox">
        <title>${escapeHtml(displayTitle)}</title>
        <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
            </w:WordDocument>
          </xml>
        <![endif]-->
        <style>
          @page WordSection1 {
            margin: 0.65in;
            size: 8.5in 11in;
          }

          body {
            margin: 0;
            padding: 0;
            color: #2d251b;
            background: #ffffff;
            font-family: Georgia, "Times New Roman", serif;
          }

          div.WordSection1 {
            page: WordSection1;
          }

          p {
            margin: 0 0 10pt;
          }

          table {
            border-collapse: collapse;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
          }

          .doc {
            width: 100%;
          }

          .header-table,
          .layout-table,
          .section-head-table,
          .nutrition-serving-table,
          .nutrition-table {
            width: 100%;
          }

          .header-copy,
          .header-note,
          .main-col,
          .sidebar-col,
          .section-number-col,
          .section-copy-col,
          .nutrition-serving-label,
          .nutrition-serving-value {
            vertical-align: top;
          }

          .header-table {
            margin-bottom: 16pt;
          }

          .header-copy {
            padding-right: 18pt;
          }

          .header-note {
            width: 150pt;
            text-align: right;
          }

          .doc-overline {
            margin: 0 0 4pt;
            color: #70572e;
            font-family: Arial, sans-serif;
            font-size: 10pt;
            font-weight: bold;
            letter-spacing: 1.4pt;
            text-transform: uppercase;
          }

          h1,
          h2 {
            margin: 0;
            color: #241c14;
          }

          h1 {
            font-size: 28pt;
            line-height: 1.02;
            font-family: "Palatino Linotype", "Book Antiqua", Georgia, serif;
          }

          .summary {
            margin-top: 8pt;
            color: #5f5243;
            font-size: 12pt;
            line-height: 1.55;
          }

          .header-note-copy {
            padding: 6pt 10pt;
            border: 1pt solid #d7c9b3;
            color: #70572e;
            font-family: Arial, sans-serif;
            font-size: 9pt;
            font-weight: bold;
            text-transform: uppercase;
          }

          .meta-line {
            margin: 0 0 16pt;
            padding: 0 0 12pt;
            border-bottom: 1pt solid #dfd2bf;
            font-size: 11pt;
            line-height: 1.5;
          }

          .meta-line strong {
            color: #536b22;
          }

          .layout-table {
            border-top: 1pt solid #d8cbb8;
            border-bottom: 1pt solid #d8cbb8;
          }

          .main-col {
            width: 60%;
            padding: 18pt 18pt 18pt 0;
          }

          .sidebar-col {
            width: 40%;
            padding: 18pt 0 18pt 18pt;
            border-left: 1pt solid #e2d6c5;
          }

          .removed {
            margin-bottom: 16pt;
            padding: 12pt;
            border: 1pt solid #d9c188;
            background: #fbf2df;
          }

          .removed-title {
            color: #5b440f;
            font-family: Arial, sans-serif;
            font-size: 13pt;
            font-weight: bold;
          }

          .removed-copy,
          .removed-list {
            color: #6a5731;
            font-size: 10.5pt;
            line-height: 1.5;
          }

          .removed-copy {
            margin-top: 6pt;
          }

          .removed-list {
            margin: 8pt 0 0 18pt;
            padding: 0;
          }

          .section {
            margin-top: 16pt;
            padding-top: 14pt;
            border-top: 1pt solid #e1d6c5;
            page-break-inside: avoid;
          }

          .section-first {
            margin-top: 0;
            padding-top: 0;
            border-top: 0;
          }

          .section-head-table {
            margin-bottom: 10pt;
          }

          .section-number-col {
            width: 40pt;
          }

          .section-number-box {
            display: inline-block;
            min-width: 28pt;
            padding: 5pt 0;
            text-align: center;
            border: 1pt solid #cfdaab;
            background: #eef2de;
            color: #536b22;
            font-family: Arial, sans-serif;
            font-size: 10pt;
            font-weight: bold;
          }

          .section-kicker {
            color: #7d5f2f;
            font-family: Arial, sans-serif;
            font-size: 9pt;
            font-weight: bold;
            letter-spacing: 1.2pt;
            text-transform: uppercase;
          }

          .section-copy-col h2 {
            margin-top: 3pt;
            font-size: 18pt;
            font-family: "Palatino Linotype", "Book Antiqua", Georgia, serif;
          }

          .section-copy-col p {
            margin-top: 6pt;
            color: #5f5243;
            font-size: 10.5pt;
            line-height: 1.5;
          }

          .tools-line {
            margin: 10pt 0 0;
            font-size: 10.5pt;
            line-height: 1.55;
          }

          .tools-line strong {
            color: #536b22;
          }

          ol {
            margin: 0 0 0 20pt;
            padding: 0;
          }

          li {
            margin-bottom: 9pt;
            font-size: 11.5pt;
            line-height: 1.6;
          }

          .nutrition-kicker {
            margin-bottom: 8pt;
            color: #6a5331;
            font-family: Arial, sans-serif;
            font-size: 9pt;
            font-weight: bold;
            letter-spacing: 1.2pt;
            text-transform: uppercase;
          }

          .nutrition-label,
          .nutrition-empty {
            border: 2pt solid #231b15;
            padding: 12pt;
          }

          .nutrition-title-table {
            width: 100%;
            border-bottom: 6pt solid #1f1812;
            margin-bottom: 8pt;
          }

          .nutrition-title-cell,
          .nutrition-pill-cell {
            vertical-align: bottom;
          }

          .nutrition-title {
            font-family: Arial, sans-serif;
            font-size: 28pt;
            font-weight: bold;
            line-height: 0.96;
            text-transform: uppercase;
          }

          .nutrition-pill-cell {
            text-align: right;
            width: 90pt;
          }

          .nutrition-pill {
            display: inline-block;
            padding: 4pt 8pt;
            background: #1f1812;
            color: #fbf8f2;
            font-family: Arial, sans-serif;
            font-size: 8.5pt;
            font-weight: bold;
            text-transform: uppercase;
          }

          .nutrition-serving-line {
            margin-top: 2pt;
            font-family: Arial, sans-serif;
            font-size: 11pt;
            font-weight: bold;
          }

          .nutrition-serving-table {
            margin-top: 4pt;
            border-bottom: 5pt solid #1f1812;
          }

          .nutrition-serving-label,
          .nutrition-serving-value {
            padding-bottom: 6pt;
            font-family: Arial, sans-serif;
            font-size: 13pt;
            font-weight: bold;
          }

          .nutrition-serving-value {
            text-align: right;
          }

          .nutrition-trust {
            margin: 10pt 0 0;
            color: #4d4135;
            font-family: Arial, sans-serif;
            font-size: 10pt;
            line-height: 1.45;
          }

          .nutrition-table {
            margin-top: 8pt;
          }

          .nutrition-table th,
          .nutrition-table td {
            padding: 5pt 6pt;
            border-bottom: 1pt solid #6b6055;
          }

          .nutrition-table thead th {
            font-family: Arial, sans-serif;
            font-size: 8.5pt;
            font-weight: bold;
            text-transform: uppercase;
            text-align: right;
          }

          .nutrition-table thead th:first-child {
            text-align: left;
          }

          .nutrition-table tbody th {
            font-family: Arial, sans-serif;
            font-size: 11pt;
            font-weight: bold;
            text-align: left;
          }

          .nutrition-table tbody td {
            font-family: Arial, sans-serif;
            font-size: 10.5pt;
            font-weight: bold;
            text-align: right;
          }

          .nutrition-table .calories-row th,
          .nutrition-table .calories-row td {
            border-bottom: 4pt solid #1f1812;
          }

          .nutrition-table .calories-row th {
            font-size: 20pt;
          }

          .nutrition-table .calories-row td {
            font-size: 24pt;
            line-height: 1;
          }

          .nutrition-table .sub-row th {
            padding-left: 14pt;
            font-weight: normal;
          }

          .nutrition-ingredients {
            margin-top: 12pt;
            padding-top: 10pt;
            border-top: 3pt solid #1f1812;
          }

          .nutrition-ingredients-label {
            font-family: Arial, sans-serif;
            font-size: 9pt;
            font-weight: bold;
            text-transform: uppercase;
          }

          .nutrition-ingredients-copy {
            margin-top: 6pt;
            font-family: Arial, sans-serif;
            font-size: 10.5pt;
            line-height: 1.45;
            font-weight: bold;
          }

          .nutrition-note,
          .nutrition-footnote {
            color: #5e5348;
            font-family: Arial, sans-serif;
            font-size: 9pt;
            line-height: 1.35;
          }

          .nutrition-note {
            margin-top: 6pt;
          }

          .nutrition-footnote {
            margin-top: 8pt;
            padding-top: 8pt;
            border-top: 1pt solid #8b8177;
          }

          .nutrition-empty h2 {
            font-family: Arial, sans-serif;
            font-size: 22pt;
            font-weight: bold;
            line-height: 1;
            text-transform: uppercase;
          }

          .nutrition-empty p {
            margin-top: 10pt;
            font-family: Arial, sans-serif;
            font-size: 10.5pt;
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        <div class="WordSection1">
          <div class="doc">
            <table class="header-table" role="presentation">
              <tr>
                <td class="header-copy">
                  <div class="doc-overline">Heritage Recipe Sheet</div>
                  <h1>${escapeHtml(displayTitle)}</h1>
                  <p class="summary">Formatted from your working draft with instruction-matched ingredients and a pantry-style nutrition estimate ready to print, save, or share.</p>
                </td>
                <td class="header-note">
                  <div class="header-note-copy">Word kitchen copy</div>
                </td>
              </tr>
            </table>

            ${metaParts.length > 0 ? `<p class="meta-line">${metaParts.join(' &nbsp;&nbsp;|&nbsp;&nbsp; ')}</p>` : ''}

            <table class="layout-table" role="presentation">
              <tr>
                <td class="main-col">
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
                    <div class="section section-first">
                      <table class="section-head-table" role="presentation">
                        <tr>
                          <td class="section-number-col"><span class="section-number-box">00</span></td>
                          <td class="section-copy-col">
                            <div class="section-kicker">Setup</div>
                            <h2>Bust out these tools</h2>
                            <p>Everything you need before you start cooking.</p>
                          </td>
                        </tr>
                      </table>
                      <p class="tools-line"><strong>Tools:</strong> ${state.equipment.map((tool) => escapeHtml(tool)).join(', ')}</p>
                    </div>
                  ` : ''}

                  <div class="section ${state.equipment.length > 0 ? '' : 'section-first'}">
                    <table class="section-head-table" role="presentation">
                      <tr>
                        <td class="section-number-col"><span class="section-number-box">01</span></td>
                        <td class="section-copy-col">
                          <div class="section-kicker">Pantry</div>
                          <h2>Ingredients</h2>
                          <p>Only ingredients that still appear in the method stay in the printable recipe.</p>
                        </td>
                      </tr>
                    </table>
                    <ol>
                      ${state.usedIngredients.map((ingredient) => `<li>${escapeHtml(ingredient)}</li>`).join('')}
                    </ol>
                  </div>

                  <div class="section">
                    <table class="section-head-table" role="presentation">
                      <tr>
                        <td class="section-number-col"><span class="section-number-box">02</span></td>
                        <td class="section-copy-col">
                          <div class="section-kicker">Method</div>
                          <h2>Instructions</h2>
                          <p>Clear steps paired to the final ingredient list.</p>
                        </td>
                      </tr>
                    </table>
                    <ol>
                      ${state.instructions.map((instruction) => `<li>${escapeHtml(instruction)}</li>`).join('')}
                    </ol>
                  </div>
                </td>

                <td class="sidebar-col">
                  ${state.nutritionEstimate.matchedIngredientCount > 0 ? `
                    <div class="nutrition-kicker">Recipe Pantry Label</div>
                    <div class="nutrition-label">
                      <table class="nutrition-title-table" role="presentation">
                        <tr>
                          <td class="nutrition-title-cell"><div class="nutrition-title">Nutrition Facts</div></td>
                          <td class="nutrition-pill-cell"><span class="nutrition-pill">Estimate</span></td>
                        </tr>
                      </table>
                      <div class="nutrition-serving-line">${escapeHtml(state.nutritionEstimate.servingsText ?? 'Serving count not provided')}${state.nutritionEstimate.servingsText ? ' per recipe' : ''}</div>
                      <table class="nutrition-serving-table" role="presentation">
                        <tr>
                          <td class="nutrition-serving-label">Serving size</td>
                          <td class="nutrition-serving-value">${hasServings ? '1 serving' : 'Whole recipe'}</td>
                        </tr>
                      </table>
                      <p class="nutrition-trust">${escapeHtml(trustCopy)}</p>

                      <table class="nutrition-table">
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
                        <p class="nutrition-ingredients-copy">${escapeHtml(ingredientStatement)}</p>
                        <p class="nutrition-note">Shown from the ingredients still used in the final recipe. Recognized pantry items are ordered first by estimated weight.</p>
                      </div>
                      <p class="nutrition-footnote">Calories and macros are estimated from the ingredients kept in the recipe, common kitchen weights, and your serving count.</p>
                    </div>
                  ` : `
                    <div class="nutrition-empty">
                      <h2>Nutrition Facts</h2>
                      <p>We could not estimate this recipe yet. Use lines like <strong>2 cups flour</strong> or <strong>3 eggs</strong> so the label feels like a real pantry panel.</p>
                    </div>
                  `}
                </td>
              </tr>
            </table>
          </div>
        </div>
      </body>
    </html>
  `;
}
