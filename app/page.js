"use client";

import { useState } from "react";
import {
  Box,
  Grid,
  ThemeProvider,
} from "@mui/material";
import AddItemModal from "@/components/AddItemModal";
import InventoryFeedback from "@/components/InventoryFeedback";
import InventoryGrid from "@/components/InventoryGrid";
import InventoryHeader from "@/components/InventoryHeader";
import InventoryInsightsPanel from "@/components/InventoryInsightsPanel";
import { useInventory } from "@/hooks/useInventory";
import { useRecipeSuggestions } from "@/hooks/useRecipeSuggestions";
import {
  buildInventoryAlerts,
  buildInventorySummary,
  buildMovementCounts,
  buildSearchFeedback,
  filterAndSortInventory,
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

  const searchFeedback = buildSearchFeedback(filteredInventory, searchText);
  const movementCounts = buildMovementCounts(inventoryState.movementHistory);
  const alerts = buildInventoryAlerts(inventoryState.inventory, movementCounts);
  const summary = buildInventorySummary(inventoryState.inventory, movementCounts);

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
        <Box width="100%" maxWidth="1240px">
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

          <Grid
            container
            spacing={{ xs: 2, md: 2.5 }}
            alignItems="start"
            sx={{ marginTop: { xs: 2.5, md: 3 } }}
          >
            <Grid item xs={12} lg={8}>
              <InventoryGrid
                inventory={inventoryState.inventory}
                filteredInventory={filteredInventory}
                inventoryLoading={inventoryState.inventoryLoading}
                itemMutationState={inventoryState.itemMutationState}
                onIncrement={(item) => inventoryState.changeItemQuantity(item, 1)}
                onDecrement={(item) => inventoryState.changeItemQuantity(item, -1)}
                onEdit={inventoryState.openEditModal}
                onDelete={inventoryState.requestDeleteItem}
              />
            </Grid>
            <Grid item xs={12} lg={4}>
              <InventoryInsightsPanel
                recipeState={recipeState}
                inventory={inventoryState.inventory}
                alerts={alerts}
                movementHistory={inventoryState.movementHistory}
                movementLoading={inventoryState.movementLoading}
              />
            </Grid>
          </Grid>
        </Box>

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
          onApplyDetectionName={inventoryState.applyDetectionName}
          onApplyDetectionCategory={inventoryState.applyDetectionCategory}
          onApplyDetectionSuggestion={inventoryState.applyDetectionSuggestion}
          onDismissDetectionSuggestion={inventoryState.dismissDetectionSuggestion}
          onSubmit={inventoryState.handleSubmit}
        />

        <InventoryFeedback
          pendingDeleteItem={inventoryState.pendingDeleteItem}
          onCancelDelete={inventoryState.cancelDeleteItem}
          onConfirmDelete={inventoryState.confirmDeleteItem}
          inventoryStatus={inventoryState.inventoryStatus}
          inventoryError={inventoryState.inventoryError}
        />
      </Box>
    </ThemeProvider>
  );
}
