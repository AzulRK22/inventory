import { NextResponse } from "next/server";
import { createInventoryItem, getInventoryState } from "@/lib/server/inventory-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const state = await getInventoryState();
    return NextResponse.json(state);
  } catch (error) {
    console.error("Inventory GET error:", error);
    return NextResponse.json(
      { error: error.message || "Inventory could not be loaded." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { itemName, itemCategory, imageDataUrl } = await request.json();

    if (!itemName?.trim()) {
      return NextResponse.json(
        { error: "Product name is required." },
        { status: 400 }
      );
    }

    const item = await createInventoryItem({
      itemName,
      itemCategory,
      imageDataUrl,
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Inventory POST error:", error);
    return NextResponse.json(
      { error: error.message || "The product could not be created." },
      { status: 400 }
    );
  }
}
