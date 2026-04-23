"use client";

import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { formatMovementDate, getMovementActionLabel } from "@/lib/inventory";

export default function InventoryInsightsPanel({
  recipeState,
  inventory,
  alerts,
  movementHistory,
  movementLoading,
}) {
  const recipePanelActive =
    recipeState.recipeLoading ||
    recipeState.recipeSuggestions.length > 0 ||
    Boolean(recipeState.recipeError);

  return (
    <Card
      variant="outlined"
      sx={{
        position: { lg: "sticky" },
        top: { lg: 24 },
        background: recipePanelActive
          ? "linear-gradient(180deg, rgba(255, 250, 242, 0.92), rgba(248, 241, 231, 0.88))"
          : "linear-gradient(180deg, rgba(255, 252, 247, 0.74), rgba(249, 244, 236, 0.62))",
        borderColor: recipePanelActive
          ? "rgba(199, 106, 74, 0.18)"
          : "rgba(49, 92, 74, 0.08)",
        backdropFilter: "blur(14px)",
        boxShadow: recipePanelActive
          ? "0 18px 42px rgba(199, 106, 74, 0.08)"
          : "none",
      }}
    >
      <CardContent>
        <Stack spacing={2.25}>
          <Box>
            <Chip
              label="Recipe panel"
              color={recipePanelActive ? "secondary" : "default"}
              variant={recipePanelActive ? "outlined" : "filled"}
              sx={{ marginBottom: 1.5 }}
            />
            <Typography variant="h2">Ideas from what you already have</Typography>
            <Typography
              color="text.secondary"
              sx={{
                marginTop: 1,
                opacity: recipePanelActive ? 1 : 0.78,
              }}
            >
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
              <Typography color="text.secondary">Generating recipe ideas...</Typography>
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
                {inventory.length === 0
                  ? "There is not enough inventory yet"
                  : "Your recipe panel is ready"}
              </Typography>
              <Typography color="text.secondary" sx={{ marginTop: 1 }}>
                {inventory.length === 0
                  ? "Add products to start receiving recommendations connected to your inventory."
                  : "Use the generate button above to create recipes from your current inventory."}
              </Typography>
            </Box>
          )}

          <Card variant="outlined" sx={{ backgroundColor: "rgba(255, 250, 242, 0.76)" }}>
            <CardContent>
              <Stack spacing={1.5}>
                <Box>
                  <Chip
                    label="Alerts"
                    color="primary"
                    variant="outlined"
                    sx={{ marginBottom: 1.25 }}
                  />
                  <Typography variant="h6">Key inventory signals</Typography>
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

          <Card variant="outlined" sx={{ backgroundColor: "rgba(255, 250, 242, 0.76)" }}>
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
                {movementLoading ? (
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <CircularProgress size={18} />
                    <Typography color="text.secondary">Loading history...</Typography>
                  </Stack>
                ) : movementHistory.length > 0 ? (
                  <Stack spacing={1.25}>
                    {movementHistory.slice(0, 6).map((movement) => (
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
  );
}
