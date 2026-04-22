import { toDisplayName } from "./model";

const CATEGORY_KEYWORDS = {
  Produce: [
    "apple",
    "banana",
    "tomato",
    "tomate",
    "lettuce",
    "spinach",
    "onion",
    "cebolla",
    "pepper",
    "carrot",
    "lime",
    "lemon",
    "fruit",
    "vegetable",
    "avocado",
    "cilantro",
    "potato",
    "papa",
  ],
  Dairy: ["milk", "cheese", "yogurt", "butter", "cream", "egg", "huevo"],
  Protein: [
    "chicken",
    "beef",
    "pork",
    "fish",
    "salmon",
    "tuna",
    "shrimp",
    "tofu",
    "turkey",
    "meat",
  ],
  Pantry: [
    "rice",
    "pasta",
    "bean",
    "beans",
    "oil",
    "flour",
    "sugar",
    "salt",
    "spice",
    "sauce",
    "cereal",
    "lentil",
    "garbanzo",
  ],
  Frozen: ["frozen", "ice cream", "helado"],
  Beverages: ["juice", "soda", "coffee", "tea", "water", "drink", "leche"],
  Snacks: ["cookie", "chips", "cracker", "chocolate", "bar", "snack"],
  Household: [
    "soap",
    "detergent",
    "cleaner",
    "paper",
    "napkin",
    "trash",
    "sponge",
  ],
};

const GENERIC_LABELS = new Set([
  "food",
  "ingredient",
  "produce",
  "natural foods",
  "local food",
  "plant",
  "dish",
  "recipe",
  "tableware",
  "superfood",
  "comfort food",
]);

export const suggestCategoryFromText = (value) => {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return "Other";
  }

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return category;
    }
  }

  return "Other";
};

export const createDetectionSuggestions = (labels = []) => {
  const cleaned = labels
    .map((label) => label?.trim())
    .filter(Boolean)
    .filter((label) => !GENERIC_LABELS.has(label.toLowerCase()))
    .map((label) => toDisplayName(label))
    .filter((label, index, array) => array.indexOf(label) === index);

  return cleaned.slice(0, 4);
};

export const getSuggestedDetection = (labels = []) => {
  const suggestions = createDetectionSuggestions(labels);
  const suggestedName = suggestions[0] || "";
  const suggestedCategory = suggestCategoryFromText(
    [suggestedName, ...suggestions].join(" ")
  );

  return {
    suggestedName,
    suggestedCategory,
    suggestions,
  };
};
