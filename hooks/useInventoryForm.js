"use client";

import { useCallback, useRef, useState } from "react";
import { detectItemFromImage } from "@/lib/ai";
import {
  createEditFormState,
  createEmptyFormState,
  normalizeItemName,
  suggestCategoryFromText,
  toDisplayName,
  validateImageFile,
} from "@/lib/inventory";
import { requestInventory } from "@/hooks/useInventoryApi";

export function useInventoryForm({
  inventory,
  updateInventory,
  setInventoryStatus,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formState, setFormState] = useState(createEmptyFormState);
  const webcamRef = useRef(null);

  const resetFormState = useCallback(() => {
    setFormState(createEmptyFormState());
    setEditingItem(null);
  }, []);

  const openCreateModal = useCallback(() => {
    resetFormState();
    setIsModalOpen(true);
  }, [resetFormState]);

  const openEditModal = useCallback((item) => {
    setEditingItem(item);
    setFormState(createEditFormState(item));
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    resetFormState();
  }, [resetFormState]);

  const setFormValue = useCallback((key, value) => {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  }, []);

  const handleImageSelection = useCallback((selectedFile, previewSource) => {
    const imageError = validateImageFile(selectedFile);

    if (imageError) {
      setFormState((current) => ({
        ...current,
        itemImage: null,
        imageError,
        imageStatus: "",
      }));
      return;
    }

    setFormState((current) => ({
      ...current,
      itemImage: selectedFile,
      imagePreview: previewSource,
      imageError: "",
      formError: "",
      imageStatus: "Image ready to save.",
      detectedName: "",
      detectionSuggestions: [],
      suggestedCategory: "",
      detectionDismissed: false,
    }));
  }, []);

  const handleImageChange = useCallback(
    (event) => {
      const selectedFile = event.target.files?.[0];

      if (!selectedFile) {
        return;
      }

      const reader = new FileReader();
      reader.onload = () => handleImageSelection(selectedFile, reader.result);
      reader.readAsDataURL(selectedFile);
    },
    [handleImageSelection]
  );

  const handleCapture = useCallback(async () => {
    if (!webcamRef.current) {
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();

    if (!imageSrc) {
      setFormValue("imageError", "The image could not be captured.");
      return;
    }

    const response = await fetch(imageSrc);
    const blob = await response.blob();
    const capturedImage = new File([blob], "captured-item.jpg", {
      type: blob.type || "image/jpeg",
    });

    handleImageSelection(capturedImage, imageSrc);
    setFormValue("capturing", false);
  }, [handleImageSelection, setFormValue]);

  const createItem = useCallback(
    async ({ itemName, itemCategory, imagePreview }) => {
      const resolvedCategory = itemCategory || suggestCategoryFromText(itemName);

      await requestInventory("/api/inventory", {
        method: "POST",
        body: JSON.stringify({
          itemName,
          itemCategory: resolvedCategory,
          imageDataUrl: imagePreview || "",
        }),
      });

      setInventoryStatus(`"${toDisplayName(itemName)}" was added to inventory.`);
    },
    [setInventoryStatus]
  );

  const updateItem = useCallback(
    async ({ itemName, itemCategory, imagePreview }) => {
      if (!editingItem) {
        return;
      }

      const resolvedCategory = itemCategory || suggestCategoryFromText(itemName);

      await requestInventory(`/api/inventory/${editingItem.normalizedName}`, {
        method: "PUT",
        body: JSON.stringify({
          itemName,
          itemCategory: resolvedCategory,
          imageDataUrl:
            typeof imagePreview === "string" && imagePreview.startsWith("data:")
              ? imagePreview
              : "",
          imageUrl:
            typeof imagePreview === "string" ? imagePreview : editingItem.imageUrl || "",
        }),
      });

      setInventoryStatus(`"${toDisplayName(itemName)}" was updated successfully.`);
    },
    [editingItem, setInventoryStatus]
  );

  const handleSubmit = useCallback(async () => {
    const normalizedName = normalizeItemName(formState.itemName);
    const inventoryByNormalizedName = new Set(
      inventory.map((item) => normalizeItemName(item.normalizedName || item.name))
    );

    if (!normalizedName) {
      setFormValue("formError", "Product name cannot be empty.");
      return;
    }

    const duplicateExists =
      inventoryByNormalizedName.has(normalizedName) &&
      normalizedName !== editingItem?.normalizedName;

    if (duplicateExists) {
      setFormValue("formError", "That product already exists in inventory.");
      return;
    }

    const imageError = validateImageFile(formState.itemImage);

    if (imageError) {
      setFormState((current) => ({
        ...current,
        imageError,
        formError: imageError,
      }));
      return;
    }

    try {
      setFormState((current) => ({
        ...current,
        submitLoading: true,
        formError: "",
      }));

      if (editingItem) {
        await updateItem(formState);
      } else {
        await createItem(formState);
      }

      await updateInventory();
      closeModal();
    } catch (error) {
      console.error("Error saving item:", error);
      setFormValue("formError", error.message || "The product could not be saved.");
    } finally {
      setFormState((current) => ({
        ...current,
        submitLoading: false,
      }));
    }
  }, [
    closeModal,
    createItem,
    editingItem,
    formState,
    inventory,
    setFormValue,
    updateInventory,
    updateItem,
  ]);

  const handleAutoDetect = useCallback(async () => {
    try {
      if (!formState.itemImage) {
        setFormState((current) => ({
          ...current,
          formError: "Upload or capture an image before detecting a product.",
          imageError: "An image is required for analysis.",
        }));
        return;
      }

      setFormState((current) => ({
        ...current,
        detectLoading: true,
        imageError: "",
        formError: "",
        imageStatus: "Analyzing image...",
      }));

      const detection = await detectItemFromImage(formState.itemImage);

      setFormState((current) => ({
        ...current,
        detectedName: detection.suggestedName || detection.detectedName || "",
        detectionSuggestions: detection.suggestions || [],
        suggestedCategory: detection.suggestedCategory || "",
        imageStatus: "Image analyzed successfully.",
        detectionDismissed: false,
      }));
    } catch (error) {
      console.error("Error detecting item:", error);
      setFormState((current) => ({
        ...current,
        imageError: error.message || "The product could not be detected.",
        imageStatus: "",
      }));
    } finally {
      setFormState((current) => ({
        ...current,
        detectLoading: false,
      }));
    }
  }, [formState.itemImage]);

  const applyDetectionName = useCallback(() => {
    setFormState((current) => ({
      ...current,
      itemName:
        current.detectedName ||
        current.detectionSuggestions?.[0] ||
        current.itemName,
      formError: "",
      imageStatus: "AI suggested name applied to the form.",
    }));
  }, []);

  const applyDetectionCategory = useCallback(() => {
    setFormState((current) => ({
      ...current,
      itemCategory: current.suggestedCategory || current.itemCategory,
      formError: "",
      imageStatus: "AI suggested category applied to the form.",
    }));
  }, []);

  const applyDetectionSuggestion = useCallback(() => {
    setFormState((current) => ({
      ...current,
      itemName:
        current.detectedName ||
        current.detectionSuggestions?.[0] ||
        current.itemName,
      itemCategory: current.suggestedCategory || current.itemCategory,
      formError: "",
      imageStatus: "AI result applied to the form.",
      detectionDismissed: true,
    }));
  }, []);

  const dismissDetectionSuggestion = useCallback(() => {
    setFormState((current) => ({
      ...current,
      detectionDismissed: true,
      imageStatus: "AI suggestion reviewed. Keeping your current values.",
    }));
  }, []);

  return {
    isModalOpen,
    editingItem,
    formState,
    webcamRef,
    openCreateModal,
    openEditModal,
    closeModal,
    setFormValue,
    applyDetectionName,
    applyDetectionCategory,
    applyDetectionSuggestion,
    dismissDetectionSuggestion,
    handleImageChange,
    handleCapture,
    handleSubmit,
    handleAutoDetect,
  };
}
