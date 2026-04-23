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
    itemName: row.item_name || "Product",
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
    throw new Error("The image format is invalid.");
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
    throw new Error("The image could not be uploaded to Supabase Storage.");
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
      `Inventory could not be loaded from Supabase. ${details}`.trim()
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
    throw new Error("That product already exists in inventory.");
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
    throw new Error("The product could not be created in Supabase.");
  }

  const { error: movementError } = await supabase.from("inventory_movements").insert(
    buildMovement({
      itemName: nextItem.name,
      normalizedName,
      action: "created",
      quantityChange: 1,
      quantityAfter: 1,
      category: nextItem.category,
      note: "Product added to inventory.",
    })
  );

  if (movementError) {
    throw new Error("The inventory movement could not be recorded.");
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
    throw new Error("The product to update was not found.");
  }

  const nextNormalizedName = normalizeItemName(updates.itemName);

  if (nextNormalizedName !== previousNormalizedName) {
    const { data: existingItem } = await supabase
      .from("inventory_items")
      .select("normalized_name")
      .eq("normalized_name", nextNormalizedName)
      .maybeSingle();

    if (existingItem) {
      throw new Error("That product already exists in inventory.");
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
    throw new Error("The product could not be updated in Supabase.");
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
      throw new Error("The product history could not be synchronized.");
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
      note: "Product details updated.",
    })
  );

  if (movementError) {
    throw new Error("The inventory movement could not be recorded.");
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
    throw new Error("The product to update was not found.");
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
    throw new Error("The quantity could not be updated in Supabase.");
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
          ? "Manual stock increase."
          : "Manual stock decrease.",
    })
  );

  if (movementError) {
    throw new Error("The inventory movement could not be recorded.");
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
    throw new Error("The product to delete was not found.");
  }

  if (currentItem.image_url) {
    await deleteInventoryImage(currentItem.image_url);
  }

  const { error: deleteError } = await supabase
    .from("inventory_items")
    .delete()
    .eq("normalized_name", normalizedName);

  if (deleteError) {
    throw new Error("The product could not be deleted from Supabase.");
  }

  const { error: movementError } = await supabase.from("inventory_movements").insert(
    buildMovement({
      itemName: currentItem.name,
      normalizedName: currentItem.normalized_name,
      action: "deleted",
      quantityChange: -Number(currentItem.quantity ?? 0),
      quantityAfter: 0,
      category: currentItem.category,
      note: "Product removed from inventory.",
    })
  );

  if (movementError) {
    throw new Error("The inventory movement could not be recorded.");
  }

  return mapInventoryRow(currentItem);
}
