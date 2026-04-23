"use client";

import { useCallback, useEffect, useState } from "react";
import { requestInventory } from "@/hooks/useInventoryApi";
import { clearMutationFlag, setMutationFlag } from "@/lib/inventory/mutation-state";

export function useInventoryData() {
  const [inventory, setInventory] = useState([]);
  const [movementHistory, setMovementHistory] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [movementLoading, setMovementLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState("");
  const [inventoryStatus, setInventoryStatus] = useState("");
  const [itemMutationState, setItemMutationState] = useState({});
  const [pendingDeleteItem, setPendingDeleteItem] = useState(null);

  const updateInventory = useCallback(async () => {
    try {
      setInventoryLoading(true);
      setMovementLoading(true);
      setInventoryError("");

      const data = await requestInventory("/api/inventory", {
        method: "GET",
      });

      setInventory(data.inventory || []);
      setMovementHistory(data.movementHistory || []);
    } catch (error) {
      console.error("Error updating inventory:", error);
      setInventoryError("Inventory could not be loaded.");
    } finally {
      setInventoryLoading(false);
      setMovementLoading(false);
    }
  }, []);

  useEffect(() => {
    updateInventory();
  }, [updateInventory]);

  useEffect(() => {
    if (!inventoryStatus && !inventoryError) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setInventoryStatus("");
      setInventoryError("");
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [inventoryStatus, inventoryError]);

  const changeItemQuantity = useCallback(
    async (item, delta) => {
      setItemMutationState((current) =>
        setMutationFlag(current, item.normalizedName, "quantity", true)
      );

      try {
        const data = await requestInventory(`/api/inventory/${item.normalizedName}`, {
          method: "PATCH",
          body: JSON.stringify({ delta }),
        });
        const nextQuantity = data.item?.quantity ?? item.quantity;

        setInventoryStatus(`"${item.name}" quantity updated to ${nextQuantity}.`);
        await updateInventory();
      } catch (error) {
        console.error("Error changing quantity:", error);
        setInventoryError("Quantity could not be updated.");
      } finally {
        setItemMutationState((current) =>
          clearMutationFlag(current, item.normalizedName, "quantity")
        );
      }
    },
    [updateInventory]
  );

  const requestDeleteItem = useCallback((item) => {
    setPendingDeleteItem(item);
  }, []);

  const cancelDeleteItem = useCallback(() => {
    setPendingDeleteItem(null);
  }, []);

  const confirmDeleteItem = useCallback(async () => {
    if (!pendingDeleteItem) {
      return;
    }

    const targetItem = pendingDeleteItem;
    setItemMutationState((current) =>
      setMutationFlag(current, targetItem.normalizedName, "delete", true)
    );

    try {
      await requestInventory(`/api/inventory/${targetItem.normalizedName}`, {
        method: "DELETE",
      });

      setInventoryStatus(`"${targetItem.name}" was removed from inventory.`);
      setPendingDeleteItem(null);
      await updateInventory();
    } catch (error) {
      console.error("Error deleting item:", error);
      setInventoryError("The product could not be deleted.");
    } finally {
      setItemMutationState((current) =>
        clearMutationFlag(current, targetItem.normalizedName, "delete")
      );
    }
  }, [pendingDeleteItem, updateInventory]);

  return {
    inventory,
    movementHistory,
    inventoryLoading,
    movementLoading,
    inventoryError,
    inventoryStatus,
    itemMutationState,
    pendingDeleteItem,
    setInventoryError,
    setInventoryStatus,
    updateInventory,
    changeItemQuantity,
    requestDeleteItem,
    cancelDeleteItem,
    confirmDeleteItem,
  };
}
