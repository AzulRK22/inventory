"use client";

import { useState } from "react";
import { Alert, Box, Card, CardContent, Stack, ThemeProvider, Typography, createTheme } from "@mui/material";
import AddItemModal from "@/components/AddItemModal";
import InventoryGrid from "@/components/InventoryGrid";
import InventoryHeader from "@/components/InventoryHeader";
import { useInventory } from "@/hooks/useInventory";
import { useRecipeSuggestions } from "@/hooks/useRecipeSuggestions";
import { filterAndSortInventory } from "@/lib/inventory";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
  typography: {
    fontFamily: "Roboto, sans-serif",
  },
});

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
    ? `${filteredInventory.length} resultado(s) para "${searchText}".`
    : `${filteredInventory.length} producto(s) en vista.`;

  return (
    <ThemeProvider theme={theme}>
      <Box
        width="100%"
        minHeight="100vh"
        display="flex"
        flexDirection="column"
        alignItems="center"
        padding={{ xs: 2, md: 4 }}
      >
        <Stack spacing={3} width="100%" maxWidth="1120px">
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
          />

          {inventoryState.inventoryStatus && (
            <Alert severity="success">{inventoryState.inventoryStatus}</Alert>
          )}
          {inventoryState.inventoryError && (
            <Alert severity="error">{inventoryState.inventoryError}</Alert>
          )}

          <InventoryGrid
            inventory={inventoryState.inventory}
            filteredInventory={filteredInventory}
            inventoryLoading={inventoryState.inventoryLoading}
            onIncrement={(item) => inventoryState.changeItemQuantity(item, 1)}
            onDecrement={(item) => inventoryState.changeItemQuantity(item, -1)}
            onEdit={inventoryState.openEditModal}
            onDelete={inventoryState.deleteItem}
          />

          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6">Recipe Suggestions</Typography>
                {recipeState.recipeError && (
                  <Alert severity="error">{recipeState.recipeError}</Alert>
                )}
                {recipeState.recipeLoading ? (
                  <Typography color="text.secondary">
                    Generando recetas...
                  </Typography>
                ) : recipeState.recipeSuggestions.length > 0 ? (
                  <Stack spacing={1.5}>
                    {recipeState.recipeSuggestions.map((recipe, index) => (
                      <Card key={`${recipe}-${index}`} variant="outlined">
                        <CardContent>
                          <Typography>{recipe}</Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                ) : (
                  <Typography color="text.secondary">
                    {inventoryState.inventory.length === 0
                      ? "Agrega productos al inventario para recibir recetas."
                      : "Todavia no has generado sugerencias de recetas."}
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
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
          onSubmit={inventoryState.handleSubmit}
        />
      </Box>
    </ThemeProvider>
  );
}
