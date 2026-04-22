import { NextResponse } from "next/server";
import vision from "@google-cloud/vision";
import { getSuggestedDetection } from "@/lib/inventory";

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

    const visionClient = new vision.ImageAnnotatorClient();

    const [result] = await visionClient.labelDetection({
      image: {
        content: imageBase64,
      },
    });

    const labels = result.labelAnnotations ?? [];
    const topLabels = labels
      .slice(0, 6)
      .map((label) => ({
        description: label.description || "",
        score: label.score || 0,
      }))
      .filter((label) => label.description);
    const { suggestedName, suggestedCategory, suggestions } =
      getSuggestedDetection(topLabels.map((label) => label.description));

    return NextResponse.json({
      detectedName: suggestedName || "No se pudo detectar el nombre.",
      suggestedName,
      suggestedCategory,
      suggestions,
      labels: topLabels,
    });
  } catch (error) {
    console.error("Vision API error:", error);
    return NextResponse.json(
      { error: "No se pudo procesar la imagen." },
      { status: 500 }
    );
  }
}
