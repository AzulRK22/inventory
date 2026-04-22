"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { firestore, storage } from "@/firebase";
import Image from "next/image";
import {
  Box,
  Modal,
  Stack,
  TextField,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  ThemeProvider,
  createTheme,
  IconButton,
  Tooltip,
  Grid,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  collection,
  query,
  getDoc,
  getDocs,
  deleteDoc,
  setDoc,
  doc,
  runTransaction,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Webcam from "react-webcam";
import LightbulbIcon from "@mui/icons-material/Lightbulb";

// Configuración del tema
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

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemImage, setItemImage] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadOption, setUploadOption] = useState("upload"); // "upload", "take", "auto"
  const [capturing, setCapturing] = useState(false);
  const [detectedName, setDetectedName] = useState("");
  const [recipeSuggestions, setRecipeSuggestions] = useState([]);
  const [formError, setFormError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [detectLoading, setDetectLoading] = useState(false);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const webcamRef = useRef(null);

  const inventoryById = new Set(
    inventory.map((item) => normalizeItemName(item.id || item.name))
  );

  // Actualizar el inventario
  const updateInventory = useCallback(async () => {
    try {
      const snapshot = query(collection(firestore, "inventory"));
      const docs = await getDocs(snapshot);
      const inventoryList = [];
      docs.forEach((inventoryDoc) => {
        const data = inventoryDoc.data();
        inventoryList.push({
          id: inventoryDoc.id,
          name: data.displayName || toDisplayName(inventoryDoc.id),
          quantity: data.quantity ?? 0,
          imageURL: data.imageURL || "",
        });
      });
      setInventory(inventoryList);
    } catch (error) {
      console.error("Error updating inventory:", error);
    }
  }, []);

  // Agregar un ítem
  const addItem = async (item, imageFile) => {
    try {
      const normalizedName = normalizeItemName(item);
      const displayName = toDisplayName(item);
      const docRef = doc(collection(firestore, "inventory"), normalizedName);
      let imageURL = "";

      if (imageFile) {
        const imageRef = ref(storage, `inventory/${normalizedName}`);
        await uploadBytes(imageRef, imageFile);
        imageURL = await getDownloadURL(imageRef);
      }

      await setDoc(docRef, {
        displayName,
        quantity: 1,
        imageURL,
      });

      await updateInventory();
    } catch (error) {
      console.error("Error adding item:", error);
      throw error;
    }
  };

  const changeItemQuantity = async (itemId, delta) => {
    try {
      const docRef = doc(collection(firestore, "inventory"), itemId);

      await runTransaction(firestore, async (transaction) => {
        const snapshot = await transaction.get(docRef);

        if (!snapshot.exists()) {
          return;
        }

        const data = snapshot.data();
        const nextQuantity = (data.quantity ?? 0) + delta;

        if (nextQuantity <= 0) {
          transaction.delete(docRef);
          return;
        }

        transaction.set(
          docRef,
          {
            ...data,
            quantity: nextQuantity,
          },
          { merge: true }
        );
      });

      await updateInventory();
    } catch (error) {
      console.error("Error changing item quantity:", error);
    }
  };

  // Inicializar el inventario al cargar el componente
  useEffect(() => {
    updateInventory();
  }, [updateInventory]);

  // Manejar la apertura y cierre del modal
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setItemName("");
    setItemImage(null);
    setImagePreview(null);
    setUploadOption("upload");
    setCapturing(false);
    setDetectedName("");
    setFormError("");
    setOpen(false);
  };

  // Manejar el cambio de imagen (carga desde el dispositivo)
  const handleImageChange = (e) => {
    const selectedFile = e.target.files[0];

    if (selectedFile) {
      const imageError = validateImageFile(selectedFile);
      if (imageError) {
        setFormError(imageError);
        return;
      }

      setFormError("");
      setItemImage(selectedFile);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(selectedFile);
    }
  };

  // Manejar la captura de imagen desde la cámara
  const handleCapture = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      fetch(imageSrc)
        .then((res) => res.blob())
        .then((blob) => {
          const capturedImage = new File([blob], "captured-item.jpg", {
            type: blob.type || "image/jpeg",
          });
          setFormError("");
          setItemImage(capturedImage);
          setImagePreview(imageSrc);
          setCapturing(false);
        });
    }
  };

  // Detectar el nombre de la imagen usando Google Cloud Vision API
  const handleAutoDetect = async () => {
    try {
      if (!itemImage) {
        setFormError("Sube o captura una imagen antes de detectar el producto.");
        return;
      }

      setDetectLoading(true);
      setFormError("");

      const response = await fetch("/api/vision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64: await fileToBase64(itemImage),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo detectar el producto.");
      }

      setDetectedName(data.detectedName || "No se pudo detectar el nombre.");
    } catch (error) {
      console.error("Error detecting image:", error);
      setFormError(error.message || "No se pudo detectar el producto.");
    } finally {
      setDetectLoading(false);
    }
  };

  // Obtener sugerencias de recetas usando OpenAI API
  const fetchRecipeSuggestions = async (inventoryList) => {
    try {
      setRecipeLoading(true);
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: inventoryList.map((item) => item.name),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudieron obtener sugerencias.");
      }

      setRecipeSuggestions(data.recipes || []);
    } catch (error) {
      console.error("Error fetching recipe suggestions:", error);
    } finally {
      setRecipeLoading(false);
    }
  };

  const handleSubmit = async () => {
    const normalizedName = normalizeItemName(itemName);
    const imageError = validateImageFile(itemImage);

    if (!normalizedName) {
      setFormError("El nombre del producto no puede estar vacio.");
      return;
    }

    if (inventoryById.has(normalizedName)) {
      setFormError("Ese producto ya existe en el inventario.");
      return;
    }

    if (imageError) {
      setFormError(imageError);
      return;
    }

    try {
      setSubmitLoading(true);
      setFormError("");
      await addItem(itemName, itemImage);
      handleClose();
    } catch (error) {
      setFormError("No se pudo guardar el producto. Intenta de nuevo.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Filtrar inventario basado en búsqueda
  const filteredInventory = inventory.filter((item) =>
    `${item.name} ${item.id}`.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <ThemeProvider theme={theme}>
      <Box
        width="100vw"
        height="100vh"
        display="flex"
        flexDirection="column"
        alignItems="center"
        padding={3}
      >
        <Typography variant="h3" component="div" sx={{ marginBottom: 2 }}>
          Azul&apos;s Shop
        </Typography>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          width="100%"
          maxWidth="800px"
        >
          <TextField
            variant="outlined"
            placeholder="Buscar ítems..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ flex: 1 }}
          />
          <Tooltip title="Obtener sugerencias de recetas">
            <IconButton
              color="primary"
              onClick={() => fetchRecipeSuggestions(inventory)}
              disabled={recipeLoading || inventory.length === 0}
            >
              {recipeLoading ? <CircularProgress size={20} /> : <LightbulbIcon />}
            </IconButton>
          </Tooltip>
        </Stack>
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpen}
          sx={{ marginTop: 2 }} // Ajuste del margen para separar el botón
        >
          Add New Item
        </Button>

        <Grid
          container
          spacing={2}
          justifyContent="center"
          sx={{ marginTop: 2, maxWidth: "1000px" }}
        >
          {filteredInventory.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.name}>
              <Card>
                <CardContent>
                  <Typography variant="h5" component="div">
                    {item.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cantidad: {item.quantity}
                  </Typography>
                  {item.imageURL && (
                    <Image
                      src={item.imageURL}
                      alt={item.name}
                      width={600}
                      height={400}
                      unoptimized
                      style={{ width: "100%", height: "auto" }}
                    />
                  )}
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => changeItemQuantity(item.id, 1)}
                  >
                    Add
                  </Button>
                  <Button
                    size="small"
                    color="secondary"
                    onClick={() => changeItemQuantity(item.id, -1)}
                  >
                    Remove
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Modal for adding items */}
        <Modal open={open} onClose={handleClose}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 400,
              bgcolor: "background.paper",
              borderRadius: 1,
              boxShadow: 24,
              p: 4,
            }}
          >
            <Typography variant="h6" component="h2" gutterBottom>
              Add New Item
            </Typography>
            {formError && (
              <Alert severity="error" sx={{ marginBottom: 2 }}>
                {formError}
              </Alert>
            )}
            <TextField
              label="Item Name"
              variant="outlined"
              fullWidth
              margin="normal"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              error={Boolean(formError)}
            />
            <Stack spacing={2} marginTop={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setUploadOption("upload")}
              >
                Upload Image
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setUploadOption("take")}
              >
                Take Photo
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setUploadOption("auto")}
              >
                Auto Detect
              </Button>
            </Stack>
            {uploadOption === "upload" && (
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ marginTop: 16 }}
              />
            )}
            {uploadOption === "take" && (
              <>
                <Box
                  sx={{
                    position: "relative",
                    height: "240px",
                    width: "100%",
                    border: "1px solid #ccc",
                    marginTop: 2,
                  }}
                >
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    width="100%"
                    height="100%"
                  />
                  {capturing && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleCapture}
                      sx={{
                        position: "absolute",
                        bottom: 16,
                        left: "50%",
                        transform: "translateX(-50%)",
                      }}
                    >
                      Capture
                    </Button>
                  )}
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setCapturing(!capturing)}
                  sx={{ marginTop: 2 }}
                >
                  {capturing ? "Stop Capturing" : "Start Capturing"}
                </Button>
              </>
            )}
            {uploadOption === "auto" && (
              <Box>
                <Typography variant="body1" gutterBottom>
                  {detectedName || "No item detected yet."}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAutoDetect}
                  disabled={!itemImage || detectLoading}
                >
                  {detectLoading ? "Detecting..." : "Detect Item"}
                </Button>
              </Box>
            )}
            {imagePreview && (
              <Box sx={{ marginTop: 2 }}>
                <Image
                  src={imagePreview}
                  alt="Preview"
                  width={1200}
                  height={900}
                  unoptimized
                  style={{ width: "100%", height: "auto" }}
                />
              </Box>
            )}
            <Stack direction="row" spacing={2} marginTop={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={submitLoading}
              >
                {submitLoading ? "Saving..." : "Add Item"}
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleClose}
              >
                Cancel
              </Button>
            </Stack>
          </Box>
        </Modal>

        {/* Suggestions Section */}
        {recipeSuggestions.length > 0 && (
          <Box sx={{ marginTop: 4 }}>
            <Typography variant="h6" component="div">
              Recipe Suggestions
            </Typography>
            <Stack spacing={2} marginTop={2}>
              {recipeSuggestions.map((recipe, index) => (
                <Card key={index} variant="outlined">
                  <CardContent>
                    <Typography variant="body1">{recipe}</Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Box>
        )}
      </Box>
    </ThemeProvider>
  );
}
