import { randomUUID } from "crypto";
import { buildItemPayload, normalizeItemName } from "@/lib/inventory";
import { getInventoryBucketName, getSupabaseServerClient } from "@/lib/server/supabase";

function mapInventoryRow(row) {
  return {
    id: row.id || row.normalized_name,
    name: row.name,
    normalizedName: row.normalized_name,
    quantity: Number(row.quantity ?? 0),
    imageUrl: row.image_url || "",
    category: row.category || "Other",
    updatedAt: row.updated_at || null,
  };
}

function mapMovementRow(row) {
  return {
    id: row.id,
    itemName: row.item_name || "Producto",
    normalizedName: row.normalized_name || "",
    action: row.action || "updated",
    quantityChange: Number(row.quantity_change ?? 0),
    quantityAfter:
      row.quantity_after === null || row.quantity_after === undefined
        ? null
        : Number(row.quantity_after),
    category: row.category || "Other",
    createdAt: row.created_at || null,
    note: row.note || "",
  };
}

function buildMovement({
  itemName,
  normalizedName,
  action,
  quantityChange,
  quantityAfter,
  category,
  note,
}) {
  return {
    id: randomUUID(),
    item_name: itemName,
    normalized_name: normalizedName,
    action,
    quantity_change: quantityChange,
    quantity_after: quantityAfter,
    category,
    note,
  };
}

function parseDataUrl(dataUrl) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);

  if (!match) {
    return null;
  }

  return {
    mimeType: match[1],
    base64: match[2],
  };
}

function getFileExtension(mimeType) {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("gif")) return "gif";
  return "jpg";
}

function getStoragePathFromPublicUrl(publicUrl) {
  if (!publicUrl) {
    return "";
  }

  try {
    const bucket = getInventoryBucketName();
    const url = new URL(publicUrl);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const index = url.pathname.indexOf(marker);

    if (index === -1) {
      return "";
    }

    return decodeURIComponent(url.pathname.slice(index + marker.length));
  } catch {
    return "";
  }
}

async function uploadInventoryImage(normalizedName, imageInput, previousImageUrl = "") {
  if (!imageInput) {
    return previousImageUrl || "";
  }

  if (!imageInput.startsWith("data:")) {
    return imageInput;
  }

  const parsed = parseDataUrl(imageInput);

  if (!parsed) {
    throw new Error("La imagen no tiene un formato valido.");
  }

  const supabase = getSupabaseServerClient();
  const bucket = getInventoryBucketName();
  const extension = getFileExtension(parsed.mimeType);
  const filePath = `inventory/${normalizedName}-${Date.now()}.${extension}`;
  const fileBuffer = Buffer.from(parsed.base64, "base64");

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileBuffer, {
      contentType: parsed.mimeType,
      upsert: true,
    });

  if (uploadError) {
    throw new Error("No se pudo subir la imagen a Supabase Storage.");
  }

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);

  if (previousImageUrl) {
    await deleteInventoryImage(previousImageUrl);
  }

  return publicData.publicUrl;
}

export async function deleteInventoryImage(imageUrl) {
  const storagePath = getStoragePathFromPublicUrl(imageUrl);

  if (!storagePath) {
    return;
  }

  const supabase = getSupabaseServerClient();
  const bucket = getInventoryBucketName();

  await supabase.storage.from(bucket).remove([storagePath]);
}

