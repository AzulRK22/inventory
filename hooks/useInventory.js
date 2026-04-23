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
    throw new Error(data.error || "No se pudo completar la operacion.");
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
      setInventoryError("No se pudo cargar el inventario.");
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
      imageStatus: "Imagen lista para guardar.",
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
      setFormValue("imageError", "No se pudo capturar la imagen.");
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

    setInventoryStatus(`"${toDisplayName(itemName)}" se agrego al inventario.`);
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

      setInventoryStatus(`"${toDisplayName(itemName)}" se actualizo correctamente.`);
    },
    [editingItem]
  );

  const handleSubmit = useCallback(async () => {
    const normalizedName = normalizeItemName(formState.itemName);
    const inventoryByNormalizedName = new Set(
      inventory.map((item) => normalizeItemName(item.normalizedName || item.name))
    );

    if (!normalizedName) {
      setFormValue("formError", "El nombre del producto no puede estar vacio.");
      return;
    }

    const duplicateExists =
      inventoryByNormalizedName.has(normalizedName) &&
      normalizedName !== editingItem?.normalizedName;

    if (duplicateExists) {
      setFormValue("formError", "Ese producto ya existe en el inventario.");
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
      setFormValue(
        "formError",
        error.message || "No se pudo guardar el producto."
      );
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

        setInventoryStatus(`Cantidad de "${item.name}" actualizada a ${nextQuantity}.`);
        await updateInventory();
      } catch (error) {
        console.error("Error changing quantity:", error);
        setInventoryError("No se pudo actualizar la cantidad.");
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

        setInventoryStatus(`"${item.name}" se elimino del inventario.`);
        await updateInventory();
      } catch (error) {
        console.error("Error deleting item:", error);
        setInventoryError("No se pudo eliminar el producto.");
      }
    },
    [updateInventory]
  );

  const handleAutoDetect = useCallback(async () => {
    try {
      if (!formState.itemImage) {
        setFormState((current) => ({
          ...current,
          formError: "Sube o captura una imagen antes de detectar el producto.",
          imageError: "Falta una imagen para analizar.",
        }));
        return;
      }

      setFormState((current) => ({
        ...current,
        detectLoading: true,
        imageError: "",
        formError: "",
        imageStatus: "Analizando imagen...",
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
        imageStatus: "Imagen analizada correctamente.",
      }));
    } catch (error) {
      console.error("Error detecting item:", error);
      setFormState((current) => ({
        ...current,
        imageError: error.message || "No se pudo detectar el producto.",
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
