import { createWorker, PSM } from 'tesseract.js';

export type RecipePhotoConfidence = 'high' | 'medium' | 'low';

export interface RecipePhotoDraft {
  title: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  ingredients: string[];
  instructions: string[];
  warnings: string[];
  rawText: string;
  confidence: RecipePhotoConfidence;
}

export interface RecipePhotoImportProgress {
  phase: 'preparing' | 'reading' | 'parsing' | 'done';
  progress: number;
  message: string;
}

interface RecipeLineRecord {
  clean: string;
  index: number;
}

type OcrWorker = Awaited<ReturnType<typeof createWorker>>;

const INGREDIENT_HEADING_PATTERN = /^(?:ingredients?|what you(?:'|’)ll need|shopping list|pantry)\b[:\s-]*$/i;
const INSTRUCTION_HEADING_PATTERN = /^(?:instructions?|directions?|method|steps?|preparation)\b[:\s-]*$/i;
const META_PREP_PATTERN = /^(?:prep(?:aration)?(?:\s+time)?|hands[-\s]?on(?:\s+time)?)\s*[:\-–]?\s*(.+)$/i;
const META_COOK_PATTERN = /^(?:cook(?:ing)?(?:\s+time)?|bake(?:\s+time)?|total\s+time)\s*[:\-–]?\s*(.+)$/i;
const META_SERVINGS_PATTERN = /^(?:serves?|servings?|yield|makes?)\s*[:\-–]?\s*(.+)$/i;
const INSTRUCTION_START_PATTERN = /^(?:step\s*)?\d+\s*[.)-]\s*|^[•*-]\s+|^(?:preheat|heat|whisk|mix|stir|combine|add|beat|fold|bake|cook|let|pour|transfer|divide|grease|line|place|simmer|bring|melt|toss|season|serve|top|sprinkle|knead|shape|chill)\b/i;
const INGREDIENT_START_PATTERN = /^(?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?|¼|½|¾|⅓|⅔|⅛|one|two|three|four|five|six|seven|eight|nine|ten|a|an|pinch|dash|handful|few|couple)\b/i;
const INGREDIENT_UNIT_PATTERN = /\b(?:cups?|tablespoons?|tbsp|tbsps?|teaspoons?|tsp|tsps?|ounces?|oz|pounds?|lbs?|lb|grams?|g|kilograms?|kg|kgs?|milliliters?|ml|liters?|litres?|l|cloves?|sticks?|packages?|pkgs?|cans?|large|medium|small)\b/i;

let workerPromise: Promise<OcrWorker> | null = null;
let activeProgressListener: ((progress: RecipePhotoImportProgress) => void) | null = null;

export class RecipePhotoImportError extends Error {
  readonly rawText: string;
  readonly warnings: string[];

  constructor(message: string, options?: { rawText?: string; warnings?: string[] }) {
    super(message);
    this.name = 'RecipePhotoImportError';
    this.rawText = options?.rawText ?? '';
    this.warnings = options?.warnings ?? [];
  }
}

function emitProgress(
  listener: ((progress: RecipePhotoImportProgress) => void) | undefined,
  progress: RecipePhotoImportProgress
) {
  listener?.(progress);
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function cleanOcrLine(value: string): string {
  return normalizeWhitespace(
    value
      .replace(/[|]/g, 'I')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, '\'')
      .replace(/\s+([,.;:!?])/g, '$1')
  );
}

function stripInstructionNumbering(line: string): string {
  return line
    .trim()
    .replace(/^step\s*\d+\s*[:.)-]?\s*/i, '')
    .replace(/^\d+\s*[.)-]\s*/, '')
    .replace(/^[•*-]\s+/, '')
    .trim();
}

function isIngredientHeading(line: string): boolean {
  return INGREDIENT_HEADING_PATTERN.test(line.trim());
}

function isInstructionHeading(line: string): boolean {
  return INSTRUCTION_HEADING_PATTERN.test(line.trim());
}

function looksLikeInstructionStart(line: string): boolean {
  return INSTRUCTION_START_PATTERN.test(line.trim());
}

function looksLikeIngredientLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) {
    return false;
  }

  return (
    INGREDIENT_START_PATTERN.test(trimmed) ||
    (/^\d/.test(trimmed) && INGREDIENT_UNIT_PATTERN.test(trimmed)) ||
    (/^[•*-]\s*/.test(trimmed) && !looksLikeInstructionStart(trimmed))
  );
}

function dedupeNeighborLines(lines: string[]): string[] {
  const normalized: string[] = [];

  lines.forEach((line) => {
    if (!line) {
      return;
    }

    if (normalized[normalized.length - 1]?.toLowerCase() === line.toLowerCase()) {
      return;
    }

    normalized.push(line);
  });

  return normalized;
}

