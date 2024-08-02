"use client";
import { useState, useEffect, useRef } from "react";
import { firestore, storage } from "@/firebase";
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
} from "@mui/material";
import {
  collection,
  query,
  getDoc,
  getDocs,
  deleteDoc,
  setDoc,
  doc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Webcam from "react-webcam";
import SearchIcon from "@mui/icons-material/Search";
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
  const webcamRef = useRef(null);

  // Obtener la URL del servidor desde las variables de entorno
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const googleVisionApiKey = process.env.NEXT_PUBLIC_GOOGLE_VISION_API_KEY;
  const openAiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

  // Actualizar el inventario
  const updateInventory = async () => {
    try {
      const snapshot = query(collection(firestore, "inventory"));
      const docs = await getDocs(snapshot);
      const inventoryList = [];
      docs.forEach((doc) => {
        inventoryList.push({
          name: doc.id,
          ...doc.data(),
        });
      });
      setInventory(inventoryList);
    } catch (error) {
      console.error("Error updating inventory:", error);
    }
  };

  // Agregar un ítem
  const addItem = async (item, imageFile) => {
    try {
      const docRef = doc(collection(firestore, "inventory"), item);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const { quantity } = docSnap.data();
        await setDoc(docRef, { quantity: quantity + 1 });
      } else {
        let imageURL = "";
        if (imageFile) {
          const imageRef = ref(storage, `inventory/${item}`);
          await uploadBytes(imageRef, imageFile);
          imageURL = await getDownloadURL(imageRef);
        }
        await setDoc(docRef, { quantity: 1, imageURL });
      }
      await updateInventory();
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  // Eliminar un ítem
  const removeItem = async (item) => {
    try {
      const docRef = doc(collection(firestore, "inventory"), item);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const { quantity } = docSnap.data();
        if (quantity === 1) {
          await deleteDoc(docRef);
        } else {
          await setDoc(docRef, { quantity: quantity - 1 });
        }
      }
      await updateInventory();
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  // Inicializar el inventario al cargar el componente
  useEffect(() => {
    updateInventory();
  }, []);

  // Manejar la apertura y cierre del modal
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setItemName("");
    setItemImage(null);
    setImagePreview(null);
    setUploadOption("upload");
    setCapturing(false);
    setDetectedName("");
    setOpen(false);
  };

  // Manejar el cambio de imagen (carga desde el dispositivo)
  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setItemImage(e.target.files[0]);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Manejar la captura de imagen desde la cámara
  const handleCapture = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      fetch(imageSrc)
        .then((res) => res.blob())
        .then((blob) => {
          setItemImage(blob);
          setImagePreview(imageSrc);
          setCapturing(false);
        });
    }
  };

  // Detectar el nombre de la imagen usando Google Cloud Vision API
  const handleAutoDetect = async () => {
    try {
      if (!itemImage) return;

      const reader = new FileReader();
      reader.readAsDataURL(itemImage);
      reader.onload = async () => {
        const base64Image = reader.result.split(",")[1]; // Obtener solo el contenido Base64

        const visionResponse = await fetch(
          `https://vision.googleapis.com/v1/images:annotate?key=${googleVisionApiKey}`,
          {
            method: "POST",
            body: JSON.stringify({
              requests: [
                {
                  image: {
                    content: base64Image,
                  },
                  features: [
                    {
                      type: "LABEL_DETECTION",
                      maxResults: 10, // Obtener más resultados para mejor precisión
                    },
                  ],
                },
              ],
            }),
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const data = await visionResponse.json();

        if (data.responses && data.responses.length > 0) {
          const labels = data.responses[0].labelAnnotations;
          if (labels && labels.length > 0) {
            // Obtener las mejores coincidencias
            const topLabels = labels.slice(0, 3); // Obtener las 3 mejores etiquetas
            const detectedLabels = topLabels
              .map((label) => label.description)
              .join(", ");
            setDetectedName(detectedLabels || "No se pudo detectar el nombre.");
          } else {
            setDetectedName("No se pudo detectar el nombre.");
          }
        } else {
          setDetectedName("No se pudo detectar el nombre.");
        }
      };
    } catch (error) {
      console.error("Error detecting image:", error);
    }
  };

  // Obtener sugerencias de recetas usando OpenAI API
  const fetchRecipeSuggestions = async (inventoryList) => {
    try {
      const items = inventoryList.map((item) => item.name).join(", ");

      const response = await fetch(
        "https://api.openai.com/v1/engines/davinci-codex/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openAiApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: `Suggest recipes using the following ingredients: ${items}.`,
            max_tokens: 150,
          }),
        }
      );

      const data = await response.json();
      setRecipeSuggestions(
        data.choices[0].text
          .split("\n")
          .filter((recipe) => recipe.trim() !== "")
      );
    } catch (error) {
      console.error("Error fetching recipe suggestions:", error);
    }
  };

  // Filtrar inventario basado en búsqueda
  const filteredInventory = inventory.filter((item) =>
    item.name.toLowerCase().includes(searchText.toLowerCase())
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
          Azul's Shop
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
            >
              <LightbulbIcon />
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
                  {item.imageURL && (
                    <img
                      src={item.imageURL}
                      alt={item.name}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  )}
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => removeItem(item.name)}
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
            <TextField
              label="Item Name"
              variant="outlined"
              fullWidth
              margin="normal"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
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
                  disabled={!itemImage}
                >
                  Detect Item
                </Button>
              </Box>
            )}
            {imagePreview && (
              <Box sx={{ marginTop: 2 }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ width: "100%" }}
                />
              </Box>
            )}
            <Stack direction="row" spacing={2} marginTop={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  addItem(itemName, itemImage);
                  handleClose();
                }}
              >
                Add Item
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
