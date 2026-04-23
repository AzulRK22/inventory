import { NextResponse } from "next/server";
import OpenAI from "openai";
import { CATEGORY_OPTIONS, getSuggestedDetection } from "@/lib/inventory";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: "La imagen es obligatoria para detectar el producto." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Falta configurar OPENAI_API_KEY en el servidor." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_VISION_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 300,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Analiza fotos de productos para inventario. Responde solo con JSON valido que incluya suggestedName, suggestedCategory y suggestions. suggestedCategory debe ser una de: ${CATEGORY_OPTIONS.join(
            ", "
          )}. suggestions debe ser un arreglo corto de nombres posibles en español.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Identifica el producto principal de esta imagen para registrarlo en un inventario de hogar.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    const modelSuggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions.filter(Boolean)
      : [];
    const fallbackDetection = getSuggestedDetection([
      parsed.suggestedName || "",
      ...modelSuggestions,
    ]);
    const topLabels = modelSuggestions.slice(0, 6).map((label) => ({
      description: label,
      score: 1,
    }));

    return NextResponse.json({
      detectedName:
        parsed.suggestedName || fallbackDetection.suggestedName || "No se pudo detectar el nombre.",
      suggestedName: parsed.suggestedName || fallbackDetection.suggestedName,
      suggestedCategory:
        parsed.suggestedCategory ||
        fallbackDetection.suggestedCategory ||
        "Other",
      suggestions:
        modelSuggestions.length > 0
          ? modelSuggestions
          : fallbackDetection.suggestions,
      labels: topLabels,
    });
  } catch (error) {
    console.error("Vision replacement API error:", error);
    return NextResponse.json(
      { error: error?.message || "No se pudo procesar la imagen." },
      { status: 500 }
    );
  }
}