function extractLineRecords(rawText: string, structuredLines?: string[]): RecipeLineRecord[] {
  const sourceLines = structuredLines && structuredLines.length > 0
    ? structuredLines
    : rawText.split('\n');

  return dedupeNeighborLines(
    sourceLines
      .map((line) => cleanOcrLine(line))
      .filter((line) => line.length > 0)
  ).map((line, index) => ({
    clean: line,
    index
  }));
}

function extractStructuredLinesFromResult(result: Tesseract.RecognizeResult): string[] {
  const blockLines = result.data.blocks?.flatMap((block) =>
    block.paragraphs.flatMap((paragraph) =>
      paragraph.lines.map((line) => cleanOcrLine(line.text))
    )
  ) ?? [];

  const normalized = blockLines.filter((line) => line.length > 0);
  if (normalized.length > 0) {
    return normalized;
  }

  return result.data.text
    .split('\n')
    .map((line) => cleanOcrLine(line))
    .filter((line) => line.length > 0);
}

function pickTitle(records: RecipeLineRecord[], ignoredIndexes: Set<number>): string {
  const firstHeadingIndex = records.find((record) => isIngredientHeading(record.clean) || isInstructionHeading(record.clean))?.index ?? Infinity;
  const candidates = records.filter((record) =>
    !ignoredIndexes.has(record.index) &&
    record.index < firstHeadingIndex &&
    !looksLikeIngredientLine(record.clean) &&
    !looksLikeInstructionStart(record.clean) &&
    record.clean.length >= 3 &&
    record.clean.length <= 100
  );

  return candidates[0]?.clean ?? '';
}

function parseMetadata(records: RecipeLineRecord[]) {
  const ignoredIndexes = new Set<number>();
  let prepTime = '';
  let cookTime = '';
  let servings = '';

  records.forEach((record) => {
    const prepMatch = record.clean.match(META_PREP_PATTERN);
    if (prepMatch && !prepTime) {
      prepTime = normalizeWhitespace(prepMatch[1]);
      ignoredIndexes.add(record.index);
      return;
    }

    const cookMatch = record.clean.match(META_COOK_PATTERN);
    if (cookMatch && !cookTime) {
      cookTime = normalizeWhitespace(cookMatch[1]);
      ignoredIndexes.add(record.index);
      return;
    }

    const servingsMatch = record.clean.match(META_SERVINGS_PATTERN);
    if (servingsMatch && !servings) {
      servings = normalizeWhitespace(servingsMatch[1]);
      ignoredIndexes.add(record.index);
    }
  });

  return {
    prepTime,
    cookTime,
    servings,
    ignoredIndexes
  };
}

function inferSectionsWithoutHeadings(records: RecipeLineRecord[]) {
  const splitAtExplicitStep = records.findIndex((record, index) =>
    index > 0 &&
    looksLikeInstructionStart(record.clean) &&
    records.slice(0, index).filter((candidate) => looksLikeIngredientLine(candidate.clean)).length >= 2
  );

  if (splitAtExplicitStep > 0) {
    return {
      ingredientLines: records.slice(0, splitAtExplicitStep).map((record) => record.clean),
      instructionLines: records.slice(splitAtExplicitStep).map((record) => record.clean),
      usedHeadings: false
    };
  }

  let ingredientRunLength = 0;
  while (ingredientRunLength < records.length && looksLikeIngredientLine(records[ingredientRunLength].clean)) {
    ingredientRunLength += 1;
  }

  if (ingredientRunLength >= 2) {
    return {
      ingredientLines: records.slice(0, ingredientRunLength).map((record) => record.clean),
      instructionLines: records.slice(ingredientRunLength).map((record) => record.clean),
      usedHeadings: false
    };
  }

  return {
    ingredientLines: [],
    instructionLines: [],
    usedHeadings: false
  };
}

