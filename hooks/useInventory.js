"use client";

import { useInventoryData } from "@/hooks/useInventoryData";
import { useInventoryForm } from "@/hooks/useInventoryForm";

export function useInventory() {
  const inventoryData = useInventoryData();
  const inventoryForm = useInventoryForm({
    inventory: inventoryData.inventory,
    updateInventory: inventoryData.updateInventory,
    setInventoryStatus: inventoryData.setInventoryStatus,
  });

  return {
    ...inventoryData,
    ...inventoryForm,
  };
}
