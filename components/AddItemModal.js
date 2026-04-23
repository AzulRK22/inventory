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
    { key: "details", label: "1. Details" },
    {
      key: "upload",
      label:
        formState.uploadOption === "upload"
          ? "2. Upload"
          : formState.uploadOption === "take"
            ? "2. Camera"
            : "2. Detection",
    },
    { key: "review", label: "3. Review" },
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
              label={editingItem ? "Guided edit" : "New entry"}
              color="secondary"
              variant="outlined"
              sx={{ marginBottom: 1.5 }}
            />
            <Typography variant="h2" component="h2">
              {editingItem ? "Update product" : "Add to inventory"}
            </Typography>
            <Typography color="text.secondary" sx={{ marginTop: 1 }}>
              Follow this flow to capture clean details, imagery, and product context.
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
            title="Step 1. Describe the product"
            caption="Use a clear name and a consistent category to keep inventory organized."
          >
            <TextField
              label="Product name"
              placeholder="e.g. Roma tomato"
              value={formState.itemName}
              onChange={(event) => onFormValueChange("itemName", event.target.value)}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel id="item-category-label">Category</InputLabel>
              <Select
                labelId="item-category-label"
                label="Category"
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
            title="Step 2. Add an image"
            caption="Choose the method that fits the moment best: upload, camera, or detection."
          >
            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              <Button
                variant={formState.uploadOption === "upload" ? "contained" : "outlined"}
                onClick={() => onFormValueChange("uploadOption", "upload")}
              >
                Upload image
              </Button>
              <Button
                variant={formState.uploadOption === "take" ? "contained" : "outlined"}
                onClick={() => onFormValueChange("uploadOption", "take")}
              >
                Use camera
              </Button>
              <Button
                variant={formState.uploadOption === "auto" ? "contained" : "outlined"}
                onClick={() => onFormValueChange("uploadOption", "auto")}
              >
                Detect from image
              </Button>
            </Stack>

            {formState.uploadOption === "upload" && (
              <Button variant="outlined" component="label" sx={{ alignSelf: "flex-start" }}>
                Choose file
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
                  Capture image
                </Button>
              </Stack>
            )}

            {formState.uploadOption === "auto" && (
              <Stack spacing={1.5}>
                <Button variant="outlined" component="label" sx={{ alignSelf: "flex-start" }}>
                  Select image for detection
                  <input hidden type="file" accept="image/*" onChange={onImageChange} />
                </Button>
                <Typography color="text.secondary">
                  {formState.detectedName ||
                    "Upload or capture an image first, then run auto detection."}
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
                    label={`Suggested category: ${formState.suggestedCategory}`}
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
                  {formState.detectLoading ? "Detecting..." : "Analyze image"}
                </Button>
              </Stack>
            )}
          </CardBlock>

          <CardBlock
            title="Step 3. Review before saving"
            caption="Confirm that the name, category, and image clearly represent the product."
          >
            <Stack spacing={1.25}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  label={formState.itemName ? `Name: ${formState.itemName}` : "Name pending"}
                  variant="outlined"
                />
                <Chip label={`Category: ${formState.itemCategory}`} variant="outlined" />
                {formState.detectedName && (
                  <Chip label={`Detection: ${formState.detectedName}`} variant="outlined" />
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
                    alt="Preview"
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
                    You have not added an image for this product yet.
                  </Typography>
                </Box>
              )}
            </Stack>
          </CardBlock>

          <Divider />
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button variant="outlined" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={onSubmit}
              disabled={formState.submitLoading}
            >
              {formState.submitLoading
                ? "Saving..."
                : editingItem
                  ? "Save changes"
                  : "Save product"}
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
