"use client";

import { useState, useCallback } from "react";
import { getRecipeSuggestions } from "@/lib/ai";

export function useRecipeSuggestions() {
  const [recipeSuggestions, setRecipeSuggestions] = useState([]);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeError, setRecipeError] = useState("");

  const fetchRecipeSuggestions = useCallback(async (items) => {
    try {
      setRecipeLoading(true);
      setRecipeError("");
      setRecipeSuggestions([]);
      const recipes = await getRecipeSuggestions(items);
      setRecipeSuggestions(recipes);
    } catch (error) {
      console.error("Error fetching recipe suggestions:", error);
      setRecipeError(
        error.message || "Recipe suggestions could not be generated."
      );
    } finally {
      setRecipeLoading(false);
    }
  }, []);

  return {
    recipeSuggestions,
    recipeLoading,
    recipeError,
    fetchRecipeSuggestions,
  };
}
