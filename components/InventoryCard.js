"use client";

import Image from "next/image";
import {
  Box,
  Card,
  CardActions,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  DeleteOutline as DeleteIcon,
  EditOutlined as EditIcon,
  Remove as RemoveIcon,
} from "@mui/icons-material";
import { formatUpdatedAt } from "@/lib/inventory";

export default function InventoryCard({
  item,
  onIncrement,
  onDecrement,
  onEdit,
  onDelete,
}) {
  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
        backgroundColor: "rgba(255,250,242,0.9)",
      }}
    >
      <CardContent>
        <Stack spacing={2.25}>
          <Box
            sx={{
              borderRadius: 3,
              overflow: "hidden",
              background:
                "linear-gradient(180deg, rgba(55,86,71,0.14), rgba(199,106,74,0.12))",
              aspectRatio: "4 / 3",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.name}
                width={600}
                height={400}
                unoptimized
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <Stack spacing={0.5} alignItems="center" sx={{ padding: 2 }}>
                <Typography variant="overline" color="text.secondary">
                  No image
                </Typography>
                <Typography color="text.secondary" textAlign="center">
                  Add a photo to identify it faster
                </Typography>
              </Stack>
            )}
            <Box sx={{ position: "absolute", inset: "auto 12px 12px auto" }}>
              <Chip
                label={item.category}
                sx={{
                  backgroundColor: "rgba(255,250,242,0.9)",
                  backdropFilter: "blur(8px)",
                }}
              />
            </Box>
          </Box>

          <Stack spacing={1}>
            <Typography variant="h5">{item.name}</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                size="small"
                label={`Key: ${item.normalizedName}`}
                variant="outlined"
              />
              <Chip
                size="small"
                label={`Updated ${formatUpdatedAt(item.updatedAt)}`}
                variant="outlined"
              />
            </Stack>
          </Stack>

          <Box
            sx={{
              padding: 2.25,
              borderRadius: 3,
              background:
                "linear-gradient(135deg, rgba(49,92,74,0.1), rgba(255,250,242,0.85))",
              border: "1px solid rgba(49, 92, 74, 0.1)",
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-end"
              spacing={2}
            >
              <Box>
                <Typography variant="overline" color="text.secondary">
                  Quantity on hand
                </Typography>
                <Typography variant="h3">{item.quantity}</Typography>
              </Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: 120, textAlign: "right" }}
              >
                Adjust stock, edit details, or remove it here
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </CardContent>

      <CardActions
        sx={{
          justifyContent: "space-between",
          paddingX: 2,
          paddingBottom: 2.5,
          paddingTop: 0,
        }}
      >
        <Stack direction="row" spacing={1}>
          <Tooltip title="Decrease by one">
            <span>
              <IconButton
                color="primary"
                onClick={() => onDecrement(item)}
                disabled={item.quantity <= 0}
                sx={{ backgroundColor: "rgba(49, 92, 74, 0.08)" }}
              >
                <RemoveIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Increase by one">
            <IconButton
              color="primary"
              onClick={() => onIncrement(item)}
              sx={{ backgroundColor: "rgba(49, 92, 74, 0.08)" }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Tooltip title="Edit product">
            <IconButton
              color="primary"
              onClick={() => onEdit(item)}
              sx={{ backgroundColor: "rgba(49, 92, 74, 0.08)" }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete product">
            <IconButton
              color="secondary"
              onClick={() => onDelete(item)}
              sx={{ backgroundColor: "rgba(199, 106, 74, 0.1)" }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </CardActions>
    </Card>
  );
}
