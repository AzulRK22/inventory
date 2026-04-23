"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
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
  summary,
}) {
  return (
    <Stack spacing={2.5}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2.5}
        sx={{
          padding: { xs: 3, md: 4 },
          borderRadius: 6,
          background:
            "linear-gradient(135deg, rgba(35, 62, 51, 0.95), rgba(75, 110, 95, 0.88))",
          color: "primary.contrastText",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            right: { xs: -40, md: 30 },
            top: { xs: -50, md: -70 },
            width: { xs: 180, md: 240 },
            height: { xs: 180, md: 240 },
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
          }}
        />
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Chip
            label="Inventario inteligente"
            sx={{
              marginBottom: 2,
              color: "primary.contrastText",
              backgroundColor: "rgba(255,255,255,0.12)",
            }}
          />
          <Typography variant="h1" component="h1" sx={{ maxWidth: 560 }}>
            BlueShelf AI
          </Typography>
          <Typography
            variant="body1"
            sx={{
              marginTop: 2,
              maxWidth: 540,
              color: "rgba(248, 244, 234, 0.84)",
            }}
          >
            Gestiona tu inventario como un producto real: existencias claras,
            categorias ordenadas, vision asistida, recetas contextualizadas y
            acciones rapidas desde cualquier pantalla.
          </Typography>
        </Box>
        <Stack
          spacing={1.5}
          sx={{ width: { xs: "100%", md: "auto" }, position: "relative", zIndex: 1 }}
        >
          <Button
            variant="contained"
            color="secondary"
            onClick={onOpenCreate}
            sx={{ minWidth: { xs: "100%", md: 220 } }}
          >
            Registrar producto
          </Button>
          <Tooltip title="Generar sugerencias de recetas">
            <span>
              <Button
                variant="outlined"
                onClick={onFetchRecipes}
                disabled={recipeLoading || !hasInventory}
                sx={{
                  width: { xs: "100%", md: 220 },
                  borderColor: "rgba(248, 244, 234, 0.28)",
                  color: "primary.contrastText",
                }}
              >
                {recipeLoading ? (
                  <CircularProgress size={18} sx={{ color: "inherit" }} />
                ) : (
                  <LightbulbIcon sx={{ marginRight: 1 }} />
                )}
                Inspirar recetas
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        sx={{ marginTop: { xs: -1, md: -2 } }}
      >
        {summary.map((item) => (
          <Card
            key={item.label}
            variant="outlined"
            sx={{
              flex: 1,
              backgroundColor: "rgba(255, 250, 242, 0.88)",
              backdropFilter: "blur(14px)",
            }}
          >
            <CardContent sx={{ padding: 2.5 }}>
              <Typography variant="overline" color="text.secondary">
                {item.label}
              </Typography>
              <Typography variant="h4" sx={{ marginTop: 0.5, fontWeight: 700 }}>
                {item.value}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ marginTop: 0.5 }}>
                {item.helper}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Card
        variant="outlined"
        sx={{
          backgroundColor: "rgba(255, 250, 242, 0.84)",
          backdropFilter: "blur(14px)",
        }}
      >
        <CardContent>
          <Stack spacing={2.25}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              spacing={1}
            >
              <Box>
                <Typography variant="h6">Explorar inventario</Typography>
                <Typography variant="body2" color="text.secondary">
                  Busca, filtra y ordena productos para encontrar rapido lo que necesitas.
                </Typography>
              </Box>
              <Chip label={searchFeedback} color="secondary" variant="outlined" />
            </Stack>
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
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