function splitIntoSections(records: RecipeLineRecord[], ignoredIndexes: Set<number>) {
  const filteredRecords = records.filter((record) => !ignoredIndexes.has(record.index));
  const ingredientHeadingIndex = filteredRecords.findIndex((record) => isIngredientHeading(record.clean));
  const instructionHeadingIndex = filteredRecords.findIndex((record) => isInstructionHeading(record.clean));

  if (ingredientHeadingIndex === -1 && instructionHeadingIndex === -1) {
    return inferSectionsWithoutHeadings(filteredRecords);
  }

  if (ingredientHeadingIndex !== -1 && instructionHeadingIndex !== -1) {
    if (ingredientHeadingIndex < instructionHeadingIndex) {
      return {
        ingredientLines: filteredRecords
          .slice(ingredientHeadingIndex + 1, instructionHeadingIndex)
          .map((record) => record.clean),
        instructionLines: filteredRecords
          .slice(instructionHeadingIndex + 1)
          .map((record) => record.clean),
        usedHeadings: true
      };
    }

    return {
      ingredientLines: filteredRecords
        .slice(0, ingredientHeadingIndex)
        .map((record) => record.clean),
      instructionLines: filteredRecords
        .slice(instructionHeadingIndex + 1, ingredientHeadingIndex)
        .map((record) => record.clean),
      usedHeadings: true
    };
  }

  if (ingredientHeadingIndex !== -1) {
    const afterHeading = filteredRecords.slice(ingredientHeadingIndex + 1);
    const splitIndex = afterHeading.findIndex((record, index) =>
      index > 0 &&
      looksLikeInstructionStart(record.clean) &&
      afterHeading.slice(0, index).filter((candidate) => looksLikeIngredientLine(candidate.clean)).length >= 2
    );

    return {
      ingredientLines: splitIndex > 0
        ? afterHeading.slice(0, splitIndex).map((record) => record.clean)
        : afterHeading.map((record) => record.clean),
      instructionLines: splitIndex > 0
        ? afterHeading.slice(splitIndex).map((record) => record.clean)
        : [],
      usedHeadings: true
    };
  }

  return {
    ingredientLines: filteredRecords
      .slice(0, instructionHeadingIndex)
      .map((record) => record.clean),
    instructionLines: filteredRecords
      .slice(instructionHeadingIndex + 1)
      .map((record) => record.clean),
    usedHeadings: true
  };
}

function normalizeIngredientLines(lines: string[]): string[] {
  const normalized: string[] = [];

  lines.forEach((line) => {
    const cleaned = line.replace(/^[•*-]\s*/, '').trim();
    if (!cleaned || isInstructionHeading(cleaned) || isIngredientHeading(cleaned)) {
      return;
    }

    if (normalized.length > 0 && !looksLikeIngredientLine(cleaned) && !looksLikeInstructionStart(cleaned)) {
      normalized[normalized.length - 1] = normalizeWhitespace(`${normalized[normalized.length - 1]} ${cleaned}`);
      return;
    }

    normalized.push(cleaned);
  });

  return dedupeNeighborLines(normalized);
}

function normalizeInstructionLines(lines: string[]): string[] {
  const steps: string[] = [];

  lines.forEach((line) => {
    const cleaned = line.replace(/^[•*-]\s*/, '').trim();
    if (!cleaned || isInstructionHeading(cleaned) || isIngredientHeading(cleaned)) {
      return;
    }

    const stripped = stripInstructionNumbering(cleaned);
    if (!stripped) {
      return;
    }

    if (steps.length === 0) {
      steps.push(stripped);
      return;
    }

    const lastStep = steps[steps.length - 1];
    const shouldStartNewStep = looksLikeInstructionStart(cleaned) || /[.!?]$/.test(lastStep);

    if (shouldStartNewStep) {
      steps.push(stripped);
      return;
    }

    steps[steps.length - 1] = normalizeWhitespace(`${lastStep} ${stripped}`);
  });

  return dedupeNeighborLines(steps);
}

function getConfidence(
  usedHeadings: boolean,
  ingredients: string[],
  instructions: string[],
  warnings: string[],
  rawText: string
): RecipePhotoConfidence {
  if (rawText.trim().length < 50 || (ingredients.length === 0 && instructions.length === 0)) {
    return 'low';
  }

  if (usedHeadings && ingredients.length >= 2 && instructions.length >= 1 && warnings.length <= 1) {
    return 'high';
  }

  if (ingredients.length >= 2 && instructions.length >= 1) {
    return 'medium';
  }

  return 'low';
}

export function parseRecipeText(rawText: string, structuredLines?: string[]): RecipePhotoDraft {
  const records = extractLineRecords(rawText, structuredLines);
  const warnings: string[] = [];
  const metadata = parseMetadata(records);
  const title = pickTitle(records, metadata.ignoredIndexes);

  if (title) {
    const titleRecord = records.find((record) => record.clean === title);
    if (titleRecord) {
      metadata.ignoredIndexes.add(titleRecord.index);
    }
  }

  const sections = splitIntoSections(records, metadata.ignoredIndexes);
  const ingredients = normalizeIngredientLines(sections.ingredientLines);
  const instructions = normalizeInstructionLines(sections.instructionLines);

  if (!sections.usedHeadings) {
    warnings.push('Section headings were not clearly detected, so the ingredient list and method were inferred.');
  }

  if (!metadata.prepTime && !metadata.cookTime) {
    warnings.push('Prep and cook time could not be confidently read from the photo.');
  }

  if (!metadata.servings) {
    warnings.push('Serving count could not be confidently read from the photo.');
  }

  if (ingredients.length === 0) {
    warnings.push('Ingredients were hard to separate. Review the draft before formatting.');
  }

  if (instructions.length === 0) {
    warnings.push('Instructions were hard to separate. Review the draft before formatting.');
  }

  const confidence = getConfidence(sections.usedHeadings, ingredients, instructions, warnings, rawText);

  return {
    title,
    prepTime: metadata.prepTime,
    cookTime: metadata.cookTime,
    servings: metadata.servings,
    ingredients,
    instructions,
    warnings: Array.from(new Set(warnings)),
    rawText: rawText.trim(),
    confidence
  };
}

