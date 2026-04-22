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
import { filterAndSortInventory } from "@/lib/inventory";
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
    ? `${filteredInventory.length} resultado(s) para "${searchText}".`
    : `${filteredInventory.length} producto(s) en vista.`;

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

  const summary = [
    {
      label: "Productos activos",
      value: inventoryState.inventory.length,
      helper: "Registros visibles en tu catalogo actual.",
    },
    {
      label: "Unidades totales",
      value: totalUnits,
      helper: "Suma total de existencias disponibles.",
    },
    {
      label: "Categorias",
      value: totalCategories,
      helper: "Diversidad de tu inventario organizado.",
    },
    {
      label: "Stock bajo",
      value: lowStockCount,
      helper: "Productos que conviene revisar pronto.",
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
                        label="Panel de recetas"
                        color="secondary"
                        variant="outlined"
                        sx={{ marginBottom: 1.5 }}
                      />
                      <Typography variant="h2">Ideas con lo que ya tienes</Typography>
                      <Typography color="text.secondary" sx={{ marginTop: 1 }}>
                        Convierte tu inventario en decisiones utiles. Genera sugerencias y
                        mantenlas a la vista mientras revisas stock.
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
                          Generando ideas de recetas...
                        </Typography>
                      </Stack>
                    ) : recipeState.recipeSuggestions.length > 0 ? (
                      <Stack spacing={1.5}>
                        {recipeState.recipeSuggestions.map((recipe, index) => (
                          <Card
                            key={`${recipe}-${index}`}
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
                              <Typography sx={{ marginTop: 0.5 }}>{recipe}</Typography>
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
                            ? "Aun no hay base para sugerencias"
                            : "Tu panel de recetas esta listo"}
                        </Typography>
                        <Typography color="text.secondary" sx={{ marginTop: 1 }}>
                          {inventoryState.inventory.length === 0
                            ? "Agrega productos para empezar a recibir recomendaciones conectadas a tu inventario."
                            : "Usa el boton de inspiracion arriba para generar recetas con tu inventario actual."}
                        </Typography>
                      </Box>
                    )}
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
          onSubmit={inventoryState.handleSubmit}
        />
      </Box>
    </ThemeProvider>
  );
}
