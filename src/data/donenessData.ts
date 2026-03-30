export interface DonenessTemp {
    protein: string;
    icon: string;
    category: string;
    temperatures: {
        level: string;
        fahrenheit: number;
        celsius: number;
        description: string;
        color: string;
        image?: string;
    }[];
    usda_minimum?: number;
}

export const donenessTemps: DonenessTemp[] = [
    {
        protein: "Beef Steaks & Roasts",
        icon: "🥩",
        category: "Beef",
        temperatures: [
            { level: "Rare", fahrenheit: 125, celsius: 52, description: "Cool red center", color: "#8b0000", image: "/images/doneness/rare.png" }, /* Dark Red */
            { level: "Medium Rare", fahrenheit: 135, celsius: 57, description: "Warm red center", color: "#c93a40", image: "/images/doneness/med_rare.png" }, /* Bright Red/Pink */
            { level: "Medium", fahrenheit: 145, celsius: 63, description: "Warm pink center", color: "#d67a7e", image: "/images/doneness/medium.png" }, /* Warm Pink */
            { level: "Medium Well", fahrenheit: 150, celsius: 66, description: "Slightly pink center", color: "#b8857d", image: "/images/doneness/med_well.png" }, /* Brownish Pink */
            { level: "Well Done", fahrenheit: 160, celsius: 71, description: "No pink", color: "#7a5c53", image: "/images/doneness/well_done.png" } /* Cooked Brown */
        ],
        usda_minimum: 145
    },
    {
        protein: "Ground Beef",
        icon: "🍔",
        category: "Beef",
        temperatures: [
            { level: "Safe Minimum", fahrenheit: 160, celsius: 71, description: "No longer pink", color: "#4caf50", image: "/images/doneness/ground_beef.png" }
        ],
        usda_minimum: 160
    },
    {
        protein: "Chicken (whole & pieces)",
        icon: "🍗",
        category: "Poultry",
        temperatures: [
            { level: "Safe Minimum", fahrenheit: 165, celsius: 74, description: "Juices run clear", color: "#4caf50", image: "/images/doneness/chicken.png" }
        ],
        usda_minimum: 165
    },
    {
        protein: "Turkey (whole)",
        icon: "🦃",
        category: "Poultry",
        temperatures: [
            { level: "Safe Minimum", fahrenheit: 165, celsius: 74, description: "Juices run clear", color: "#4caf50", image: "/images/doneness/turkey.png" }
        ],
        usda_minimum: 165
    },
    {
        protein: "Pork Chops & Roasts",
        icon: "🥓",
        category: "Pork",
        temperatures: [
            { level: "Medium", fahrenheit: 145, celsius: 63, description: "Slightly pink center", color: "#d67a7e", image: "/images/doneness/pork_medium.png" },
            { level: "Well Done", fahrenheit: 160, celsius: 71, description: "No pink", color: "#7a5c53", image: "/images/doneness/pork_well_done.png" }
        ],
        usda_minimum: 145
    },
    {
        protein: "Ground Pork",
        icon: "🌭",
        category: "Pork",
        temperatures: [
            { level: "Safe Minimum", fahrenheit: 160, celsius: 71, description: "No longer pink", color: "#4caf50", image: "/images/doneness/ground_pork.png" }
        ],
        usda_minimum: 160
    },
    {
        protein: "Lamb",
        icon: "🐑",
        category: "Lamb",
        temperatures: [
            { level: "Medium Rare", fahrenheit: 135, celsius: 57, description: "Warm red center", color: "#c93a40", image: "/images/doneness/lamb_med_rare.png" },
            { level: "Medium", fahrenheit: 145, celsius: 63, description: "Warm pink center", color: "#d67a7e", image: "/images/doneness/lamb_medium.png" },
            { level: "Well Done", fahrenheit: 160, celsius: 71, description: "No pink", color: "#7a5c53", image: "/images/doneness/lamb_well_done.png" }
        ],
        usda_minimum: 145
    },
    {
        protein: "Fish & Shellfish",
        icon: "🐟",
        category: "Seafood",
        temperatures: [
            { level: "Safe Minimum", fahrenheit: 145, celsius: 63, description: "Opaque and flakes easily", color: "#4caf50", image: "/images/doneness/fish.png" }
        ],
        usda_minimum: 145
    },
    {
        protein: "Ham (fresh)",
        icon: "🍖",
        category: "Pork",
        temperatures: [
            { level: "Safe Minimum", fahrenheit: 145, celsius: 63, description: "Rest 3 minutes", color: "#4caf50", image: "/images/doneness/ham_fresh.png" }
        ],
        usda_minimum: 145
    },
    {
        protein: "Ham (pre-cooked)",
        icon: "🍖",
        category: "Pork",
        temperatures: [
            { level: "Reheat", fahrenheit: 140, celsius: 60, description: "Heated through", color: "#4caf50", image: "/images/doneness/ham_precooked.png" }
        ]
    }
];

export const categories = ["All", "Beef", "Poultry", "Pork", "Lamb", "Seafood"];
