export function buildSearchFeedback(filteredInventory, searchText) {
  return searchText
    ? `${filteredInventory.length} ${
        filteredInventory.length === 1 ? "result" : "results"
      } for "${searchText}"`
    : `${filteredInventory.length} ${
        filteredInventory.length === 1 ? "product" : "products"
      } in view`;
}

export function buildMovementCounts(movementHistory) {
  return movementHistory.reduce((accumulator, movement) => {
    accumulator[movement.normalizedName] =
      (accumulator[movement.normalizedName] || 0) + 1;
    return accumulator;
  }, {});
}

export function getTopUsedItem(inventory, movementCounts) {
  return (
    inventory
      .slice()
      .sort(
        (left, right) =>
          (movementCounts[right.normalizedName] || 0) -
          (movementCounts[left.normalizedName] || 0)
      )[0] || null
  );
}

export function buildInventoryAlerts(inventory, movementCounts) {
  return [
    ...inventory
      .filter((item) => item.quantity > 0 && item.quantity <= 2)
      .slice(0, 3)
      .map((item) => ({
        title: `${item.name} is running low`,
        description: `${item.quantity} unit(s) left. Consider restocking soon.`,
        tone: "warning",
      })),
    ...inventory
      .filter((item) => (movementCounts[item.normalizedName] || 0) >= 3)
      .slice(0, 2)
      .map((item) => ({
        title: `${item.name} moves quickly`,
        description: `${movementCounts[item.normalizedName]} recent movement(s) recorded.`,
        tone: "info",
      })),
  ].slice(0, 5);
}

export function buildInventorySummary(inventory, movementCounts) {
  const totalUnits = inventory.reduce((total, item) => total + item.quantity, 0);
  const totalCategories = new Set(inventory.map((item) => item.category)).size;
  const lowStockCount = inventory.filter(
    (item) => item.quantity > 0 && item.quantity <= 2
  ).length;
  const topUsedItem = getTopUsedItem(inventory, movementCounts);

  return [
    {
      label: "Active products",
      value: inventory.length,
      helper: "Visible records in your current catalog.",
    },
    {
      label: "Total units",
      value: totalUnits,
      helper: "Total available stock across the catalog.",
    },
    {
      label: "Categories",
      value: totalCategories,
      helper: "How broadly your inventory is organized.",
    },
    {
      label: "Low stock",
      value: lowStockCount,
      helper: "Products worth reviewing soon.",
    },
    {
      label: "Most active",
      value: topUsedItem?.name || "No data yet",
      helper: topUsedItem
        ? `${movementCounts[topUsedItem.normalizedName] || 0} movement(s) recorded.`
        : "There is not enough history yet.",
    },
  ];
}
