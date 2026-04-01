import { formatRecipe } from '../utils/recipeFormatter';
import { buildNutritionEstimate } from '../utils/nutritionCalculator';
import {
  importRecipeFromPhoto,
  RecipePhotoDraft,
  RecipePhotoImportError,
  RecipePhotoImportProgress
} from '../utils/recipePhotoImport';
import { SAMPLE_RECIPE_INPUT } from './recipeFormatter/constants';
import { buildRecipeState, buildRecipeTextExport, exportRecipeToMarkdown, exportRecipeToPdf, exportRecipeToWord } from './recipeFormatter/exports';
import { escapeHtml, normalizeInstructionLines, pickDelightMessage } from './recipeFormatter/helpers';
import { renderRecipeSheet } from './recipeFormatter/renderers';
import type { RecipeExportState, SubmitReason } from './recipeFormatter/types';
import { applySectionRevealStagger, flashActionButtonLabel, showFormatterToast } from './recipeFormatter/ui';

export function renderRecipeFormatter(): string {
  return `
    <div class="card rf-card">
      <form id="recipe-formatter-form">
        <section class="rf-photo-intake" aria-labelledby="rf-photo-heading">
          <div class="rf-photo-header">
            <div class="rf-photo-copy">
              <div id="rf-photo-heading" class="rf-photo-kicker">Photo to Recipe</div>
              <p class="rf-photo-text">Snap a printed recipe or upload a screenshot and we will turn it into editable fields for you to review. Works best on straight, high-contrast English recipes.</p>
            </div>
            <div class="rf-photo-actions">
              <button type="button" id="rf-photo-camera" class="rf-btn-secondary">
                <span class="material-icons" aria-hidden="true">photo_camera</span>
                Take Photo
              </button>
              <button type="button" id="rf-photo-upload" class="rf-btn-secondary">
                <span class="material-icons" aria-hidden="true">upload</span>
                Upload Photo
              </button>
            </div>
          </div>

          <input type="file" id="rf-photo-camera-input" accept="image/*" capture="environment" hidden>
          <input type="file" id="rf-photo-upload-input" accept="image/*" hidden>

          <div id="rf-photo-review" class="rf-photo-review" hidden></div>

          <div id="rf-photo-status" class="rf-photo-status" hidden>
            <div class="rf-photo-status-top">
              <strong id="rf-photo-status-title">Reading recipe photo</strong>
              <span id="rf-photo-status-message">Preparing image</span>
            </div>
            <div class="rf-photo-progress-track" aria-hidden="true">
              <span id="rf-photo-progress-bar" class="rf-photo-progress-bar"></span>
            </div>
          </div>

          <div id="rf-photo-warning" class="rf-photo-warning" hidden></div>

          <details id="rf-photo-raw" class="rf-photo-raw" hidden>
            <summary>Detected text</summary>
            <pre id="rf-photo-raw-text"></pre>
          </details>
        </section>

        <div class="rf-input-group">
          <label for="formatter-title" class="rf-label">Recipe Title</label>
          <input type="text" id="formatter-title" class="rf-input" placeholder="e.g. Sunday Cinnamon Cake">
        </div>

        <div class="rf-meta-inputs">
          <div class="rf-input-group">
            <label for="formatter-prep" class="rf-label">Prep Time</label>
            <input type="text" id="formatter-prep" class="rf-input" placeholder="e.g. 15 mins">
          </div>
          <div class="rf-input-group">
            <label for="formatter-cook" class="rf-label">Cook Time</label>
            <input type="text" id="formatter-cook" class="rf-input" placeholder="e.g. 45 mins">
          </div>
          <div class="rf-input-group">
            <label for="formatter-servings" class="rf-label">Servings</label>
            <input type="text" id="formatter-servings" class="rf-input" placeholder="e.g. 4 servings">
          </div>
        </div>

        <div class="rf-input-group">
          <label for="formatter-ingredients" class="rf-label">Ingredients (one per line)</label>
          <textarea
            id="formatter-ingredients"
            class="rf-textarea"
            required
            rows="6"
            placeholder="2 cups flour&#10;1 cup sugar&#10;3 eggs&#10;1 tsp vanilla extract&#10;1/2 cup butter"
          ></textarea>
        </div>

        <div class="rf-input-group">
          <label for="formatter-instructions" class="rf-label">Instructions</label>
          <textarea
            id="formatter-instructions"
            class="rf-textarea"
            required
            rows="6"
            placeholder="Cream butter and sugar. Add eggs and vanilla. Mix in flour..."
          ></textarea>
        </div>

        <div class="rf-submit-wrapper">
          <div class="rf-submit-actions">
            <button type="button" id="rf-load-sample" class="rf-btn-secondary">
              <span class="material-icons" aria-hidden="true">menu_book</span>
              Load Sample
            </button>
            <button type="submit" class="rf-btn-primary">Format Recipe + Label</button>
          </div>
          <p class="rf-submit-hint">Need a quick test? Load a ready-to-format sample recipe.</p>
        </div>
      </form>

      <div class="rf-divider"></div>

      <div class="rf-footer">
        Format the recipe, remove unused ingredients, estimate a nutrition label, and export it however you need.
      </div>

      <div id="formatter-result-section" class="rf-result-section hidden">
        <div id="formatted-ingredients-list" class="rf-formatted-list"></div>
      </div>
      <div id="rf-toast-stack" class="rf-toast-stack" aria-live="polite" aria-atomic="false"></div>
    </div>
  `;
}

