"use client";

import {
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Box,
} from "@mui/material";
import { Lightbulb as LightbulbIcon } from "@mui/icons-material";
import { CATEGORY_OPTIONS, SORT_OPTIONS } from "@/lib/inventory";

export default function InventoryHeader({
  searchText,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  sortBy,
  onSortByChange,
  searchFeedback,
  onOpenCreate,
  onFetchRecipes,
  recipeLoading,
  hasInventory,
}) {
  return (
    <>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
      >
        <Box>
          <Typography variant="h3" component="h1">
            Azul&apos;s Shop
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona inventario con cantidades, categorias, imagenes y acciones claras.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Tooltip title="Generar sugerencias de recetas">
            <span>
              <IconButton
                color="primary"
                onClick={onFetchRecipes}
                disabled={recipeLoading || !hasInventory}
              >
                {recipeLoading ? <CircularProgress size={20} /> : <LightbulbIcon />}
              </IconButton>
            </span>
          </Tooltip>
          <Button variant="contained" onClick={onOpenCreate}>
            Nuevo producto
          </Button>
        </Stack>
      </Stack>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", md: "center" }}
            >
              <TextField
                label="Buscar en inventario"
                placeholder="Nombre, categoria o cantidad"
                value={searchText}
                onChange={(event) => onSearchChange(event.target.value)}
                sx={{ flex: 2 }}
              />
              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel id="category-filter-label">Categoria</InputLabel>
                <Select
                  labelId="category-filter-label"
                  value={categoryFilter}
                  label="Categoria"
                  onChange={(event) => onCategoryFilterChange(event.target.value)}
                >
                  <MenuItem value="all">Todas</MenuItem>
                  {CATEGORY_OPTIONS.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel id="sort-by-label">Ordenar</InputLabel>
                <Select
                  labelId="sort-by-label"
                  value={sortBy}
                  label="Ordenar"
                  onChange={(event) => onSortByChange(event.target.value)}
                >
                  {SORT_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Typography variant="body2" color="text.secondary">
              {searchFeedback}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </>
  );
}
