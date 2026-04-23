import { NextResponse } from "next/server";
import OpenAI from "openai";
import { CATEGORY_OPTIONS, getSuggestedDetection } from "@/lib/inventory";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: "An image is required to detect a product." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing on the server." },
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
          content: `Analyze product photos for inventory management. Reply only with valid JSON including suggestedName, suggestedCategory, and suggestions. suggestedCategory must be one of: ${CATEGORY_OPTIONS.join(
            ", "
          )}. suggestions must be a short array of plausible product names in English.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Identify the main product in this image so it can be saved to a household inventory.",
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
        parsed.suggestedName || fallbackDetection.suggestedName || "The product name could not be detected.",
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
      { error: error?.message || "The image could not be processed." },
      { status: 500 }
    );
  }
}
