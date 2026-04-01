import type { FormattedRecipe } from '../../utils/recipeFormatter';
import type { NutritionEstimate } from '../../utils/nutritionCalculator';
import { getRecipeDisplayTitle } from './helpers';
import { buildRecipeDocumentHtml } from './documentHtml';
import { buildRecipeWordHtml } from './wordHtml';
import { buildNutritionRows, buildNutritionTrustCopy, buildRecipeIngredientStatement } from './renderers';
import type { RecipeExportState } from './types';

export function buildRecipeTextExport(state: RecipeExportState): string {
  const displayTitle = getRecipeDisplayTitle(state.title);
  const textLines: string[] = [displayTitle, ''];

  if (state.prepTime || state.cookTime || state.servings) {
    textLines.push('Meta:');
    if (state.prepTime) textLines.push(`- Prep Time: ${state.prepTime}`);
    if (state.cookTime) textLines.push(`- Cook Time: ${state.cookTime}`);
    if (state.servings) textLines.push(`- Servings: ${state.servings}`);
    textLines.push('');
  }

  if (state.removedIngredients.length > 0) {
    textLines.push('Cook\'s Note:');
    textLines.push('- Removed from the final recipe because they do not appear in the method:');
    state.removedIngredients.forEach((ingredient) => {
      textLines.push(`  - ${ingredient}`);
    });
    textLines.push('');
  }

  if (state.nutritionEstimate.matchedIngredientCount > 0) {
    const nutritionRows = buildNutritionRows(state.nutritionEstimate);
    textLines.push('Nutrition Facts (Estimate):');
    textLines.push(`- ${buildNutritionTrustCopy(state.nutritionEstimate)}`);
    nutritionRows.forEach((row) => {
      textLines.push(`- ${row.label}: ${row.perServing}${state.nutritionEstimate.servingsCount ? ` per serving | ${row.total} whole recipe` : ''}`);
    });
    textLines.push(`- Ingredients: ${buildRecipeIngredientStatement(state.usedIngredients, state.nutritionEstimate)}`);
    textLines.push('');
  }

  if (state.equipment.length > 0) {
    textLines.push(`Equipment Needed: ${state.equipment.join(', ')}`);
    textLines.push('');
  }

  textLines.push('Ingredients:');
  state.usedIngredients.forEach((ingredient) => {
    textLines.push(`- ${ingredient}`);
  });
  textLines.push('');
  textLines.push('Instructions:');
  state.instructions.forEach((instruction, index) => {
    textLines.push(`${index + 1}. ${instruction}`);
  });

  return textLines.join('\n');
}

export function buildRecipeMarkdownExport(state: RecipeExportState): string {
  const displayTitle = getRecipeDisplayTitle(state.title);
  const lines: string[] = [`# ${displayTitle}`, ''];

  if (state.prepTime || state.cookTime || state.servings) {
    lines.push('## Meta');
    if (state.prepTime) lines.push(`- Prep Time: ${state.prepTime}`);
    if (state.cookTime) lines.push(`- Cook Time: ${state.cookTime}`);
    if (state.servings) lines.push(`- Servings: ${state.servings}`);
    lines.push('');
  }

  if (state.removedIngredients.length > 0) {
    lines.push('## Cook\'s Note');
    lines.push('These ingredients were left out of the final recipe because they do not appear in the method:');
    lines.push('');
    state.removedIngredients.forEach((ingredient) => lines.push(`- ${ingredient}`));
    lines.push('');
  }

  if (state.nutritionEstimate.matchedIngredientCount > 0) {
    lines.push('## Nutrition Facts (Estimate)');
    lines.push(`- Trust note: ${buildNutritionTrustCopy(state.nutritionEstimate)}`);
    buildNutritionRows(state.nutritionEstimate).forEach((row) => {
      lines.push(`- ${row.label}: ${row.perServing}${state.nutritionEstimate.servingsCount ? ` per serving | ${row.total} whole recipe` : ''}`);
    });
    lines.push(`- Ingredients: ${buildRecipeIngredientStatement(state.usedIngredients, state.nutritionEstimate)}`);
    lines.push('');
  }

  if (state.equipment.length > 0) {
    lines.push('## Equipment');
    state.equipment.forEach((tool) => lines.push(`- ${tool}`));
    lines.push('');
  }

  lines.push('## Ingredients');
  state.usedIngredients.forEach((ingredient) => lines.push(`- ${ingredient}`));
  lines.push('');
  lines.push('## Instructions');
  state.instructions.forEach((instruction, index) => lines.push(`${index + 1}. ${instruction}`));

  return lines.join('\n');
}

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 1200);
}

function buildExportFilename(title: string, extension: string): string {
  const recipeSlug = getRecipeDisplayTitle(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'formatted-recipe';
  const dateTag = new Date().toISOString().slice(0, 10);
  return `${recipeSlug}-${dateTag}.${extension}`;
}

export function exportRecipeToPdf(state: RecipeExportState): boolean {
  const printableHtml = buildRecipeDocumentHtml(state, { autoPrint: true });
  const blob = new Blob([printableHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank', 'width=960,height=1280');
  if (!printWindow) {
    URL.revokeObjectURL(url);
    return false;
  }

  printWindow.focus();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 60_000);

  return true;
}

export function exportRecipeToWord(state: RecipeExportState) {
  downloadFile(
    buildExportFilename(state.title, 'doc'),
    `\ufeff${buildRecipeWordHtml(state)}`,
    'application/msword;charset=utf-8'
  );
}

export function exportRecipeToMarkdown(state: RecipeExportState) {
  downloadFile(
    buildExportFilename(state.title, 'md'),
    `\ufeff${buildRecipeMarkdownExport(state)}`,
    'text/markdown;charset=utf-8'
  );
}

export function buildRecipeState(
  title: string,
  prepTime: string,
  cookTime: string,
  servings: string,
  formattedRecipe: FormattedRecipe,
  nutritionEstimate: NutritionEstimate,
  instructions: string[]
): RecipeExportState {
  return {
    title,
    prepTime,
    cookTime,
    servings,
    usedIngredients: formattedRecipe.reorderedIngredients,
    removedIngredients: formattedRecipe.unmatchedIngredients,
    instructions,
    equipment: Array.from(new Set(formattedRecipe.equipment)),
    nutritionEstimate
  };
}
