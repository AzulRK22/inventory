"use client";

import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
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
      <Card
        variant="outlined"
        sx={{ backgroundColor: "rgba(255, 250, 242, 0.82)", backdropFilter: "blur(14px)" }}
      >
        <CardContent>
          <Stack alignItems="center" spacing={2} paddingY={6}>
            <CircularProgress />
            <Typography color="text.secondary">Cargando inventario...</Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (filteredInventory.length === 0) {
    return (
      <Card
        variant="outlined"
        sx={{ backgroundColor: "rgba(255, 250, 242, 0.82)", backdropFilter: "blur(14px)" }}
      >
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
      <Grid container spacing={{ xs: 2, md: 2.5 }}>
        {filteredInventory.map((item) => (
          <Grid item xs={12} sm={6} xl={4} key={item.normalizedName}>
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
