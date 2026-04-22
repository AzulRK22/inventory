"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { firestore, storage } from "@/firebase";
import { detectItemFromImage } from "@/lib/ai";
import {
  buildItemPayload,
  createEditFormState,
  createEmptyFormState,
  mapInventoryDoc,
  normalizeItemName,
  toDisplayName,
  validateImageFile,
} from "@/lib/inventory";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  runTransaction,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

export function useInventory() {
  const [inventory, setInventory] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState("");
  const [inventoryStatus, setInventoryStatus] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formState, setFormState] = useState(createEmptyFormState);
  const webcamRef = useRef(null);

  const updateInventory = useCallback(async () => {
    try {
      setInventoryLoading(true);
      setInventoryError("");
      const inventoryQuery = query(collection(firestore, "inventory"));
      const snapshot = await getDocs(inventoryQuery);
      setInventory(snapshot.docs.map(mapInventoryDoc));
    } catch (error) {
      console.error("Error updating inventory:", error);
      setInventoryError("No se pudo cargar el inventario.");
    } finally {
      setInventoryLoading(false);
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
      const docRef = doc(collection(firestore, "inventory"), normalizedName);

      await setDoc(
        docRef,
        buildItemPayload({
          itemName,
          normalizedName,
          category: itemCategory,
          quantity: 1,
          imageUrl,
        }),
        { merge: true }
      );

      setInventoryStatus(`"${toDisplayName(itemName)}" se agrego al inventario.`);
    },
    [uploadItemImage]
  );

  const updateItem = useCallback(
    async ({ itemName, itemCategory, itemImage }) => {
      if (!editingItem) {
        return;
      }

      const normalizedName = normalizeItemName(itemName);
      const previousNormalizedName = editingItem.normalizedName;
      const nextImageUrl = await uploadItemImage(normalizedName, itemImage);
      const nextPayload = buildItemPayload({
        itemName,
        normalizedName,
        category: itemCategory,
        quantity: editingItem.quantity,
        imageUrl: nextImageUrl,
      });

      if (normalizedName === previousNormalizedName) {
        const docRef = doc(collection(firestore, "inventory"), normalizedName);
        await setDoc(docRef, nextPayload, { merge: true });
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

      setInventoryStatus(
        `"${toDisplayName(itemName)}" se actualizo correctamente.`
      );
    },
    [editingItem, uploadItemImage]
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

        setInventoryStatus(
          `Cantidad de "${item.name}" actualizada a ${nextQuantity}.`
        );
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
        await deleteDoc(
          doc(collection(firestore, "inventory"), item.normalizedName)
        );
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

      const detectedName = await detectItemFromImage(formState.itemImage);

      setFormState((current) => ({
        ...current,
        detectedName,
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

  return {
    inventory,
    inventoryLoading,
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
    handleImageChange,
    handleCapture,
    handleSubmit,
    handleAutoDetect,
    changeItemQuantity,
    deleteItem,
  };
}
