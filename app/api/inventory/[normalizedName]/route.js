import { NextResponse } from "next/server";
import {
  changeInventoryItemQuantity,
  deleteInventoryItem,
  updateInventoryItem,
} from "@/lib/server/inventory-store";

export const runtime = "nodejs";

export async function PUT(request, { params }) {
  try {
    const { itemName, itemCategory, imageUrl, imageDataUrl } = await request.json();

    if (!itemName?.trim()) {
      return NextResponse.json(
        { error: "El nombre del producto es obligatorio." },
        { status: 400 }
      );
    }

    const item = await updateInventoryItem(params.normalizedName, {
      itemName,
      itemCategory,
      imageUrl,
      imageDataUrl,
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Inventory PUT error:", error);
    return NextResponse.json(
      { error: error.message || "No se pudo actualizar el producto." },
      { status: 400 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { delta } = await request.json();

    if (typeof delta !== "number" || Number.isNaN(delta)) {
      return NextResponse.json(
        { error: "Se necesita un cambio numerico de cantidad." },
        { status: 400 }
      );
    }

    const item = await changeInventoryItemQuantity(params.normalizedName, delta);

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Inventory PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "No se pudo actualizar la cantidad." },
      { status: 400 }
    );
  }
}

export async function DELETE(_request, { params }) {
  try {
    const item = await deleteInventoryItem(params.normalizedName);
    return NextResponse.json({ item });
  } catch (error) {
    console.error("Inventory DELETE error:", error);
    return NextResponse.json(
      { error: error.message || "No se pudo eliminar el producto." },
      { status: 400 }
    );
  }
}