async function loadImageSource(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      return await createImageBitmap(file);
    }
  }

  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unable to load image.'));
    };
    image.src = objectUrl;
  });
}

async function preprocessRecipePhoto(file: File): Promise<HTMLCanvasElement> {
  const source = await loadImageSource(file);
  const width = source instanceof HTMLImageElement ? (source.naturalWidth || source.width) : source.width;
  const height = source instanceof HTMLImageElement ? (source.naturalHeight || source.height) : source.height;

  if (!width || !height) {
    throw new RecipePhotoImportError('The selected image could not be prepared for OCR.');
  }

  const maxDimension = 2000;
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    throw new RecipePhotoImportError('Canvas support is unavailable in this browser.');
  }

  context.drawImage(source, 0, 0, canvas.width, canvas.height);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;

  for (let index = 0; index < data.length; index += 4) {
    const luminance = (0.299 * data[index]) + (0.587 * data[index + 1]) + (0.114 * data[index + 2]);
    const contrasted = Math.max(0, Math.min(255, ((luminance - 128) * 1.28) + 128));
    const normalized = contrasted > 188 ? 255 : contrasted < 72 ? 0 : contrasted;

    data[index] = normalized;
    data[index + 1] = normalized;
    data[index + 2] = normalized;
  }

  context.putImageData(imageData, 0, 0);

  if ('close' in source && typeof source.close === 'function') {
    source.close();
  }

  return canvas;
}

function handleWorkerLogger(message: Tesseract.LoggerMessage) {
  if (!activeProgressListener) {
    return;
  }

  const statusText = normalizeWhitespace(message.status.replace(/_/g, ' '));
  activeProgressListener({
    phase: 'reading',
    progress: Math.max(0.1, Math.min(0.98, message.progress)),
    message: statusText.charAt(0).toUpperCase() + statusText.slice(1)
  });
}

async function getWorker(): Promise<OcrWorker> {
  if (!workerPromise) {
    workerPromise = createWorker('eng', undefined, {
      logger: handleWorkerLogger,
      errorHandler: () => {
        /* Surface OCR failures through recognize() instead of double-reporting them here. */
      }
    }).then(async (worker) => {
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO,
        preserve_interword_spaces: '1'
      });
      return worker;
    });
  }

  return workerPromise;
}

export async function importRecipeFromPhoto(
  file: File,
  onProgress?: (progress: RecipePhotoImportProgress) => void
): Promise<RecipePhotoDraft> {
  emitProgress(onProgress, {
    phase: 'preparing',
    progress: 0.08,
    message: 'Preparing the photo for OCR'
  });

  const processedCanvas = await preprocessRecipePhoto(file);

  emitProgress(onProgress, {
    phase: 'reading',
    progress: 0.18,
    message: 'Reading printed text'
  });

  const worker = await getWorker();
  activeProgressListener = onProgress ?? null;

  try {
    const result = await worker.recognize(
      processedCanvas,
      { rotateAuto: true },
      { text: true, blocks: true }
    );

    const rawText = result.data.text.trim();
    const structuredLines = extractStructuredLinesFromResult(result);

    if (rawText.length < 40 || structuredLines.length < 3) {
      throw new RecipePhotoImportError(
        'Not enough readable recipe text was found. Try a brighter, straighter photo or a screenshot.',
        { rawText }
      );
    }

    emitProgress(onProgress, {
      phase: 'parsing',
      progress: 0.92,
      message: 'Turning the OCR text into recipe fields'
    });

    const draft = parseRecipeText(rawText, structuredLines);

    if (draft.ingredients.length === 0 && draft.instructions.length === 0) {
      throw new RecipePhotoImportError(
        'The text was detected, but it could not be separated into ingredients and instructions.',
        {
          rawText,
          warnings: draft.warnings
        }
      );
    }

    emitProgress(onProgress, {
      phase: 'done',
      progress: 1,
      message: 'Recipe draft ready'
    });

    return draft;
  } finally {
    activeProgressListener = null;
  }
}