export async function getInventoryState() {
  const supabase = getSupabaseServerClient();

  const [{ data: inventoryRows, error: inventoryError }, { data: movementRows, error: movementError }] =
    await Promise.all([
      supabase
        .from("inventory_items")
        .select("*")
        .order("updated_at", { ascending: false }),
      supabase
        .from("inventory_movements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(40),
    ]);

  if (inventoryError || movementError) {
    const details = [inventoryError, movementError]
      .filter(Boolean)
      .map((error) => error.message || JSON.stringify(error))
      .join(" | ");

    throw new Error(
      `No se pudo cargar el inventario desde Supabase. ${details}`.trim()
    );
  }

  return {
    inventory: (inventoryRows || []).map(mapInventoryRow),
    movementHistory: (movementRows || []).map(mapMovementRow),
  };
}

export async function createInventoryItem({ itemName, itemCategory, imageDataUrl }) {
  const supabase = getSupabaseServerClient();
  const normalizedName = normalizeItemName(itemName);

  const { data: existingItem } = await supabase
    .from("inventory_items")
    .select("normalized_name")
    .eq("normalized_name", normalizedName)
    .maybeSingle();

  if (existingItem) {
    throw new Error("Ese producto ya existe en el inventario.");
  }

  const imageUrl = await uploadInventoryImage(normalizedName, imageDataUrl);
  const nextItem = buildItemPayload({
    itemName,
    normalizedName,
    category: itemCategory,
    quantity: 1,
    imageUrl,
  });

  const { data: insertedItem, error: itemError } = await supabase
    .from("inventory_items")
    .insert({
      name: nextItem.name,
      normalized_name: nextItem.normalizedName,
      quantity: nextItem.quantity,
      image_url: nextItem.imageUrl,
      category: nextItem.category,
      updated_at: nextItem.updatedAt,
    })
    .select("*")
    .single();

  if (itemError) {
    throw new Error("No se pudo crear el producto en Supabase.");
  }

  const { error: movementError } = await supabase.from("inventory_movements").insert(
    buildMovement({
      itemName: nextItem.name,
      normalizedName,
      action: "created",
      quantityChange: 1,
      quantityAfter: 1,
      category: nextItem.category,
      note: "Producto agregado al inventario.",
    })
  );

  if (movementError) {
    throw new Error("No se pudo registrar el movimiento del inventario.");
  }

  return mapInventoryRow(insertedItem);
}

export async function updateInventoryItem(previousNormalizedName, updates) {
  const supabase = getSupabaseServerClient();
  const { data: previousItem, error: previousItemError } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("normalized_name", previousNormalizedName)
    .maybeSingle();

  if (previousItemError || !previousItem) {
    throw new Error("No se encontro el producto a actualizar.");
  }

  const nextNormalizedName = normalizeItemName(updates.itemName);

  if (nextNormalizedName !== previousNormalizedName) {
    const { data: existingItem } = await supabase
      .from("inventory_items")
      .select("normalized_name")
      .eq("normalized_name", nextNormalizedName)
      .maybeSingle();

    if (existingItem) {
      throw new Error("Ese producto ya existe en el inventario.");
    }
  }

  const imageUrl = await uploadInventoryImage(
    nextNormalizedName,
    updates.imageDataUrl || updates.imageUrl || "",
    previousItem.image_url || ""
  );

  const nextItem = buildItemPayload({
    itemName: updates.itemName,
    normalizedName: nextNormalizedName,
    category: updates.itemCategory || previousItem.category,
    quantity: previousItem.quantity,
    imageUrl,
  });

  const { data: updatedItem, error: updateError } = await supabase
    .from("inventory_items")
    .update({
      name: nextItem.name,
      normalized_name: nextItem.normalizedName,
      quantity: nextItem.quantity,
      image_url: nextItem.imageUrl,
      category: nextItem.category,
      updated_at: nextItem.updatedAt,
    })
    .eq("normalized_name", previousNormalizedName)
    .select("*")
    .single();

  if (updateError) {
    throw new Error("No se pudo actualizar el producto en Supabase.");
  }

  if (nextNormalizedName !== previousNormalizedName) {
    const { error: movementRenameError } = await supabase
      .from("inventory_movements")
      .update({
        normalized_name: nextNormalizedName,
        item_name: nextItem.name,
      })
      .eq("normalized_name", previousNormalizedName);

    if (movementRenameError) {
      throw new Error("No se pudo sincronizar el historial del producto.");
    }
  }

  const { error: movementError } = await supabase.from("inventory_movements").insert(
    buildMovement({
      itemName: nextItem.name,
      normalizedName: nextNormalizedName,
      action: "updated",
      quantityChange: 0,
      quantityAfter: nextItem.quantity,
      category: nextItem.category,
      note: "Datos del producto actualizados.",
    })
  );

  if (movementError) {
    throw new Error("No se pudo registrar el movimiento del inventario.");
  }

  return mapInventoryRow(updatedItem);
}

export async function changeInventoryItemQuantity(normalizedName, delta) {
  const supabase = getSupabaseServerClient();
  const { data: currentItem, error: currentItemError } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("normalized_name", normalizedName)
    .maybeSingle();

  if (currentItemError || !currentItem) {
    throw new Error("No se encontro el producto a actualizar.");
  }

  const nextQuantity = Math.max(0, Number(currentItem.quantity ?? 0) + delta);

  const { data: updatedItem, error: updateError } = await supabase
    .from("inventory_items")
    .update({
      quantity: nextQuantity,
      updated_at: new Date().toISOString(),
    })
    .eq("normalized_name", normalizedName)
    .select("*")
    .single();

  if (updateError) {
    throw new Error("No se pudo actualizar la cantidad en Supabase.");
  }

  const { error: movementError } = await supabase.from("inventory_movements").insert(
    buildMovement({
      itemName: updatedItem.name,
      normalizedName: updatedItem.normalized_name,
      action: delta > 0 ? "incremented" : "decremented",
      quantityChange: delta,
      quantityAfter: nextQuantity,
      category: updatedItem.category,
      note:
        delta > 0
          ? "Entrada manual de inventario."
          : "Salida manual de inventario.",
    })
  );

  if (movementError) {
    throw new Error("No se pudo registrar el movimiento del inventario.");
  }

  return mapInventoryRow(updatedItem);
}

export async function deleteInventoryItem(normalizedName) {
  const supabase = getSupabaseServerClient();
  const { data: currentItem, error: currentItemError } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("normalized_name", normalizedName)
    .maybeSingle();

  if (currentItemError || !currentItem) {
    throw new Error("No se encontro el producto a eliminar.");
  }

  if (currentItem.image_url) {
    await deleteInventoryImage(currentItem.image_url);
  }

  const { error: deleteError } = await supabase
    .from("inventory_items")
    .delete()
    .eq("normalized_name", normalizedName);

  if (deleteError) {
    throw new Error("No se pudo eliminar el producto en Supabase.");
  }

  const { error: movementError } = await supabase.from("inventory_movements").insert(
    buildMovement({
      itemName: currentItem.name,
      normalizedName: currentItem.normalized_name,
      action: "deleted",
      quantityChange: -Number(currentItem.quantity ?? 0),
      quantityAfter: 0,
      category: currentItem.category,
      note: "Producto eliminado del inventario.",
    })
  );

  if (movementError) {
    throw new Error("No se pudo registrar el movimiento del inventario.");
  }

  return mapInventoryRow(currentItem);
}
