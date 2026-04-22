import { NextResponse } from "next/server";
import vision from "@google-cloud/vision";

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
    const detectedName = labels
      .slice(0, 5)
      .map((label) => label.description)
      .filter(Boolean)
      .join(", ");

    return NextResponse.json({
      detectedName: detectedName || "No se pudo detectar el nombre.",
    });
  } catch (error) {
    console.error("Vision API error:", error);
    return NextResponse.json(
      { error: "No se pudo procesar la imagen." },
      { status: 500 }
    );
  }
}
