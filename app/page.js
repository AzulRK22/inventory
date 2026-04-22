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
        title: `${item.name} con stock bajo`,
        description: `Quedan ${item.quantity} unidad(es). Conviene reabastecer pronto.`,
        tone: "warning",
      })),
    ...inventoryState.inventory
      .filter((item) => (movementCounts[item.normalizedName] || 0) >= 3)
      .slice(0, 2)
      .map((item) => ({
        title: `${item.name} se mueve seguido`,
        description: `Registró ${movementCounts[item.normalizedName]} movimientos recientes.`,
        tone: "info",
      })),
  ].slice(0, 5);

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
    {
      label: "Mas usado",
      value: topUsedItem?.name || "Sin dato",
      helper: topUsedItem
        ? `${movementCounts[topUsedItem.normalizedName] || 0} movimientos registrados.`
        : "Aun no hay historial suficiente.",
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
                                  label={`Porciones: ${recipe.servings || "2-3"}`}
                                  variant="outlined"
                                />
                                <Chip
                                  size="small"
                                  label={`Tiempo: ${recipe.time || "25 min"}`}
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

                    <Card
                      variant="outlined"
                      sx={{ backgroundColor: "rgba(255, 250, 242, 0.76)" }}
                    >
                      <CardContent>
                        <Stack spacing={1.5}>
                          <Box>
                            <Chip
                              label="Alertas"
                              color="primary"
                              variant="outlined"
                              sx={{ marginBottom: 1.25 }}
                            />
                            <Typography variant="h6">
                              Señales importantes del inventario
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
                              Aun no hay alertas destacadas. Tu inventario se ve estable.
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
                              label="Historial"
                              color="primary"
                              variant="outlined"
                              sx={{ marginBottom: 1.25 }}
                            />
                            <Typography variant="h6">Movimientos recientes</Typography>
                          </Box>
                          {inventoryState.movementLoading ? (
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <CircularProgress size={18} />
                              <Typography color="text.secondary">
                                Cargando historial...
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
                              Todavia no hay movimientos registrados.
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
