"use client";

import { Box, Card, CardContent, CircularProgress, Grid, Stack, Typography } from "@mui/material";
import InventoryCard from "@/components/InventoryCard";

export default function InventoryGrid({
  inventory,
  filteredInventory,
  inventoryLoading,
  onIncrement,
  onDecrement,
  onEdit,
  onDelete,
}) {
  if (inventoryLoading) {
    return (
      <Stack alignItems="center" spacing={2} paddingY={8}>
        <CircularProgress />
        <Typography color="text.secondary">Cargando inventario...</Typography>
      </Stack>
    );
  }

  if (filteredInventory.length === 0) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6">
            {inventory.length === 0
              ? "Tu inventario esta vacio."
              : "No encontramos productos con esos filtros."}
          </Typography>
          <Typography color="text.secondary" sx={{ marginTop: 1 }}>
            {inventory.length === 0
              ? "Agrega tu primer producto para empezar a gestionar existencias."
              : "Prueba con otra busqueda, categoria o criterio de orden."}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Grid container spacing={2}>
        {filteredInventory.map((item) => (
          <Grid item xs={12} sm={6} lg={4} key={item.normalizedName}>
            <InventoryCard
              item={item}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
