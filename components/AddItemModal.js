"use client";

import Image from "next/image";
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Webcam from "react-webcam";
import { CATEGORY_OPTIONS } from "@/lib/inventory";

export default function AddItemModal({
  open,
  editingItem,
  formState,
  webcamRef,
  onClose,
  onFormValueChange,
  onImageChange,
  onCapture,
  onAutoDetect,
  onSubmit,
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "92%", sm: 520 },
          maxHeight: "90vh",
          overflowY: "auto",
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
        }}
      >
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h6" component="h2">
              {editingItem ? "Editar producto" : "Nuevo producto"}
            </Typography>
            <Typography color="text.secondary">
              Guarda nombre, categoria, imagen y mantén el inventario ordenado.
            </Typography>
          </Box>

          {formState.formError && <Alert severity="error">{formState.formError}</Alert>}
          {formState.imageError && <Alert severity="warning">{formState.imageError}</Alert>}
          {formState.imageStatus && <Alert severity="info">{formState.imageStatus}</Alert>}

          <TextField
            label="Nombre del producto"
            value={formState.itemName}
            onChange={(event) => onFormValueChange("itemName", event.target.value)}
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel id="item-category-label">Categoria</InputLabel>
            <Select
              labelId="item-category-label"
              label="Categoria"
              value={formState.itemCategory}
              onChange={(event) => onFormValueChange("itemCategory", event.target.value)}
            >
              {CATEGORY_OPTIONS.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <Button
              variant={formState.uploadOption === "upload" ? "contained" : "outlined"}
              onClick={() => onFormValueChange("uploadOption", "upload")}
            >
              Subir imagen
            </Button>
            <Button
              variant={formState.uploadOption === "take" ? "contained" : "outlined"}
              onClick={() => onFormValueChange("uploadOption", "take")}
            >
              Tomar foto
            </Button>
            <Button
              variant={formState.uploadOption === "auto" ? "contained" : "outlined"}
              onClick={() => onFormValueChange("uploadOption", "auto")}
            >
              Detectar
            </Button>
          </Stack>

          {formState.uploadOption === "upload" && (
            <Button variant="outlined" component="label">
              Elegir archivo
              <input hidden type="file" accept="image/*" onChange={onImageChange} />
            </Button>
          )}

          {formState.uploadOption === "take" && (
            <Stack spacing={2}>
              <Box
                sx={{
                  position: "relative",
                  height: 260,
                  border: "1px solid #d0d7de",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  width="100%"
                  height="100%"
                />
              </Box>
              <Button
                variant="contained"
                onClick={onCapture}
                disabled={formState.detectLoading}
              >
                Capturar imagen
              </Button>
            </Stack>
          )}

          {formState.uploadOption === "auto" && (
            <Stack spacing={1.5}>
              <Typography color="text.secondary">
                {formState.detectedName ||
                  "Sube o captura una imagen y luego usa la deteccion automatica."}
              </Typography>
              <Button
                variant="contained"
                onClick={onAutoDetect}
                disabled={!formState.itemImage || formState.detectLoading}
              >
                {formState.detectLoading ? "Detectando..." : "Detectar producto"}
              </Button>
            </Stack>
          )}

          {formState.imagePreview && (
            <Box
              sx={{
                borderRadius: 2,
                overflow: "hidden",
                backgroundColor: "#f5f5f5",
              }}
            >
              <Image
                src={formState.imagePreview}
                alt="Vista previa"
                width={1200}
                height={900}
                unoptimized
                style={{ width: "100%", height: "auto" }}
              />
            </Box>
          )}

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button variant="outlined" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={onSubmit}
              disabled={formState.submitLoading}
            >
              {formState.submitLoading
                ? "Guardando..."
                : editingItem
                  ? "Guardar cambios"
                  : "Agregar producto"}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Modal>
  );
}
