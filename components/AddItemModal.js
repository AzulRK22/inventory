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
  LinearProgress,
  MenuItem,
  Modal,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Webcam from "react-webcam";
import {
  AutoAwesome as AutoAwesomeIcon,
  CloudUploadOutlined as UploadIcon,
  PhotoCameraOutlined as CameraIcon,
} from "@mui/icons-material";
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
  onApplyDetectionName,
  onApplyDetectionCategory,
  onApplyDetectionSuggestion,
  onDismissDetectionSuggestion,
  onSubmit,
}) {
  const aiSuggestionName =
    formState.detectedName || formState.detectionSuggestions?.[0] || "";
  const showAiSuggestion =
    Boolean(aiSuggestionName || formState.suggestedCategory) &&
    !formState.detectionDismissed;
  const hasReplacementImage =
    Boolean(formState.itemImage) &&
    typeof formState.imagePreview === "string" &&
    formState.imagePreview.startsWith("data:");
  const createProgressValue = formState.imagePreview
    ? 100
    : formState.itemName.trim() || formState.itemCategory !== "Other"
      ? 55
      : 20;

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
          background:
            "radial-gradient(circle at top right, rgba(207, 122, 88, 0.16), transparent 28%), linear-gradient(180deg, #fffdf8 0%, #f7f1e7 100%)",
          borderRadius: 5,
          border: "1px solid rgba(91, 72, 53, 0.08)",
          boxShadow: "0 40px 120px rgba(48, 44, 35, 0.22)",
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

          {!editingItem && (
            <Box
              sx={{
                padding: 1.75,
                borderRadius: 3,
                backgroundColor: "rgba(255,255,255,0.74)",
                border: "1px solid rgba(49, 92, 74, 0.09)",
              }}
            >
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="overline" color="text.secondary">
                    Guided flow
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    3-step setup
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={createProgressValue}
                  sx={{
                    height: 9,
                    borderRadius: 999,
                    backgroundColor: "rgba(49, 92, 74, 0.08)",
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  Add the essentials first, then polish the entry with imagery and AI.
                </Typography>
              </Stack>
            </Box>
          )}

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

          {editingItem ? (
            <CardBlock
              title="Current image"
              caption="Keep the current image or replace it with a new one."
            >
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
                    alt="Current product"
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
                    This product does not have an image yet.
                  </Typography>
                </Box>
              )}

              <Stack spacing={1.5}>
                <Button variant="outlined" component="label" sx={{ alignSelf: "flex-start" }}>
                  Replace image
                  <input hidden type="file" accept="image/*" onChange={onImageChange} />
                </Button>

                {hasReplacementImage ? (
                  <Stack spacing={1.5}>
                    <Typography color="text.secondary">
                      A replacement image is ready. Analyze it if you want AI help updating the form.
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={onAutoDetect}
                      disabled={!formState.itemImage || formState.detectLoading}
                      sx={{ alignSelf: "flex-start" }}
                      startIcon={<AutoAwesomeIcon />}
                    >
                      {formState.detectLoading ? "Analyzing..." : "Analyze replacement image"}
                    </Button>
                  </Stack>
                ) : (
                  <Typography color="text.secondary">
                    Replacing the image is optional. Add one only if you want to refresh the visual or run AI analysis.
                  </Typography>
                )}
              </Stack>

              {showAiSuggestion && (
                <AiSuggestionBlock
                  currentName={formState.itemName}
                  currentCategory={formState.itemCategory}
                  aiSuggestionName={aiSuggestionName}
                  suggestedCategory={formState.suggestedCategory}
                  detectionSuggestions={formState.detectionSuggestions}
                  onApplyDetectionName={onApplyDetectionName}
                  onApplyDetectionCategory={onApplyDetectionCategory}
                  onApplyDetectionSuggestion={onApplyDetectionSuggestion}
                  onDismissDetectionSuggestion={onDismissDetectionSuggestion}
                />
              )}
            </CardBlock>
          ) : (
            <CardBlock
              title="Step 2. Add an image"
              caption="Choose an image source first, then optionally analyze it with AI."
            >
              <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                <SourceOption
                  title="Upload"
                  description="Bring in a photo from your device."
                  icon={<UploadIcon />}
                  selected={formState.uploadOption === "upload"}
                  onClick={() => onFormValueChange("uploadOption", "upload")}
                />
                <SourceOption
                  title="Camera"
                  description="Capture the product right now."
                  icon={<CameraIcon />}
                  selected={formState.uploadOption === "take"}
                  onClick={() => onFormValueChange("uploadOption", "take")}
                />
              </Stack>

              <CardBlock
                title="Image source"
                caption={
                  formState.uploadOption === "upload"
                    ? "Upload a product photo from your device."
                    : "Capture a fresh photo with your camera."
                }
              >
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

                {formState.itemImage || formState.imagePreview ? (
                  <Stack spacing={1.5}>
                    <Typography color="text.secondary">
                      Your image is ready. Analyze it if you want AI help filling the form.
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={onAutoDetect}
                      disabled={!formState.itemImage || formState.detectLoading}
                      sx={{ alignSelf: "flex-start" }}
                      startIcon={<AutoAwesomeIcon />}
                    >
                      {formState.detectLoading ? "Analyzing..." : "Analyze this image with AI"}
                    </Button>
                  </Stack>
                ) : (
                  <Typography color="text.secondary">
                    Add or capture an image first to unlock AI assistance.
                  </Typography>
                )}
              </CardBlock>

              {showAiSuggestion && (
                <AiSuggestionBlock
                  currentName={formState.itemName}
                  currentCategory={formState.itemCategory}
                  aiSuggestionName={aiSuggestionName}
                  suggestedCategory={formState.suggestedCategory}
                  detectionSuggestions={formState.detectionSuggestions}
                  onApplyDetectionName={onApplyDetectionName}
                  onApplyDetectionCategory={onApplyDetectionCategory}
                  onApplyDetectionSuggestion={onApplyDetectionSuggestion}
                  onDismissDetectionSuggestion={onDismissDetectionSuggestion}
                />
              )}
            </CardBlock>
          )}

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
        borderRadius: 3.5,
        background:
          "linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(250, 244, 234, 0.84))",
        border: "1px solid rgba(49, 92, 74, 0.1)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.72)",
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

function SourceOption({ title, description, icon, selected, onClick }) {
  return (
    <Button
      variant={selected ? "contained" : "outlined"}
      onClick={onClick}
      sx={{
        flex: 1,
        minWidth: 0,
        padding: 0,
        textTransform: "none",
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        sx={{
          width: "100%",
          padding: 1.75,
          background: selected
            ? "linear-gradient(135deg, rgba(49,92,74,0.95), rgba(76,111,96,0.92))"
            : "linear-gradient(180deg, rgba(255,255,255,0.86), rgba(249,243,234,0.72))",
          color: selected ? "common.white" : "text.primary",
        }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2.5,
            display: "grid",
            placeItems: "center",
            backgroundColor: selected
              ? "rgba(255,255,255,0.16)"
              : "rgba(49,92,74,0.08)",
          }}
        >
          {icon}
        </Box>
        <Box sx={{ textAlign: "left" }}>
          <Typography variant="subtitle2">{title}</Typography>
          <Typography
            variant="body2"
            sx={{ color: selected ? "rgba(255,255,255,0.82)" : "text.secondary" }}
          >
            {description}
          </Typography>
        </Box>
      </Stack>
    </Button>
  );
}

function AiSuggestionBlock({
  currentName,
  currentCategory,
  aiSuggestionName,
  suggestedCategory,
  detectionSuggestions,
  onApplyDetectionName,
  onApplyDetectionCategory,
  onApplyDetectionSuggestion,
  onDismissDetectionSuggestion,
}) {
  const hasNameSuggestion = Boolean(aiSuggestionName);
  const hasCategorySuggestion = Boolean(suggestedCategory);

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          padding: 2,
          borderRadius: 3,
          border: "1px solid rgba(49, 92, 74, 0.16)",
          backgroundColor: "rgba(49, 92, 74, 0.06)",
        }}
      >
        <Stack spacing={1.25}>
          <Box>
            <Typography variant="h6">AI suggestion found</Typography>
            <Typography variant="body2" color="text.secondary">
              Review the suggestion and decide whether to apply it to the form.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
              gap: 1.25,
            }}
          >
            <ComparisonCell
              label="Current name"
              value={currentName || "Not set"}
            />
            <ComparisonCell
              label="Suggested name"
              value={aiSuggestionName || "No suggestion"}
              tone="secondary"
            />
            <ComparisonCell
              label="Current category"
              value={currentCategory || "Not set"}
            />
            <ComparisonCell
              label="Suggested category"
              value={suggestedCategory || "No suggestion"}
              tone="secondary"
            />
          </Box>

          {detectionSuggestions?.length > 1 && (
            <Typography variant="body2" color="text.secondary">
              Also considered: {detectionSuggestions.slice(1, 4).join(", ")}
            </Typography>
          )}

          <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
            <Button variant="contained" color="secondary" onClick={onApplyDetectionSuggestion}>
              Use AI result
            </Button>
            <Button
              variant="outlined"
              onClick={onApplyDetectionName}
              disabled={!hasNameSuggestion}
            >
              Use name only
            </Button>
            <Button
              variant="outlined"
              onClick={onApplyDetectionCategory}
              disabled={!hasCategorySuggestion}
            >
              Use category only
            </Button>
            <Button variant="outlined" onClick={onDismissDetectionSuggestion}>
              Keep my values
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
}

function ComparisonCell({ label, value, tone = "default" }) {
  return (
    <Box
      sx={{
        padding: 1.25,
        borderRadius: 2,
        border:
          tone === "secondary"
            ? "1px solid rgba(199, 106, 74, 0.22)"
            : "1px solid rgba(49, 92, 74, 0.12)",
        backgroundColor:
          tone === "secondary"
            ? "rgba(199, 106, 74, 0.08)"
            : "rgba(255, 250, 242, 0.7)",
      }}
    >
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
    </Box>
  );
}
