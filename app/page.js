"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  ThemeProvider,
  Typography,
} from "@mui/material";
import AddItemModal from "@/components/AddItemModal";
import InventoryGrid from "@/components/InventoryGrid";
import InventoryHeader from "@/components/InventoryHeader";
import { useInventory } from "@/hooks/useInventory";
import { useRecipeSuggestions } from "@/hooks/useRecipeSuggestions";
import {
  filterAndSortInventory,
  formatMovementDate,
  getMovementActionLabel,
} from "@/lib/inventory";
import { appTheme } from "@/lib/theme";

export default function Home() {
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const inventoryState = useInventory();
  const recipeState = useRecipeSuggestions();

  const filteredInventory = filterAndSortInventory({
    inventory: inventoryState.inventory,
    searchText,
    categoryFilter,
    sortBy,
  });

  const searchFeedback = searchText
    ? `${filteredInventory.length} result(s) for "${searchText}".`
    : `${filteredInventory.length} product(s) in view.`;

  const totalUnits = inventoryState.inventory.reduce(
    (total, item) => total + item.quantity,
    0
  );
  const totalCategories = new Set(
    inventoryState.inventory.map((item) => item.category)
  ).size;
  const lowStockCount = inventoryState.inventory.filter(
    (item) => item.quantity > 0 && item.quantity <= 2
  ).length;
  const movementCounts = inventoryState.movementHistory.reduce((accumulator, movement) => {
    accumulator[movement.normalizedName] =
      (accumulator[movement.normalizedName] || 0) + 1;
    return accumulator;
  }, {});
  const topUsedItem =
    inventoryState.inventory
      .slice()
      .sort(
        (left, right) =>
          (movementCounts[right.normalizedName] || 0) -
          (movementCounts[left.normalizedName] || 0)
      )[0] || null;

  const alerts = [
    ...inventoryState.inventory
      .filter((item) => item.quantity > 0 && item.quantity <= 2)
      .slice(0, 3)
      .map((item) => ({
        title: `${item.name} is running low`,
        description: `${item.quantity} unit(s) left. Consider restocking soon.`,
        tone: "warning",
      })),
    ...inventoryState.inventory
      .filter((item) => (movementCounts[item.normalizedName] || 0) >= 3)
      .slice(0, 2)
      .map((item) => ({
        title: `${item.name} moves quickly`,
        description: `${movementCounts[item.normalizedName]} recent movement(s) recorded.`,
        tone: "info",
      })),
  ].slice(0, 5);

  const summary = [
    {
      label: "Active products",
      value: inventoryState.inventory.length,
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

  return (
    <ThemeProvider theme={appTheme}>
      <Box
        width="100%"
        minHeight="100vh"
        display="flex"
        flexDirection="column"
        alignItems="center"
        padding={{ xs: 2, md: 4 }}
      >
        <Stack spacing={3} width="100%" maxWidth="1240px">
          <InventoryHeader
            searchText={searchText}
            onSearchChange={setSearchText}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            searchFeedback={searchFeedback}
            onOpenCreate={inventoryState.openCreateModal}
            onFetchRecipes={() =>
              recipeState.fetchRecipeSuggestions(
                inventoryState.inventory.map((item) => item.name)
              )
            }
            recipeLoading={recipeState.recipeLoading}
            hasInventory={inventoryState.inventory.length > 0}
            summary={summary}
          />

          {inventoryState.inventoryStatus && (
            <Alert severity="success">{inventoryState.inventoryStatus}</Alert>
          )}
          {inventoryState.inventoryError && (
            <Alert severity="error">{inventoryState.inventoryError}</Alert>
          )}

          <Grid container spacing={{ xs: 2, md: 2.5 }} alignItems="start">
            <Grid item xs={12} lg={8.5}>
              <InventoryGrid
                inventory={inventoryState.inventory}
                filteredInventory={filteredInventory}
                inventoryLoading={inventoryState.inventoryLoading}
                onIncrement={(item) => inventoryState.changeItemQuantity(item, 1)}
                onDecrement={(item) => inventoryState.changeItemQuantity(item, -1)}
                onEdit={inventoryState.openEditModal}
                onDelete={inventoryState.deleteItem}
              />
            </Grid>
            <Grid item xs={12} lg={3.5}>
              <Card
                variant="outlined"
                sx={{
                  position: { lg: "sticky" },
                  top: { lg: 24 },
                  backgroundColor: "rgba(255, 250, 242, 0.84)",
                  backdropFilter: "blur(14px)",
                }}
              >
                <CardContent>
                  <Stack spacing={2.25}>
                    <Box>
                      <Chip
                        label="Recipe panel"
                        color="secondary"
                        variant="outlined"
                        sx={{ marginBottom: 1.5 }}
                      />
                      <Typography variant="h2">Ideas from what you already have</Typography>
                      <Typography color="text.secondary" sx={{ marginTop: 1 }}>
                        Turn your inventory into useful decisions. Generate suggestions and
                        keep them close while you review stock.
                      </Typography>
                    </Box>
                    {recipeState.recipeError && (
                      <Alert severity="error">{recipeState.recipeError}</Alert>
                    )}
                    {recipeState.recipeLoading ? (
                      <Stack
                        spacing={1.5}
                        alignItems="flex-start"
                        sx={{
                          padding: 2.5,
                          borderRadius: 3,
                          backgroundColor: "rgba(49, 92, 74, 0.06)",
                        }}
                      >
                        <CircularProgress size={24} />
                        <Typography color="text.secondary">
                          Generating recipe ideas...
                        </Typography>
                      </Stack>
                    ) : recipeState.recipeSuggestions.length > 0 ? (
                      <Stack spacing={1.5}>
                        {recipeState.recipeSuggestions.map((recipe, index) => (
                          <Card
                            key={`${recipe.title}-${index}`}
                            variant="outlined"
                            sx={{
                              background:
                                "linear-gradient(180deg, rgba(255,255,255,0.94), rgba(247,240,230,0.86))",
                            }}
                          >
                            <CardContent>
                              <Typography variant="overline" color="secondary.main">
                                Idea {index + 1}
                              </Typography>
                              <Typography variant="h6" sx={{ marginTop: 0.5 }}>
                                {recipe.title}
                              </Typography>
                              <Stack
                                direction="row"
                                spacing={1}
                                flexWrap="wrap"
                                useFlexGap
                                sx={{ marginTop: 1 }}
                              >
                                <Chip
                                  size="small"
                                  label={`Servings: ${recipe.servings || "2-3"}`}
                                  variant="outlined"
                                />
                                <Chip
                                  size="small"
                                  label={`Time: ${recipe.time || "25 min"}`}
                                  variant="outlined"
                                />
                              </Stack>
                              <Typography color="text.secondary" sx={{ marginTop: 1.25 }}>
                                {recipe.summary}
                              </Typography>
                              {Array.isArray(recipe.steps) && recipe.steps.length > 0 && (
                                <Stack spacing={0.75} sx={{ marginTop: 1.5 }}>
                                  {recipe.steps.slice(0, 4).map((step, stepIndex) => (
                                    <Typography key={`${recipe.title}-${stepIndex}`} variant="body2">
                                      {stepIndex + 1}. {step}
                                    </Typography>
                                  ))}
                                </Stack>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    ) : (
                      <Box
                        sx={{
                          padding: 2.5,
                          borderRadius: 3,
                          border: "1px dashed rgba(49, 92, 74, 0.18)",
                          backgroundColor: "rgba(255, 250, 242, 0.7)",
                        }}
                      >
                        <Typography variant="h6">
                          {inventoryState.inventory.length === 0
                            ? "There is not enough inventory yet"
                            : "Your recipe panel is ready"}
                        </Typography>
                        <Typography color="text.secondary" sx={{ marginTop: 1 }}>
                          {inventoryState.inventory.length === 0
                            ? "Add products to start receiving recommendations connected to your inventory."
                            : "Use the generate button above to create recipes from your current inventory."}
                        </Typography>
                      </Box>
                    )}

                    <Card
                      variant="outlined"
                      sx={{ backgroundColor: "rgba(255, 250, 242, 0.76)" }}
                    >
                      <CardContent>
                        <Stack spacing={1.5}>
                          <Box>
                            <Chip
                              label="Alerts"
                              color="primary"
                              variant="outlined"
                              sx={{ marginBottom: 1.25 }}
                            />
                            <Typography variant="h6">
                              Key inventory signals
                            </Typography>
                          </Box>
                          {alerts.length > 0 ? (
                            <Stack spacing={1.25}>
                              {alerts.map((alert) => (
                                <Alert
                                  key={alert.title}
                                  severity={alert.tone === "warning" ? "warning" : "info"}
                                >
                                  <strong>{alert.title}</strong>
                                  <br />
                                  {alert.description}
                                </Alert>
                              ))}
                            </Stack>
                          ) : (
                            <Typography color="text.secondary">
                              No highlighted alerts yet. Your inventory looks stable.
                            </Typography>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>

                    <Card
                      variant="outlined"
                      sx={{ backgroundColor: "rgba(255, 250, 242, 0.76)" }}
                    >
                      <CardContent>
                        <Stack spacing={1.5}>
                          <Box>
                            <Chip
                              label="History"
                              color="primary"
                              variant="outlined"
                              sx={{ marginBottom: 1.25 }}
                            />
                            <Typography variant="h6">Recent activity</Typography>
                          </Box>
                          {inventoryState.movementLoading ? (
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <CircularProgress size={18} />
                              <Typography color="text.secondary">
                                Loading history...
                              </Typography>
                            </Stack>
                          ) : inventoryState.movementHistory.length > 0 ? (
                            <Stack spacing={1.25}>
                              {inventoryState.movementHistory.slice(0, 6).map((movement) => (
                                <Box
                                  key={movement.id}
                                  sx={{
                                    padding: 1.5,
                                    borderRadius: 3,
                                    backgroundColor: "rgba(49, 92, 74, 0.05)",
                                  }}
                                >
                                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                    {movement.itemName}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {getMovementActionLabel(movement.action)} ·{" "}
                                    {formatMovementDate(movement.createdAt)}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {movement.note}
                                  </Typography>
                                </Box>
                              ))}
                            </Stack>
                          ) : (
                            <Typography color="text.secondary">
                              No movements have been recorded yet.
                            </Typography>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Stack>

        <AddItemModal
          open={inventoryState.isModalOpen}
          editingItem={inventoryState.editingItem}
          formState={inventoryState.formState}
          webcamRef={inventoryState.webcamRef}
          onClose={inventoryState.closeModal}
          onFormValueChange={inventoryState.setFormValue}
          onImageChange={inventoryState.handleImageChange}
          onCapture={inventoryState.handleCapture}
          onAutoDetect={inventoryState.handleAutoDetect}
          onApplyDetectionSuggestion={inventoryState.applyDetectionSuggestion}
          onSubmit={inventoryState.handleSubmit}
        />
      </Box>
    </ThemeProvider>
  );
}
