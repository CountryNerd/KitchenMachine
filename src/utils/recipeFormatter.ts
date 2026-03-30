export interface FormattedRecipe {
    reorderedIngredients: string[];
    unmatchedIngredients: string[];
    equipment: string[];
}

export function formatRecipe(ingredients: string[], instructions: string): FormattedRecipe {
    // Extract ingredient names (remove amounts)
    const ingredientNames = ingredients.map(ing => {
        // Remove leading numbers, fractions, and common measurement words
        const cleaned = ing
            .replace(/^\d+\.?\d*\s*/, '') // Remove leading numbers
            .replace(/^\d+\/\d+\s*/, '') // Remove fractions
            .replace(/^\d+\s+\d+\/\d+\s*/, '') // Remove mixed fractions
            .replace(/^(cup|cups|tbsp|tsp|tablespoon|tablespoons|teaspoon|teaspoons|oz|ounce|ounces|lb|pound|pounds|g|gram|grams|kg|ml|liter|liters)\s+/i, '');

        return {
            original: ing,
            name: cleaned.trim().toLowerCase(),
            // Extract first significant word for matching
            keyword: cleaned.trim().split(/\s+/)[0].toLowerCase()
        };
    });

    const instructionsLower = instructions.toLowerCase();
    const matched: string[] = [];
    const unmatched: string[] = [];

    // Find ingredients in order of appearance in instructions
    const positions = ingredientNames.map(ing => {
        const keywordPos = instructionsLower.indexOf(ing.keyword);
        const namePos = instructionsLower.indexOf(ing.name);
        const position = keywordPos !== -1 ? keywordPos : namePos;

        return {
            ingredient: ing.original,
            position: position,
            found: position !== -1
        };
    });

    // Sort by position in instructions
    positions.sort((a, b) => {
        if (!a.found && !b.found) return 0;
        if (!a.found) return 1;
        if (!b.found) return -1;
        return a.position - b.position;
    });

    positions.forEach(item => {
        if (item.found) {
            matched.push(item.ingredient);
        } else {
            unmatched.push(item.ingredient);
        }
    });

    // Equipment extraction logic
    const commonEquipment = [
        'pan', 'skillet', 'bowl', 'whisk', 'spatula', 'baking sheet', 'pot', 'oven', 'mixer', 'blender',
        'food processor', 'saucepan', 'measuring cup', 'measuring spoon', 'knife', 'cutting board',
        'tongs', 'ladle', 'strainer', 'colander', 'grater', 'peeler', 'rolling pin', 'baking pan',
        'cake pan', 'muffin tin', 'loaf pan', 'pie dish', 'roasting pan', 'dutch oven', 'thermometer'
    ];

    const extractedEquipment = commonEquipment.filter(equip => instructionsLower.includes(equip));

    return {
        reorderedIngredients: matched,
        unmatchedIngredients: unmatched,
        equipment: extractedEquipment
    };
}
