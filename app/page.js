"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { firestore, storage } from "@/firebase";
import Image from "next/image";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  Stack,
  TextField,
  ThemeProvider,
  Tooltip,
  Typography,
  createTheme,
} from "@mui/material";
import {
  Add as AddIcon,
  DeleteOutline as DeleteIcon,
  EditOutlined as EditIcon,
  Lightbulb as LightbulbIcon,
  Remove as RemoveIcon,
} from "@mui/icons-material";
import {
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
import Webcam from "react-webcam";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
  typography: {
    fontFamily: "Roboto, sans-serif",
  },
});

const CATEGORY_OPTIONS = [
  "Produce",
  "Dairy",
  "Protein",
  "Pantry",
  "Frozen",
  "Beverages",
  "Snacks",
  "Household",
  "Other",
];

const SORT_OPTIONS = [
  { value: "recent", label: "Mas recientes" },
  { value: "name", label: "Nombre A-Z" },
  { value: "quantity-desc", label: "Mayor cantidad" },
  { value: "quantity-asc", label: "Menor cantidad" },
  { value: "category", label: "Categoria" },
];

const EMPTY_FORM = {
  itemName: "",
  itemCategory: "Other",
  itemImage: null,
  imagePreview: null,
  detectedName: "",
  uploadOption: "upload",
  capturing: false,
  formError: "",
  imageError: "",
  imageStatus: "",
  submitLoading: false,
  detectLoading: false,
};

const normalizeItemName = (value) =>
  value.trim().replace(/\s+/g, " ").toLowerCase();

const toDisplayName = (value) =>
  value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

const validateImageFile = (file) => {
  if (!file) {
    return "";
  }

  if (!file.type?.startsWith("image/")) {
    return "Selecciona un archivo de imagen valido.";
  }

  if (file.size > 5 * 1024 * 1024) {
    return "La imagen debe pesar 5 MB o menos.";
  }

  return "";
};

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        reject(new Error("No se pudo leer la imagen."));
        return;
      }

      resolve(result.split(",")[1]);
    };
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });

const getUpdatedAtValue = (value) => {
  if (!value) {
    return 0;
  }

  if (typeof value.toMillis === "function") {
    return value.toMillis();
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatUpdatedAt = (value) => {
  const timestamp = getUpdatedAtValue(value);

  if (!timestamp) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
};

const buildItemPayload = ({
  itemName,
  normalizedName,
  category,
  quantity,
  imageUrl,
}) => ({
  name: toDisplayName(itemName),
  normalizedName,
  quantity,
  imageUrl: imageUrl || "",
  category: category || "Other",
  updatedAt: serverTimestamp(),
});

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState("");
  const [inventoryStatus, setInventoryStatus] = useState("");
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [recipeSuggestions, setRecipeSuggestions] = useState([]);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeError, setRecipeError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formState, setFormState] = useState(EMPTY_FORM);
  const webcamRef = useRef(null);

  const inventoryByNormalizedName = new Set(
    inventory.map((item) => normalizeItemName(item.normalizedName || item.name))
  );

  const resetFormState = useCallback(() => {
    setFormState(EMPTY_FORM);
    setEditingItem(null);
  }, []);

  const updateInventory = useCallback(async () => {
    try {
      setInventoryLoading(true);
      setInventoryError("");
      const inventoryQuery = query(collection(firestore, "inventory"));
      const snapshot = await getDocs(inventoryQuery);

      const inventoryList = snapshot.docs.map((inventoryDoc) => {
        const data = inventoryDoc.data();
        const normalizedName =
          data.normalizedName || normalizeItemName(data.name || inventoryDoc.id);

        return {
          id: inventoryDoc.id,
          name: data.name || data.displayName || toDisplayName(inventoryDoc.id),
          normalizedName,
          quantity: data.quantity ?? 0,
          imageUrl: data.imageUrl || data.imageURL || "",
          category: data.category || "Other",
          updatedAt: data.updatedAt || null,
        };
      });

      setInventory(inventoryList);
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

  const openCreateModal = () => {
    resetFormState();
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormState({
      itemName: item.name,
      itemCategory: item.category || "Other",
      itemImage: null,
      imagePreview: item.imageUrl || null,
      detectedName: "",
      uploadOption: item.imageUrl ? "auto" : "upload",
      capturing: false,
      formError: "",
      imageError: "",
      imageStatus: item.imageUrl ? "Imagen actual cargada." : "",
      submitLoading: false,
      detectLoading: false,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetFormState();
  };

  const setFormValue = (key, value) => {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleImageSelection = (selectedFile, previewSource) => {
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
  };

  const handleImageChange = (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => handleImageSelection(selectedFile, reader.result);
    reader.readAsDataURL(selectedFile);
  };

  const handleCapture = async () => {
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
  };

  const uploadItemImage = async (normalizedName, imageFile) => {
    if (!imageFile) {
      return editingItem?.imageUrl || "";
    }

    const imageRef = ref(storage, `inventory/${normalizedName}`);
    await uploadBytes(imageRef, imageFile);
    return getDownloadURL(imageRef);
  };

  const createItem = async ({ itemName, itemCategory, itemImage }) => {
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
  };

  const updateItem = async ({ itemName, itemCategory, itemImage }) => {
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
        const nextDocRef = doc(collection(firestore, "inventory"), normalizedName);
        const nextDoc = await transaction.get(nextDocRef);

        if (nextDoc.exists()) {
          throw new Error("Ese producto ya existe en el inventario.");
        }

        transaction.set(nextDocRef, nextPayload, { merge: true });
        transaction.delete(previousDocRef);
      });
    }

    setInventoryStatus(`"${toDisplayName(itemName)}" se actualizo correctamente.`);
  };

  const handleSubmit = async () => {
    const normalizedName = normalizeItemName(formState.itemName);

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
  };

  const changeItemQuantity = async (item, delta) => {
    try {
      const docRef = doc(collection(firestore, "inventory"), item.normalizedName);

      await runTransaction(firestore, async (transaction) => {
        const snapshot = await transaction.get(docRef);

        if (!snapshot.exists()) {
          return;
        }

        const data = snapshot.data();
        const nextQuantity = Math.max(0, (data.quantity ?? item.quantity) + delta);

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
        `Cantidad de "${item.name}" actualizada a ${item.quantity + delta}.`
      );
      await updateInventory();
    } catch (error) {
      console.error("Error changing quantity:", error);
      setInventoryError("No se pudo actualizar la cantidad.");
    }
  };

  const deleteItem = async (item) => {
    try {
      await deleteDoc(doc(collection(firestore, "inventory"), item.normalizedName));
      setInventoryStatus(`"${item.name}" se elimino del inventario.`);
      await updateInventory();
    } catch (error) {
      console.error("Error deleting item:", error);
      setInventoryError("No se pudo eliminar el producto.");
    }
  };

  const handleAutoDetect = async () => {
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

      const response = await fetch("/api/vision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64: await fileToBase64(formState.itemImage),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo detectar el producto.");
      }

      setFormState((current) => ({
        ...current,
        detectedName: data.detectedName || "No se pudo detectar el nombre.",
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
  };

  const fetchRecipeSuggestions = async () => {
    try {
      setRecipeLoading(true);
      setRecipeError("");
      setRecipeSuggestions([]);

      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: inventory.map((item) => item.name),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudieron obtener sugerencias.");
      }

      setRecipeSuggestions(data.recipes || []);
    } catch (error) {
      console.error("Error fetching recipe suggestions:", error);
      setRecipeError(
        error.message || "No se pudieron generar sugerencias de recetas."
      );
    } finally {
      setRecipeLoading(false);
    }
  };

  const filteredInventory = inventory
    .filter((item) => {
      const searchableText = [
        item.name,
        item.normalizedName,
        item.category,
        String(item.quantity),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(searchText.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter;

      return matchesSearch && matchesCategory;
    })
    .sort((left, right) => {
      if (sortBy === "name") {
        return left.name.localeCompare(right.name);
      }

      if (sortBy === "quantity-desc") {
        return right.quantity - left.quantity;
      }

      if (sortBy === "quantity-asc") {
        return left.quantity - right.quantity;
      }

      if (sortBy === "category") {
        return left.category.localeCompare(right.category) || left.name.localeCompare(right.name);
      }

      return getUpdatedAtValue(right.updatedAt) - getUpdatedAtValue(left.updatedAt);
    });

  const searchFeedback = searchText
    ? `${filteredInventory.length} resultado(s) para "${searchText}".`
    : `${filteredInventory.length} producto(s) en vista.`;

  return (
    <ThemeProvider theme={theme}>
      <Box
        width="100%"
        minHeight="100vh"
        display="flex"
        flexDirection="column"
        alignItems="center"
        padding={{ xs: 2, md: 4 }}
      >
        <Stack spacing={3} width="100%" maxWidth="1120px">
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={2}
          >
            <Box>
              <Typography variant="h3" component="h1">
                Azul&apos;s Shop
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Gestiona inventario con cantidades, categorias, imagenes y acciones claras.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.5}>
              <Tooltip title="Generar sugerencias de recetas">
                <span>
                  <IconButton
                    color="primary"
                    onClick={fetchRecipeSuggestions}
                    disabled={recipeLoading || inventory.length === 0}
                  >
                    {recipeLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <LightbulbIcon />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
              <Button variant="contained" onClick={openCreateModal}>
                Nuevo producto
              </Button>
            </Stack>
          </Stack>

          {inventoryStatus && <Alert severity="success">{inventoryStatus}</Alert>}
          {inventoryError && <Alert severity="error">{inventoryError}</Alert>}

          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  alignItems={{ xs: "stretch", md: "center" }}
                >
                  <TextField
                    label="Buscar en inventario"
                    placeholder="Nombre, categoria o cantidad"
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    sx={{ flex: 2 }}
                  />
                  <FormControl sx={{ minWidth: 180 }}>
                    <InputLabel id="category-filter-label">Categoria</InputLabel>
                    <Select
                      labelId="category-filter-label"
                      value={categoryFilter}
                      label="Categoria"
                      onChange={(event) => setCategoryFilter(event.target.value)}
                    >
                      <MenuItem value="all">Todas</MenuItem>
                      {CATEGORY_OPTIONS.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl sx={{ minWidth: 180 }}>
                    <InputLabel id="sort-by-label">Ordenar</InputLabel>
                    <Select
                      labelId="sort-by-label"
                      value={sortBy}
                      label="Ordenar"
                      onChange={(event) => setSortBy(event.target.value)}
                    >
                      {SORT_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  {searchFeedback}
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          <Box>
            {inventoryLoading ? (
              <Stack alignItems="center" spacing={2} paddingY={8}>
                <CircularProgress />
                <Typography color="text.secondary">
                  Cargando inventario...
                </Typography>
              </Stack>
            ) : filteredInventory.length === 0 ? (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6">
                    {inventory.length === 0
                      ? "Tu inventario esta vacio."
                      : "No encontramos productos con esos filtros."}
                  </Typography>
                  <Typography color="text.secondary" sx={{ marginTop: 1 }}>
                    {inventory.length === 0
                      ? "Agrega tu primer producto para empezar a gestionar existencias."
                      : "Prueba con otra busqueda, categoria o criterio de orden."}
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Grid container spacing={2}>
                {filteredInventory.map((item) => (
                  <Grid item xs={12} sm={6} lg={4} key={item.normalizedName}>
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
                              <Typography color="text.secondary">
                                Sin imagen
                              </Typography>
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
                                onClick={() => changeItemQuantity(item, -1)}
                                disabled={item.quantity <= 0}
                              >
                                <RemoveIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Sumar una unidad">
                            <IconButton
                              color="primary"
                              onClick={() => changeItemQuantity(item, 1)}
                            >
                              <AddIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>

                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Editar producto">
                            <IconButton
                              color="primary"
                              onClick={() => openEditModal(item)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar producto">
                            <IconButton
                              color="secondary"
                              onClick={() => deleteItem(item)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>

          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6">Recipe Suggestions</Typography>
                {recipeError && <Alert severity="error">{recipeError}</Alert>}
                {recipeLoading ? (
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <CircularProgress size={20} />
                    <Typography color="text.secondary">
                      Generando recetas...
                    </Typography>
                  </Stack>
                ) : recipeSuggestions.length > 0 ? (
                  <Stack spacing={1.5}>
                    {recipeSuggestions.map((recipe, index) => (
                      <Card key={`${recipe}-${index}`} variant="outlined">
                        <CardContent>
                          <Typography>{recipe}</Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                ) : (
                  <Typography color="text.secondary">
                    {inventory.length === 0
                      ? "Agrega productos al inventario para recibir recetas."
                      : "Todavia no has generado sugerencias de recetas."}
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        <Modal open={isModalOpen} onClose={closeModal}>
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

              {formState.formError && (
                <Alert severity="error">{formState.formError}</Alert>
              )}
              {formState.imageError && (
                <Alert severity="warning">{formState.imageError}</Alert>
              )}
              {formState.imageStatus && (
                <Alert severity="info">{formState.imageStatus}</Alert>
              )}

              <TextField
                label="Nombre del producto"
                value={formState.itemName}
                onChange={(event) => setFormValue("itemName", event.target.value)}
                fullWidth
              />

              <FormControl fullWidth>
                <InputLabel id="item-category-label">Categoria</InputLabel>
                <Select
                  labelId="item-category-label"
                  label="Categoria"
                  value={formState.itemCategory}
                  onChange={(event) =>
                    setFormValue("itemCategory", event.target.value)
                  }
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
                  onClick={() => setFormValue("uploadOption", "upload")}
                >
                  Subir imagen
                </Button>
                <Button
                  variant={formState.uploadOption === "take" ? "contained" : "outlined"}
                  onClick={() => setFormValue("uploadOption", "take")}
                >
                  Tomar foto
                </Button>
                <Button
                  variant={formState.uploadOption === "auto" ? "contained" : "outlined"}
                  onClick={() => setFormValue("uploadOption", "auto")}
                >
                  Detectar
                </Button>
              </Stack>

              {formState.uploadOption === "upload" && (
                <Button variant="outlined" component="label">
                  Elegir archivo
                  <input hidden type="file" accept="image/*" onChange={handleImageChange} />
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
                    onClick={handleCapture}
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
                    onClick={handleAutoDetect}
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
                <Button variant="outlined" onClick={closeModal}>
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={formState.submitLoading}
                >
                  {formState.submitLoading ? "Guardando..." : editingItem ? "Guardar cambios" : "Agregar producto"}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Modal>
      </Box>
    </ThemeProvider>
  );
}
