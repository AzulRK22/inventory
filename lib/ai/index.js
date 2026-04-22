export const fileToBase64 = (file) =>
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

export const detectItemFromImage = async (imageFile) => {
  const response = await fetch("/api/vision", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      imageBase64: await fileToBase64(imageFile),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "No se pudo detectar el producto.");
  }

  return data;
};

export const getRecipeSuggestions = async (items) => {
  const response = await fetch("/api/recipes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ items }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "No se pudieron obtener sugerencias.");
  }

  return data.recipes || [];
};
