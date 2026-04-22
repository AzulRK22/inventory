"use client";

import Image from "next/image";
import {
  Box,
  Card,
  CardActions,
  CardContent,
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
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          <Box
            sx={{
              borderRadius: 2,
              overflow: "hidden",
              backgroundColor: "#f5f5f5",
              minHeight: 180,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
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
                  height: "auto",
                  objectFit: "cover",
                }}
              />
            ) : (
              <Typography color="text.secondary">Sin imagen</Typography>
            )}
          </Box>

          <Stack spacing={0.5}>
            <Typography variant="h5">{item.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              Categoria: {item.category}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Actualizado: {formatUpdatedAt(item.updatedAt)}
            </Typography>
          </Stack>

          <Box
            sx={{
              padding: 2,
              borderRadius: 2,
              backgroundColor: "#eef4ff",
            }}
          >
            <Typography variant="overline" color="text.secondary">
              Cantidad actual
            </Typography>
            <Typography variant="h3">{item.quantity}</Typography>
          </Box>
        </Stack>
      </CardContent>

      <CardActions
        sx={{
          justifyContent: "space-between",
          paddingX: 2,
          paddingBottom: 2,
        }}
      >
        <Stack direction="row" spacing={1}>
          <Tooltip title="Restar una unidad">
            <span>
              <IconButton
                color="primary"
                onClick={() => onDecrement(item)}
                disabled={item.quantity <= 0}
              >
                <RemoveIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Sumar una unidad">
            <IconButton color="primary" onClick={() => onIncrement(item)}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Tooltip title="Editar producto">
            <IconButton color="primary" onClick={() => onEdit(item)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar producto">
            <IconButton color="secondary" onClick={() => onDelete(item)}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </CardActions>
    </Card>
  );
}
