"use client";

import Image from "next/image";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
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
  onApplyDetectionSuggestion,
  onSubmit,
}) {
  const steps = [
    { key: "details", label: "1. Datos" },
    {
      key: "upload",
      label:
        formState.uploadOption === "upload"
          ? "2. Subida"
          : formState.uploadOption === "take"
            ? "2. Camara"
            : "2. Deteccion",
    },
    { key: "review", label: "3. Revision" },
  ];

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "92%", sm: 560 },
          maxHeight: "92vh",
          overflowY: "auto",
          bgcolor: "background.paper",
          borderRadius: 4,
          boxShadow: "0 40px 120px rgba(48, 44, 35, 0.28)",
          p: { xs: 2.5, sm: 3.5 },
        }}
      >
        <Stack spacing={2.5}>
          <Box>
            <Chip
              label={editingItem ? "Edicion guiada" : "Nuevo registro"}
              color="secondary"
              variant="outlined"
              sx={{ marginBottom: 1.5 }}
            />
            <Typography variant="h2" component="h2">
              {editingItem ? "Actualizar producto" : "Agregar al inventario"}
            </Typography>
            <Typography color="text.secondary" sx={{ marginTop: 1 }}>
              Sigue este flujo para capturar datos limpios, imagen y contexto del producto.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {steps.map((step) => (
              <Chip key={step.key} label={step.label} color="primary" variant="outlined" />
            ))}
          </Stack>

          {formState.formError && <Alert severity="error">{formState.formError}</Alert>}
          {formState.imageError && <Alert severity="warning">{formState.imageError}</Alert>}
          {formState.imageStatus && <Alert severity="info">{formState.imageStatus}</Alert>}

          <CardBlock
            title="Paso 1. Describe el producto"
            caption="Usa un nombre claro y una categoria coherente para mantener el inventario ordenado."
          >
            <TextField
              label="Nombre del producto"
              placeholder="Ej. Tomate saladet"
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
          </CardBlock>

          <CardBlock
            title="Paso 2. Agrega una imagen"
            caption="Elige el método que mejor se adapte al momento: archivo, camara o deteccion."
          >
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
                Usar camara
              </Button>
              <Button
                variant={formState.uploadOption === "auto" ? "contained" : "outlined"}
                onClick={() => onFormValueChange("uploadOption", "auto")}
              >
                Detectar desde imagen
              </Button>
            </Stack>

            {formState.uploadOption === "upload" && (
              <Button variant="outlined" component="label" sx={{ alignSelf: "flex-start" }}>
                Elegir archivo
                <input hidden type="file" accept="image/*" onChange={onImageChange} />
              </Button>
            )}

            {formState.uploadOption === "take" && (
              <Stack spacing={2}>
                <Box
                  sx={{
                    position: "relative",
                    aspectRatio: "4 / 3",
                    border: "1px solid rgba(49, 92, 74, 0.14)",
                    borderRadius: 3,
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
                  sx={{ alignSelf: "flex-start" }}
                >
                  Capturar imagen
                </Button>
              </Stack>
            )}

            {formState.uploadOption === "auto" && (
              <Stack spacing={1.5}>
                <Button variant="outlined" component="label" sx={{ alignSelf: "flex-start" }}>
                  Seleccionar imagen para detectar
                  <input hidden type="file" accept="image/*" onChange={onImageChange} />
                </Button>
                <Typography color="text.secondary">
                  {formState.detectedName ||
                    "Primero sube o captura una imagen y luego usa la deteccion automatica."}
                </Typography>
                {formState.detectionSuggestions?.length > 0 && (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {formState.detectionSuggestions.map((suggestion) => (
                      <Chip
                        key={suggestion}
                        label={suggestion}
                        onClick={() => onApplyDetectionSuggestion(suggestion)}
                        color={
                          suggestion === formState.itemName ? "secondary" : "primary"
                        }
                        variant={
                          suggestion === formState.itemName ? "filled" : "outlined"
                        }
                      />
                    ))}
                  </Stack>
                )}
                {formState.suggestedCategory && (
                  <Chip
                    label={`Categoria sugerida: ${formState.suggestedCategory}`}
                    color="secondary"
                    variant="outlined"
                    sx={{ alignSelf: "flex-start" }}
                  />
                )}
                <Button
                  variant="contained"
                  onClick={onAutoDetect}
                  disabled={!formState.itemImage || formState.detectLoading}
                  sx={{ alignSelf: "flex-start" }}
                >
                  {formState.detectLoading ? "Detectando..." : "Analizar imagen"}
                </Button>
              </Stack>
            )}
          </CardBlock>

          <CardBlock
            title="Paso 3. Revisa antes de guardar"
            caption="Confirma que el nombre, la categoria y la imagen comuniquen claramente el producto."
          >
            <Stack spacing={1.25}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  label={formState.itemName ? `Nombre: ${formState.itemName}` : "Nombre pendiente"}
                  variant="outlined"
                />
                <Chip label={`Categoria: ${formState.itemCategory}`} variant="outlined" />
                {formState.detectedName && (
                  <Chip label={`Deteccion: ${formState.detectedName}`} variant="outlined" />
                )}
              </Stack>

              {formState.imagePreview ? (
                <Box
                  sx={{
                    borderRadius: 3,
                    overflow: "hidden",
                    backgroundColor: "#f5f5f5",
                    aspectRatio: "4 / 3",
                  }}
                >
                  <Image
                    src={formState.imagePreview}
                    alt="Vista previa"
                    width={1200}
                    height={900}
                    unoptimized
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </Box>
              ) : (
                <Box
                  sx={{
                    padding: 2,
                    borderRadius: 3,
                    border: "1px dashed rgba(49, 92, 74, 0.2)",
                  }}
                >
                  <Typography color="text.secondary">
                    Aun no has agregado una imagen para este producto.
                  </Typography>
                </Box>
              )}
            </Stack>
          </CardBlock>

          <Divider />
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
                  : "Guardar producto"}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Modal>
  );
}

function CardBlock({ title, caption, children }) {
  return (
    <Box
      sx={{
        padding: 2.25,
        borderRadius: 3,
        backgroundColor: "rgba(255, 250, 242, 0.72)",
        border: "1px solid rgba(49, 92, 74, 0.08)",
      }}
    >
      <Stack spacing={1.75}>
        <Box>
          <Typography variant="h6">{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {caption}
          </Typography>
        </Box>
        {children}
      </Stack>
    </Box>
  );
}
