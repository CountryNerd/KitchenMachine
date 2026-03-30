export interface Substitution {
    ingredient: string;
    baseAmount: number;
    baseUnit: string;
    icon: string;
    category: string;
    substitutes: {
        substitute: string;
        ratio: string; // Templated string like "{1} cup"
        explanation?: string;
        notes?: string;
        impact?: string;
        matchQuality?: 'best' | 'emergency' | 'vegan' | 'standard';
    }[];
}

export const substitutions: Substitution[] = [
    {
        ingredient: "Buttermilk",
        baseAmount: 1,
        baseUnit: "cup",
        icon: "🥛",
        category: "Dairy",
        substitutes: [
            {
                substitute: "Milk + Vinegar",
                ratio: "{1} cup milk + {1} tbsp white vinegar",
                explanation: "The acid in the vinegar curdles the milk and provides the necessary acid to react with baking soda.",
                notes: "Let stand 5 minutes until curdled",
                impact: "Texture: Thinner than buttermilk but provides the same crucial acidity for leavening.",
                matchQuality: "standard"
            },
            {
                substitute: "Milk + Lemon Juice",
                ratio: "{1} cup milk + {1} tbsp lemon juice",
                explanation: "Lemon juice acts exactly like vinegar, curdling the milk and providing required acidity.",
                notes: "Let stand 5 minutes until curdled",
                impact: "Taste: Adds a very faint citrus note. Excellent for pancakes and bright baked goods.",
                matchQuality: "standard"
            },
            {
                substitute: "Plain Yogurt",
                ratio: "{1} cup yogurt (thin with a splash of milk if needed)",
                explanation: "Yogurt is also a cultured dairy product, sharing a nearly identical pH and fat profile as buttermilk.",
                impact: "Texture: Closest match in thickness. Bakes up incredibly moist and tender.",
                matchQuality: "best"
            }
        ]
    },
    {
        ingredient: "Eggs",
        baseAmount: 1,
        baseUnit: "egg",
        icon: "🥚",
        category: "Eggs",
        substitutes: [
            {
                substitute: "Flax Egg",
                ratio: "{1} tbsp ground flaxseed + {3} tbsp water",
                explanation: "Ground flaxseed absorbs water to create a mucilaginous gel that mimics the binding properties of an egg.",
                notes: "Let sit 5 minutes (vegan)",
                impact: "Taste: Adds a slightly earthy, nutty flavor. Best for hearty muffins and breads.",
                matchQuality: "vegan"
            },
            {
                substitute: "Chia Egg",
                ratio: "{1} tbsp chia seeds + {3} tbsp water",
                explanation: "Similar to flax, chia seeds swell in water creating a thick gel that provides structure and moisture.",
                notes: "Let sit 5 minutes (vegan)",
                impact: "Texture: Can add a slight crunch unless ground. Excellent binding power.",
                matchQuality: "vegan"
            },
            {
                substitute: "Applesauce",
                ratio: "{0.25} cup unsweetened applesauce",
                explanation: "The pectin in applesauce acts as a binder while adding significant moisture to the batter.",
                notes: "Best for sweet baking",
                impact: "Texture: Makes baked goods very dense and moist. May require slightly longer baking time.",
                matchQuality: "standard"
            },
            {
                substitute: "Banana",
                ratio: "{0.25} cup mashed banana",
                explanation: "Mashed fruit provides structure and retains moisture during baking.",
                notes: "Use ripe bananas",
                impact: "Taste: Will impart a noticeable banana flavor. Perfect for pancakes or quick breads.",
                matchQuality: "emergency"
            }
        ]
    },
    {
        ingredient: "All-Purpose Flour",
        baseAmount: 1,
        baseUnit: "cup",
        icon: "🌾",
        category: "Flour",
        substitutes: [
            {
                substitute: "Bread Flour",
                ratio: "{1} cup bread flour",
                explanation: "Bread flour has a higher protein content, which forms more gluten when mixed with liquid.",
                notes: "Higher protein content (12-14%)",
                impact: "Texture: Results in a chewier, denser final product. Great for cookies, bad for delicate cakes.",
                matchQuality: "standard"
            },
            {
                substitute: "Cake Flour",
                ratio: "{1} cup + {2} tbsp cake flour",
                explanation: "Cake flour is milled finer and has lower protein, reducing gluten formation.",
                notes: "Lower protein content (7-9%)",
                impact: "Texture: Creates a very tight, extremely tender crumb. Cakes will be lighter and fluffier.",
                matchQuality: "standard"
            },
            {
                substitute: "Whole Wheat Flour",
                ratio: "{0.875} cup whole wheat flour",
                explanation: "Includes the bran and germ of the wheat, which cuts through gluten strands and absorbs extra moisture.",
                impact: "Taste/Texture: Adds a robust, nutty flavor. Absorbs more liquid, so goods may be drier and heavier.",
                matchQuality: "emergency"
            }
        ]
    },
    {
        ingredient: "Brown Sugar",
        baseAmount: 1,
        baseUnit: "cup",
        icon: "🍯",
        category: "Sweeteners",
        substitutes: [
            {
                substitute: "White Sugar + Molasses",
                ratio: "{1} cup white sugar + {1} tbsp molasses",
                explanation: "Commercial brown sugar is simply refined white sugar with molasses blended back into it.",
                impact: "Taste: Nearly identical to store-bought brown sugar. Retains the essential caramel notes and moisture.",
                matchQuality: "best"
            },
            {
                substitute: "White Sugar",
                ratio: "{1} cup white sugar",
                explanation: "Provides the necessary sweetness and structure, but lacks the moisture and acidity of molasses.",
                notes: "Emergency substitute only",
                impact: "Texture: Baked goods will be significantly crispier and spread more. Lacks the acidic tang needed for baking soda.",
                matchQuality: "emergency"
            },
            {
                substitute: "Coconut Sugar",
                ratio: "{1} cup coconut sugar",
                explanation: "An unrefined sugar that naturally possesses a similar caramel/toffee flavor profile.",
                impact: "Taste: Similar caramel flavor profile but less sweet. Texture will be slightly drier and darker.",
                matchQuality: "standard"
            }
        ]
    },
    {
        ingredient: "Butter",
        baseAmount: 1,
        baseUnit: "stick (1/2 cup)",
        icon: "🧈",
        category: "Fats",
        substitutes: [
            {
                substitute: "Coconut Oil",
                ratio: "{0.5} cup coconut oil (solid)",
                explanation: "Like butter, coconut oil is a saturated fat that is solid at room temperature, providing similar structure in baking.",
                notes: "Use refined for neutral flavor",
                impact: "Texture: Behaves very similarly in baking. Unrefined will add a noticeable coconut aroma.",
                matchQuality: "vegan"
            },
            {
                substitute: "Vegetable Oil",
                ratio: "{6} tbsp vegetable oil",
                explanation: "A 100% fat liquid. Butter is only 80% fat (and 20% water), so less volume is needed.",
                notes: "Only for recipes calling for melted butter",
                impact: "Texture: Creates incredibly moist cakes that stay soft longer, but lacks the rich flavor of dairy.",
                matchQuality: "standard"
            },
            {
                substitute: "Applesauce",
                ratio: "{0.25} cup applesauce + {0.25} cup fat",
                explanation: "Pectin in applesauce binds the flour while significantly reducing the total calories from fat.",
                notes: "Don't substitute all the fat",
                impact: "Texture: Makes goods very soft and cakey. You will lose the crispy edges on cookies.",
                matchQuality: "emergency"
            }
        ]
    },
    {
        ingredient: "Heavy Cream",
        baseAmount: 1,
        baseUnit: "cup",
        icon: "🥛",
        category: "Dairy",
        substitutes: [
            {
                substitute: "Milk + Butter",
                ratio: "{0.75} cup whole milk + {0.25} cup melted butter",
                explanation: "Recreates the high fat content (approx 36%) of heavy cream using standard dairy products.",
                impact: "Best For: Cooking and baking. Warning: This mixture will NOT whip into whipped cream.",
                matchQuality: "best"
            },
            {
                substitute: "Coconut Cream",
                ratio: "{1} cup coconut cream (from the top of a chilled can)",
                explanation: "A high-fat, plant-based emulsion that behaves similarly to heavy dairy cream under heat and whipping.",
                notes: "Vegan option",
                impact: "Taste/Texture: Can be whipped! Adds a slight coconut flavor, perfect for curries or tropical desserts.",
                matchQuality: "vegan"
            },
            {
                substitute: "Evaporated Milk",
                ratio: "{1} cup evaporated milk",
                explanation: "Milk that has had 60% of its water removed, resulting in a thicker, creamier liquid without the extra fat.",
                impact: "Taste: Has a slightly caramelized, cooked flavor. Great for soups and sauces.",
                matchQuality: "emergency"
            }
        ]
    },
    {
        ingredient: "Baking Powder",
        baseAmount: 1,
        baseUnit: "tsp",
        icon: "🧂",
        category: "Leavening",
        substitutes: [
            {
                substitute: "Baking Soda + Acid",
                ratio: "{0.25} tsp baking soda + {0.5} tsp cream of tartar",
                explanation: "Baking powder is simply baking soda pre-mixed with a dry acid (cream of tartar).",
                impact: "Chemistry: Creates an immediate reaction. You must bake the batter right away before it deflates.",
                matchQuality: "best"
            },
            {
                substitute: "Baking Soda + Yogurt",
                ratio: "{0.25} tsp baking soda + {0.5} cup yogurt (reduce other liquids)",
                explanation: "The lactic acid in yogurt activates the alkaline baking soda to create CO2 bubbles for lift.",
                impact: "Texture: The lactic acid provides a great rise while adding tenderness to the crumb.",
                matchQuality: "emergency"
            }
        ]
    },
    {
        ingredient: "Sour Cream",
        baseAmount: 1,
        baseUnit: "cup",
        icon: "🥛",
        category: "Dairy",
        substitutes: [
            {
                substitute: "Greek Yogurt",
                ratio: "{1} cup whole milk Greek yogurt",
                explanation: "Cultured similarly to sour cream, possessing an almost identical pH level and viscosity.",
                impact: "Taste: Nearly indistinguishable in baking. Lower in fat, but provides the exact same tang and moisture.",
                matchQuality: "best"
            },
            {
                substitute: "Cottage Cheese",
                ratio: "{1} cup cottage cheese (blended) + {1} tbsp lemon juice",
                explanation: "Creates a similar high-protein, tangy dairy emulsion when blended smooth with acid.",
                impact: "Texture: Works well in dips and sauces, but lacks the fat content needed for rich baked goods.",
                matchQuality: "emergency"
            },
            {
                substitute: "Cream Cheese",
                ratio: "{0.75} cup cream cheese thinned with {0.25} cup milk",
                explanation: "A higher fat cultured dairy product that can be thinned out to match sour cream's consistency.",
                impact: "Taste: Much richer and heavier. Will create a denser, more decadent final product.",
                matchQuality: "standard"
            }
        ]
    },
    {
        ingredient: "Vanilla Extract",
        baseAmount: 1,
        baseUnit: "tsp",
        icon: "🌱",
        category: "Flavorings",
        substitutes: [
            {
                substitute: "Maple Syrup",
                ratio: "{1} tsp maple syrup",
                explanation: "Provides robust sweetness and complex flavor notes that mimic the depth of vanilla.",
                impact: "Taste: Adds a subtle maple note, which complements most baked goods beautifully.",
                matchQuality: "best"
            },
            {
                substitute: "Almond Extract",
                ratio: "{0.5} tsp almond extract",
                explanation: "A much stronger, highly concentrated extract. You only need half the amount.",
                impact: "Taste: Very strong cherry/nutty flavor. Will significantly change the flavor profile of the dish.",
                matchQuality: "emergency"
            },
            {
                substitute: "Bourbon or Rum",
                ratio: "{1} tsp bourbon or dark rum",
                explanation: "Vanilla extract is alcohol-based; using a dark, aged spirit provides similar caramel and oak notes.",
                impact: "Taste: Works surprisingly well in rich desserts like pecan pie or chocolate cake.",
                matchQuality: "standard"
            }
        ]
    },
    {
        ingredient: "Cornstarch",
        baseAmount: 1,
        baseUnit: "tbsp",
        icon: "🌽",
        category: "Misc",
        substitutes: [
            {
                substitute: "Arrowroot Powder",
                ratio: "{1} tbsp arrowroot powder",
                explanation: "Another pure starch extracted from a tuber; it hydrates and thickens almost identically to cornstarch.",
                impact: "Texture: Creates a glossy, clear gel. Perfect for fruit pies and stir-fry sauces.",
                matchQuality: "best"
            },
            {
                substitute: "All-Purpose Flour",
                ratio: "{2} tbsp all-purpose flour",
                explanation: "Flour has much less thickening power per tablespoon than pure starches, so you need double the amount.",
                notes: "Must cook for 2+ minutes to remove raw flour taste",
                impact: "Texture: Creates an opaque, matte sauce (like gravy) rather than a glossy/clear gel.",
                matchQuality: "standard"
            },
            {
                substitute: "Tapioca Starch",
                ratio: "{2} tbsp tapioca starch",
                explanation: "A starch from the cassava root, great for baking but less potent than cornstarch by volume.",
                impact: "Texture: Gives a very shiny and slightly chewy texture. Excellent for fruit fillings.",
                matchQuality: "standard"
            }
        ]
    },
    {
        ingredient: "Lemon Juice",
        baseAmount: 1,
        baseUnit: "tbsp",
        icon: "🍋",
        category: "Flavorings",
        substitutes: [
            {
                substitute: "Lime Juice",
                ratio: "{1} tbsp lime juice",
                explanation: "An almost identical pH level and similar bright, fresh citrus profile.",
                impact: "Taste: A one-to-one flavor swap that works cleanly in almost any recipe.",
                matchQuality: "best"
            },
            {
                substitute: "White Wine Vinegar",
                ratio: "{0.5} tbsp white wine vinegar",
                explanation: "Vinegar provides the necessary sharp acidity, but is much more pungent than citrus juice.",
                notes: "Best for savory recipes",
                impact: "Taste: Adds sharpness to savory dishes or dressings, but will ruin sweet baked goods.",
                matchQuality: "emergency"
            },
            {
                substitute: "White Wine",
                ratio: "{1} tbsp dry white wine",
                explanation: "Provides a complex acidity without being overly harsh.",
                notes: "Best for pan sauces or marinades",
                impact: "Taste: Great for savory cooking, adding depth and a mild tang.",
                matchQuality: "standard"
            }
        ]
    },
    {
        ingredient: "Cocoa Powder",
        baseAmount: 0.25,
        baseUnit: "cup",
        icon: "🍫",
        category: "Misc",
        substitutes: [
            {
                substitute: "Unsweetened Baking Chocolate",
                ratio: "{1} oz baking chocolate (reduce fat in recipe by {1} tbsp)",
                explanation: "Baking chocolate is simply cocoa powder with cocoa butter still attached. You must reduce the recipe's added fat.",
                notes: "Melt before adding",
                impact: "Taste/Texture: Very rich chocolate flavor. Can make baked goods slightly denser.",
                matchQuality: "best"
            },
            {
                substitute: "Carob Powder",
                ratio: "{0.25} cup carob powder",
                explanation: "A caffeine-free pod powder that shares visual and some flavor similarities with cocoa.",
                impact: "Taste: Naturally sweeter and less bitter than cocoa, so you may want to slightly reduce sugar elsewhere.",
                matchQuality: "vegan"
            }
        ]
    }
];

export const categories = ["All", "Dairy", "Eggs", "Flour", "Sweeteners", "Fats", "Leavening", "Flavorings", "Misc"];