export function attachRecipeFormatterListeners() {
  const form = document.querySelector<HTMLFormElement>('#recipe-formatter-form');
  const titleInput = document.querySelector<HTMLInputElement>('#formatter-title');
  const prepInput = document.querySelector<HTMLInputElement>('#formatter-prep');
  const cookInput = document.querySelector<HTMLInputElement>('#formatter-cook');
  const servingsInput = document.querySelector<HTMLInputElement>('#formatter-servings');
  const ingredientsTextarea = document.querySelector<HTMLTextAreaElement>('#formatter-ingredients');
  const instructionsTextarea = document.querySelector<HTMLTextAreaElement>('#formatter-instructions');
  const loadSampleButton = document.querySelector<HTMLButtonElement>('#rf-load-sample');
  const photoCameraButton = document.querySelector<HTMLButtonElement>('#rf-photo-camera');
  const photoUploadButton = document.querySelector<HTMLButtonElement>('#rf-photo-upload');
  const photoCameraInput = document.querySelector<HTMLInputElement>('#rf-photo-camera-input');
  const photoUploadInput = document.querySelector<HTMLInputElement>('#rf-photo-upload-input');
  const photoReview = document.querySelector<HTMLDivElement>('#rf-photo-review');
  const photoStatus = document.querySelector<HTMLDivElement>('#rf-photo-status');
  const photoStatusTitle = document.querySelector<HTMLElement>('#rf-photo-status-title');
  const photoStatusMessage = document.querySelector<HTMLElement>('#rf-photo-status-message');
  const photoProgressBar = document.querySelector<HTMLElement>('#rf-photo-progress-bar');
  const photoWarning = document.querySelector<HTMLDivElement>('#rf-photo-warning');
  const photoRaw = document.querySelector<HTMLDetailsElement>('#rf-photo-raw');
  const photoRawText = document.querySelector<HTMLPreElement>('#rf-photo-raw-text');
  const resultList = document.querySelector<HTMLDivElement>('#formatted-ingredients-list');
  const resultSection = document.querySelector<HTMLDivElement>('#formatter-result-section');
  const card = form?.closest<HTMLElement>('.rf-card') ?? null;
  let lastRecipeState: RecipeExportState | null = null;
  let submitReason: SubmitReason = 'format';

  if (!form || !titleInput || !prepInput || !cookInput || !servingsInput || !ingredientsTextarea || !instructionsTextarea) {
    return;
  }

  const clearFormattedPreview = () => {
    lastRecipeState = null;
    if (resultList) {
      resultList.innerHTML = '';
    }
    if (resultSection) {
      resultSection.classList.add('hidden');
    }
  };

  const setPhotoButtonsDisabled = (disabled: boolean) => {
    [photoCameraButton, photoUploadButton, loadSampleButton].forEach((button) => {
      if (button) {
        button.disabled = disabled;
      }
    });
  };

  const setPhotoStatus = (progress: RecipePhotoImportProgress | null) => {
    if (!photoStatus || !photoStatusTitle || !photoStatusMessage || !photoProgressBar) {
      return;
    }

    if (!progress) {
      photoStatus.hidden = true;
      photoStatusTitle.textContent = 'Reading recipe photo';
      photoStatusMessage.textContent = '';
      photoProgressBar.style.width = '0%';
      return;
    }

    photoStatus.hidden = false;
    photoStatusTitle.textContent = progress.phase === 'done' ? 'Recipe draft ready' : 'Reading recipe photo';
    photoStatusMessage.textContent = progress.message;
    photoProgressBar.style.width = `${Math.round(progress.progress * 100)}%`;
  };

  const setPhotoReviewMessage = (draft: RecipePhotoDraft | null) => {
    if (!photoReview) {
      return;
    }

    if (!draft) {
      photoReview.hidden = true;
      photoReview.innerHTML = '';
      return;
    }

    const reviewCopy = draft.confidence === 'high'
      ? 'Recipe draft created from photo. Review the fields, then tap Format Recipe + Label.'
      : 'Recipe draft created from photo. Give the fields a quick review before you format it.';

    photoReview.hidden = false;
    photoReview.innerHTML = `
      <strong>Photo import ready.</strong>
      <span>${escapeHtml(reviewCopy)}</span>
    `;
  };

  const setPhotoWarnings = (warnings: string[], isFailure = false) => {
    if (!photoWarning) {
      return;
    }

    if (warnings.length === 0) {
      photoWarning.hidden = true;
      photoWarning.innerHTML = '';
      return;
    }

    photoWarning.hidden = false;
    photoWarning.classList.toggle('is-failure', isFailure);
    photoWarning.innerHTML = `
      <div class="rf-photo-warning-title">${isFailure ? 'Photo needs another try' : 'Review this draft'}</div>
      <ul class="rf-photo-warning-list">
        ${warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join('')}
      </ul>
    `;
  };

  const setDetectedText = (rawText: string, open = false) => {
    if (!photoRaw || !photoRawText) {
      return;
    }

    if (!rawText.trim()) {
      photoRaw.hidden = true;
      photoRaw.open = false;
      photoRawText.textContent = '';
      return;
    }

    photoRaw.hidden = false;
    photoRaw.open = open;
    photoRawText.textContent = rawText;
  };

  const fillDraftFields = (draft: RecipePhotoDraft) => {
    titleInput.value = draft.title;
    prepInput.value = draft.prepTime;
    cookInput.value = draft.cookTime;
    servingsInput.value = draft.servings;
    ingredientsTextarea.value = draft.ingredients.join('\n');
    instructionsTextarea.value = draft.instructions
      .map((instruction, index) => `${index + 1}. ${instruction}`)
      .join('\n\n');
  };

  const resetPhotoFeedback = () => {
    setPhotoReviewMessage(null);
    setPhotoWarnings([]);
    setDetectedText('');
    setPhotoStatus(null);
  };

  const handlePhotoSelection = async (file: File | null) => {
    if (!file) {
      return;
    }

    setPhotoButtonsDisabled(true);
    setPhotoReviewMessage(null);
    setPhotoWarnings([]);
    setDetectedText('');
    setPhotoStatus({
      phase: 'preparing',
      progress: 0.08,
      message: 'Preparing the photo for OCR'
    });

    try {
      const draft = await importRecipeFromPhoto(file, (progress) => {
        setPhotoStatus(progress);
      });

      fillDraftFields(draft);
      clearFormattedPreview();
      setPhotoReviewMessage(draft);
      setPhotoWarnings(draft.warnings, false);
      setDetectedText(draft.rawText, draft.warnings.length > 0 || draft.confidence === 'low');
      setPhotoStatus(null);

      titleInput.focus();
      titleInput.setSelectionRange(titleInput.value.length, titleInput.value.length);
      showFormatterToast(
        'Recipe draft created from photo. Review it, then format when you are ready.',
        draft.warnings.length > 0 ? 'info' : 'success'
      );
    } catch (error) {
      const fallbackMessage = 'We could not turn that photo into a clean recipe draft yet. Try a brighter, straighter photo or a screenshot.';
      const importError = error instanceof RecipePhotoImportError ? error : null;
      setPhotoReviewMessage(null);
      setPhotoWarnings(importError?.warnings.length ? importError.warnings : [importError?.message ?? fallbackMessage], true);
      setDetectedText(importError?.rawText ?? '', true);
      setPhotoStatus(null);
      showFormatterToast(importError?.message ?? fallbackMessage, 'warning');
    } finally {
      setPhotoButtonsDisabled(false);
    }
  };

  loadSampleButton?.addEventListener('click', () => {
    titleInput.value = SAMPLE_RECIPE_INPUT.title;
    prepInput.value = SAMPLE_RECIPE_INPUT.prepTime;
    cookInput.value = SAMPLE_RECIPE_INPUT.cookTime;
    servingsInput.value = SAMPLE_RECIPE_INPUT.servings;
    ingredientsTextarea.value = SAMPLE_RECIPE_INPUT.ingredients;
    instructionsTextarea.value = SAMPLE_RECIPE_INPUT.instructions;

    clearFormattedPreview();
    resetPhotoFeedback();

    titleInput.focus();
    titleInput.setSelectionRange(titleInput.value.length, titleInput.value.length);
    showFormatterToast('Sample recipe loaded. Tap Format Recipe + Label when you are ready.', 'info');
  });

  photoCameraButton?.addEventListener('click', () => {
    photoCameraInput?.click();
  });

  photoUploadButton?.addEventListener('click', () => {
    photoUploadInput?.click();
  });

  photoCameraInput?.addEventListener('change', async () => {
    const file = photoCameraInput.files?.[0] ?? null;
    await handlePhotoSelection(file);
    photoCameraInput.value = '';
  });

  photoUploadInput?.addEventListener('change', async () => {
    const file = photoUploadInput.files?.[0] ?? null;
    await handlePhotoSelection(file);
    photoUploadInput.value = '';
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const title = titleInput.value;
    const prepTime = prepInput.value;
    const cookTime = cookInput.value;
    const servings = servingsInput.value;
    const ingredientsText = ingredientsTextarea.value;
    const instructions = instructionsTextarea.value;
    const normalizedInstructions = normalizeInstructionLines(instructions);
    const normalizedInstructionText = normalizedInstructions.join('\n');

    const ingredients = ingredientsText.split('\n').filter((line) => line.trim().length > 0);
    const formattedRecipe = formatRecipe(ingredients, normalizedInstructionText);
    const nutritionEstimate = buildNutritionEstimate(formattedRecipe.reorderedIngredients, servings);

    lastRecipeState = buildRecipeState(
      title,
      prepTime,
      cookTime,
      servings,
      formattedRecipe,
      nutritionEstimate,
      normalizedInstructions
    );

    if (!resultList || !resultSection || !lastRecipeState) {
      return;
    }

    resultList.innerHTML = renderRecipeSheet(lastRecipeState);
    applySectionRevealStagger(resultList);
    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    if (submitReason === 'swap') {
      showFormatterToast(pickDelightMessage('swap'), 'success');
    } else if (lastRecipeState.removedIngredients.length > 0) {
      showFormatterToast(
        `${pickDelightMessage('format')} ${lastRecipeState.removedIngredients.length} ingredient${lastRecipeState.removedIngredients.length === 1 ? '' : 's'} trimmed to match your instructions.`,
        'info'
      );
    } else {
      showFormatterToast(pickDelightMessage('format'), 'success');
    }
    submitReason = 'format';
  });

  card?.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!target) {
      return;
    }

    if (target.classList.contains('rf-swap-btn')) {
      const substituteText = target.dataset.sub;
      if (!substituteText) {
        return;
      }

      const original = target.dataset.original;
      if (original) {
        ingredientsTextarea.value = ingredientsTextarea.value.replace(original, substituteText);
      }

      submitReason = 'swap';
      form.requestSubmit();
      return;
    }

    if (!lastRecipeState) {
      return;
    }

    if (target.id === 'rf-copy-btn') {
      navigator.clipboard.writeText(buildRecipeTextExport(lastRecipeState)).then(() => {
        flashActionButtonLabel(target, 'Copied', 'Copy');
        showFormatterToast(pickDelightMessage('copy'), 'success');
      });
      return;
    }

    if (target.id === 'rf-export-pdf') {
      const didOpen = exportRecipeToPdf(lastRecipeState);
      if (didOpen) {
        flashActionButtonLabel(target, 'Opened', 'PDF');
        showFormatterToast(pickDelightMessage('pdf'), 'info');
      } else {
        showFormatterToast(pickDelightMessage('blocked'), 'warning');
      }
      return;
    }

    if (target.id === 'rf-export-word') {
      exportRecipeToWord(lastRecipeState);
      flashActionButtonLabel(target, 'Saved', 'Word');
      showFormatterToast(pickDelightMessage('word'), 'success');
      return;
    }

    if (target.id === 'rf-export-md') {
      exportRecipeToMarkdown(lastRecipeState);
      flashActionButtonLabel(target, 'Saved', 'Markdown');
      showFormatterToast(pickDelightMessage('markdown'), 'success');
    }
  });
}
