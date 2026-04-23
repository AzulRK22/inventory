"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { detectItemFromImage } from "@/lib/ai";
import {
  createEditFormState,
  createEmptyFormState,
  normalizeItemName,
  suggestCategoryFromText,
  toDisplayName,
  validateImageFile,
} from "@/lib/inventory";

async function requestInventory(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: options.cache || "no-store",
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "The operation could not be completed.");
  }

  return data;
}

export function useInventory() {
  const [inventory, setInventory] = useState([]);
  const [movementHistory, setMovementHistory] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [movementLoading, setMovementLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState("");
  const [inventoryStatus, setInventoryStatus] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formState, setFormState] = useState(createEmptyFormState);
  const webcamRef = useRef(null);

  const updateInventory = useCallback(async () => {
    try {
      setInventoryLoading(true);
      setMovementLoading(true);
      setInventoryError("");

      const data = await requestInventory("/api/inventory", {
        method: "GET",
      });

      setInventory(data.inventory || []);
      setMovementHistory(data.movementHistory || []);
    } catch (error) {
      console.error("Error updating inventory:", error);
      setInventoryError("Inventory could not be loaded.");
    } finally {
      setInventoryLoading(false);
      setMovementLoading(false);
    }
  }, []);

  useEffect(() => {
    updateInventory();
  }, [updateInventory]);

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
      detectionSuggestions: [],
      suggestedCategory: "",
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

  const createItem = useCallback(async ({ itemName, itemCategory, imagePreview }) => {
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
  }, []);

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
    [editingItem]
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

  const changeItemQuantity = useCallback(
    async (item, delta) => {
      try {
        const data = await requestInventory(`/api/inventory/${item.normalizedName}`, {
          method: "PATCH",
          body: JSON.stringify({ delta }),
        });
        const nextQuantity = data.item?.quantity ?? item.quantity;

        setInventoryStatus(`"${item.name}" quantity updated to ${nextQuantity}.`);
        await updateInventory();
      } catch (error) {
        console.error("Error changing quantity:", error);
        setInventoryError("Quantity could not be updated.");
      }
    },
    [updateInventory]
  );

  const deleteItem = useCallback(
    async (item) => {
      try {
        await requestInventory(`/api/inventory/${item.normalizedName}`, {
          method: "DELETE",
        });

        setInventoryStatus(`"${item.name}" was removed from inventory.`);
        await updateInventory();
      } catch (error) {
        console.error("Error deleting item:", error);
        setInventoryError("The product could not be deleted.");
      }
    },
    [updateInventory]
  );

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
        itemName:
          !current.itemName && (detection.suggestedName || detection.detectedName)
            ? detection.suggestedName || detection.detectedName
            : current.itemName,
        itemCategory:
          current.itemCategory === "Other" && detection.suggestedCategory
            ? detection.suggestedCategory
            : current.itemCategory,
        imageStatus: "Image analyzed successfully.",
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

  const applyDetectionSuggestion = useCallback((suggestion) => {
    setFormState((current) => ({
      ...current,
      itemName: suggestion,
      itemCategory:
        current.suggestedCategory && current.itemCategory === "Other"
          ? current.suggestedCategory
          : current.itemCategory,
      formError: "",
    }));
  }, []);

  return {
    inventory,
    movementHistory,
    inventoryLoading,
    movementLoading,
    inventoryError,
    inventoryStatus,
    isModalOpen,
    editingItem,
    formState,
    webcamRef,
    updateInventory,
    openCreateModal,
    openEditModal,
    closeModal,
    setFormValue,
    applyDetectionSuggestion,
    handleImageChange,
    handleCapture,
    handleSubmit,
    handleAutoDetect,
    changeItemQuantity,
    deleteItem,
  };
}
