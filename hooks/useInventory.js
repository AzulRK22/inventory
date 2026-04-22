"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { firestore, storage } from "@/firebase";
import { detectItemFromImage } from "@/lib/ai";
import {
  buildItemPayload,
  createEditFormState,
  createEmptyFormState,
  mapInventoryDoc,
  mapMovementDoc,
  normalizeItemName,
  suggestCategoryFromText,
  toDisplayName,
  validateImageFile,
} from "@/lib/inventory";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

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

      const [inventorySnapshot, movementSnapshot] = await Promise.all([
        getDocs(query(collection(firestore, "inventory"))),
        getDocs(query(collection(firestore, "inventory_movements"))),
      ]);

      setInventory(inventorySnapshot.docs.map(mapInventoryDoc));
      setMovementHistory(
        movementSnapshot.docs
          .map(mapMovementDoc)
          .sort((left, right) => {
            const leftValue =
              typeof left.createdAt?.toMillis === "function"
                ? left.createdAt.toMillis()
                : 0;
            const rightValue =
              typeof right.createdAt?.toMillis === "function"
                ? right.createdAt.toMillis()
                : 0;
            return rightValue - leftValue;
          })
          .slice(0, 40)
      );
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

  const recordMovement = useCallback(async (movement) => {
    await addDoc(collection(firestore, "inventory_movements"), {
      ...movement,
      createdAt: serverTimestamp(),
    });
  }, []);

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

  const uploadItemImage = useCallback(
    async (normalizedName, imageFile) => {
      if (!imageFile) {
        return editingItem?.imageUrl || "";
      }

      const imageRef = ref(storage, `inventory/${normalizedName}`);
      await uploadBytes(imageRef, imageFile);
      return getDownloadURL(imageRef);
    },
    [editingItem]
  );

  const createItem = useCallback(
    async ({ itemName, itemCategory, itemImage }) => {
      const normalizedName = normalizeItemName(itemName);
      const imageUrl = await uploadItemImage(normalizedName, itemImage);
      const resolvedCategory = itemCategory || suggestCategoryFromText(itemName);
      const docRef = doc(collection(firestore, "inventory"), normalizedName);

      await setDoc(
        docRef,
        buildItemPayload({
          itemName,
          normalizedName,
          category: resolvedCategory,
          quantity: 1,
          imageUrl,
        }),
        { merge: true }
      );

      await recordMovement({
        itemName: toDisplayName(itemName),
        normalizedName,
        action: "created",
        quantityChange: 1,
        quantityAfter: 1,
        category: resolvedCategory,
        note: "Producto agregado al inventario.",
      });

      setInventoryStatus(`"${toDisplayName(itemName)}" se agrego al inventario.`);
    },
    [recordMovement, uploadItemImage]
  );

  const updateItem = useCallback(
    async ({ itemName, itemCategory, itemImage }) => {
      if (!editingItem) {
        return;
      }

      const normalizedName = normalizeItemName(itemName);
      const previousNormalizedName = editingItem.normalizedName;
      const nextImageUrl = await uploadItemImage(normalizedName, itemImage);
      const resolvedCategory = itemCategory || suggestCategoryFromText(itemName);
      const nextPayload = buildItemPayload({
        itemName,
        normalizedName,
        category: resolvedCategory,
        quantity: editingItem.quantity,
        imageUrl: nextImageUrl,
      });

      if (normalizedName === previousNormalizedName) {
        await setDoc(
          doc(collection(firestore, "inventory"), normalizedName),
          nextPayload,
          { merge: true }
        );
      } else {
        await runTransaction(firestore, async (transaction) => {
          const previousDocRef = doc(
            collection(firestore, "inventory"),
            previousNormalizedName
          );
          const nextDocRef = doc(
            collection(firestore, "inventory"),
            normalizedName
          );
          const nextDoc = await transaction.get(nextDocRef);

          if (nextDoc.exists()) {
            throw new Error("Ese producto ya existe en el inventario.");
          }

          transaction.set(nextDocRef, nextPayload, { merge: true });
          transaction.delete(previousDocRef);
        });
      }

      await recordMovement({
        itemName: toDisplayName(itemName),
        normalizedName,
        action: "updated",
        quantityChange: 0,
        quantityAfter: editingItem.quantity,
        category: resolvedCategory,
        note: "Datos del producto actualizados.",
      });

      setInventoryStatus(`"${toDisplayName(itemName)}" se actualizo correctamente.`);
    },
    [editingItem, recordMovement, uploadItemImage]
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
        const docRef = doc(collection(firestore, "inventory"), item.normalizedName);
        const nextQuantity = Math.max(0, item.quantity + delta);

        await runTransaction(firestore, async (transaction) => {
          const snapshot = await transaction.get(docRef);

          if (!snapshot.exists()) {
            return;
          }

          const data = snapshot.data();

          transaction.set(
            docRef,
            {
              ...data,
              quantity: nextQuantity,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        });

        await recordMovement({
          itemName: item.name,
          normalizedName: item.normalizedName,
          action: delta > 0 ? "incremented" : "decremented",
          quantityChange: delta,
          quantityAfter: nextQuantity,
          category: item.category,
          note:
            delta > 0
              ? "Entrada manual de inventario."
              : "Salida manual de inventario.",
        });

        setInventoryStatus(`Cantidad de "${item.name}" actualizada a ${nextQuantity}.`);
        await updateInventory();
      } catch (error) {
        console.error("Error changing quantity:", error);
        setInventoryError("No se pudo actualizar la cantidad.");
      }
    },
    [recordMovement, updateInventory]
  );

  const deleteItem = useCallback(
    async (item) => {
      try {
        await deleteDoc(doc(collection(firestore, "inventory"), item.normalizedName));

        await recordMovement({
          itemName: item.name,
          normalizedName: item.normalizedName,
          action: "deleted",
          quantityChange: -item.quantity,
          quantityAfter: 0,
          category: item.category,
          note: "Producto eliminado del inventario.",
        });

        setInventoryStatus(`"${item.name}" se elimino del inventario.`);
        await updateInventory();
      } catch (error) {
        console.error("Error deleting item:", error);
        setInventoryError("No se pudo eliminar el producto.");
      }
    },
    [recordMovement, updateInventory]
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
