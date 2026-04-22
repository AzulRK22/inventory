import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { items } = await request.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Se necesita al menos un ingrediente." },
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
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Devuelve recetas practicas en JSON valido. Responde solo con un objeto JSON con la clave recipes. Cada receta debe incluir title, servings, time, summary y steps como arreglo de strings. Escribe todo en español.",
        },
        {
          role: "user",
          content: `Genera 3 recetas modernas y realistas usando solamente o mayormente estos ingredientes: ${items.join(
            ", "
          )}.`,
        },
      ],
      max_tokens: 700,
      temperature: 0.8,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "";
    const parsed = JSON.parse(content);
    const recipes = Array.isArray(parsed.recipes) ? parsed.recipes : [];

    return NextResponse.json({ recipes });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "No se pudieron generar sugerencias de recetas." },
      { status: 500 }
    );
  }
}
