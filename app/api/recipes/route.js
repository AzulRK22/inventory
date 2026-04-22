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
            "You suggest practical recipes. Respond with a plain text list, one recipe per line, without numbering.",
        },
        {
          role: "user",
          content: `Suggest recipes using only or mostly these ingredients: ${items.join(
            ", "
          )}.`,
        },
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || "";
    const recipes = content
      .split("\n")
      .map((recipe) => recipe.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean);

    return NextResponse.json({ recipes });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "No se pudieron generar sugerencias de recetas." },
      { status: 500 }
    );
  }
}
