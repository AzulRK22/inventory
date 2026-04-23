/**
 * @typedef {Object} InventoryItem
 * @property {string} id
 * @property {string} name
 * @property {string} normalizedName
 * @property {number} quantity
 * @property {string} imageUrl
 * @property {string} category
 * @property {unknown} updatedAt
 */

/**
 * @typedef {Object} InventoryFormState
 * @property {string} itemName
 * @property {string} itemCategory
 * @property {File|null} itemImage
 * @property {string|null} imagePreview
 * @property {string} detectedName
 * @property {"upload"|"take"|"auto"} uploadOption
 * @property {boolean} capturing
 * @property {string} formError
 * @property {string} imageError
 * @property {string} imageStatus
 * @property {boolean} submitLoading
 * @property {boolean} detectLoading
 * @property {string[]} detectionSuggestions
 * @property {string} suggestedCategory
 */

/**
 * @typedef {Object} InventoryMovement
 * @property {string} id
 * @property {string} itemName
 * @property {string} normalizedName
 * @property {string} action
 * @property {number} quantityChange
 * @property {number|null} quantityAfter
 * @property {string} category
 * @property {unknown} createdAt
 * @property {string} note
 */

export const CATEGORY_OPTIONS = [
  "Produce",
  "Dairy",
  "Protein",
  "Pantry",
  "Frozen",
  "Beverages",
  "Snacks",
  "Household",
  "Other",
];

export const SORT_OPTIONS = [
  { value: "recent", label: "Most recent" },
  { value: "name", label: "Name A-Z" },
  { value: "quantity-desc", label: "Highest quantity" },
  { value: "quantity-asc", label: "Lowest quantity" },
  { value: "category", label: "Category" },
];

export const normalizeItemName = (value) =>
  value.trim().replace(/\s+/g, " ").toLowerCase();

export const toDisplayName = (value) =>
  value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

export const createEmptyFormState = () => ({
  itemName: "",
  itemCategory: "Other",
  itemImage: null,
  imagePreview: null,
  detectedName: "",
  uploadOption: "upload",
  capturing: false,
  formError: "",
  imageError: "",
  imageStatus: "",
  submitLoading: false,
  detectLoading: false,
  detectionSuggestions: [],
  suggestedCategory: "",
});

/**
 * @param {InventoryItem} item
 * @returns {InventoryFormState}
 */
export const createEditFormState = (item) => ({
  itemName: item.name,
  itemCategory: item.category || "Other",
  itemImage: null,
  imagePreview: item.imageUrl || null,
  detectedName: "",
  uploadOption: "upload",
  capturing: false,
  formError: "",
  imageError: "",
  imageStatus: item.imageUrl ? "Current image loaded." : "",
  submitLoading: false,
  detectLoading: false,
  detectionSuggestions: [],
  suggestedCategory: item.category || "",
});

export const validateImageFile = (file) => {
  if (!file) {
    return "";
  }

  if (!file.type?.startsWith("image/")) {
    return "Select a valid image file.";
  }

  if (file.size > 5 * 1024 * 1024) {
    return "The image must be 5 MB or smaller.";
  }

  return "";
};

export const getUpdatedAtValue = (value) => {
  if (!value) {
    return 0;
  }

  if (typeof value.toMillis === "function") {
    return value.toMillis();
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const formatUpdatedAt = (value) => {
  const timestamp = getUpdatedAtValue(value);

  if (!timestamp) {
    return "No date";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
};

export const buildItemPayload = ({
  itemName,
  normalizedName,
  category,
  quantity,
  imageUrl,
}) => ({
  id: normalizedName,
  name: toDisplayName(itemName),
  normalizedName,
  quantity,
  imageUrl: imageUrl || "",
  category: category || "Other",
  updatedAt: new Date().toISOString(),
});

export const mapInventoryDoc = (inventoryDoc) => {
  const data =
    typeof inventoryDoc?.data === "function" ? inventoryDoc.data() : inventoryDoc || {};
  const normalizedName =
    data.normalizedName || normalizeItemName(data.name || inventoryDoc.id || "");

  return {
    id: inventoryDoc.id || data.id || normalizedName,
    name: data.name || data.displayName || toDisplayName(inventoryDoc.id || ""),
    normalizedName,
    quantity: data.quantity ?? 0,
    imageUrl: data.imageUrl || data.imageURL || "",
    category: data.category || "Other",
    updatedAt: data.updatedAt || null,
  };
};

export const filterAndSortInventory = ({
  inventory,
  searchText,
  categoryFilter,
  sortBy,
}) =>
  inventory
    .filter((item) => {
      const searchableText = [
        item.name,
        item.normalizedName,
        item.category,
        String(item.quantity),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(searchText.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter;

      return matchesSearch && matchesCategory;
    })
    .sort((left, right) => {
      if (sortBy === "name") {
        return left.name.localeCompare(right.name);
      }

      if (sortBy === "quantity-desc") {
        return right.quantity - left.quantity;
      }

      if (sortBy === "quantity-asc") {
        return left.quantity - right.quantity;
      }

      if (sortBy === "category") {
        return (
          left.category.localeCompare(right.category) ||
          left.name.localeCompare(right.name)
        );
      }

      return getUpdatedAtValue(right.updatedAt) - getUpdatedAtValue(left.updatedAt);
    });

export const mapMovementDoc = (movementDoc) => {
  const data =
    typeof movementDoc?.data === "function" ? movementDoc.data() : movementDoc || {};

  return {
    id: movementDoc.id || data.id || "",
    itemName: data.itemName || "Product",
    normalizedName: data.normalizedName || "",
    action: data.action || "updated",
    quantityChange: data.quantityChange ?? 0,
    quantityAfter: data.quantityAfter ?? null,
    category: data.category || "Other",
    createdAt: data.createdAt || null,
    note: data.note || "",
  };
};

export const formatMovementDate = (value) => {
  const timestamp = getUpdatedAtValue(value);

  if (!timestamp) {
    return "No date";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
};

export const getMovementActionLabel = (action) => {
  switch (action) {
    case "created":
      return "Created";
    case "updated":
      return "Edited";
    case "incremented":
      return "Stock in";
    case "decremented":
      return "Stock out";
    case "deleted":
      return "Deleted";
    default:
      return "Movement";
  }
};
