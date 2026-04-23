import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { items } = await request.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one ingredient is required." },
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
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Return practical recipes in valid JSON. Reply only with a JSON object containing the key recipes. Each recipe must include title, servings, time, summary, and steps as an array of strings. Write everything in English.",
        },
        {
          role: "user",
          content: `Generate 3 modern, realistic recipes using only or mostly these ingredients: ${items.join(
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
      { error: "Recipe suggestions could not be generated." },
      { status: 500 }
    );
  }
}
