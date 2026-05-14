/**
 * Cart Inventory Validation Hook
 * Validates all items in cart against current inventory
 * Returns detailed validation results with specific errors
 */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CartItem } from "@/contexts/CartContext";

export interface InventoryValidationResult {
  isValid: boolean;
  outOfStockItems: CartItem[];
  lowStockItems: Array<CartItem & { available: number }>;
  removedItems: CartItem[];
  errors: string[];
}

export const useCartInventoryValidation = (items: CartItem[]) => {
  const [validation, setValidation] = useState<InventoryValidationResult>({
    isValid: true,
    outOfStockItems: [],
    lowStockItems: [],
    removedItems: [],
    errors: [],
  });
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      setValidation({
        isValid: true,
        outOfStockItems: [],
        lowStockItems: [],
        removedItems: [],
        errors: [],
      });
      return;
    }

    const validateInventory = async () => {
      setIsChecking(true);
      try {
        const outOfStock: CartItem[] = [];
        const lowStock: Array<CartItem & { available: number }> = [];
        const errors: string[] = [];

        for (const item of items) {
          // Skip if no variant_id
          if (!item.variant_id) {
            errors.push(`${item.name}: No variant information available`);
            continue;
          }

          try {
            const { data: variant, error } = await supabase
              .from("product_variants")
              .select("stock_quantity")
              .eq("id", item.variant_id)
              .maybeSingle();

            if (error) {
              errors.push(`${item.name}: Unable to check stock - ${error.message}`);
              continue;
            }

            if (!variant) {
              outOfStock.push(item);
              errors.push(
                `${item.name} (${item.color}, ${item.size}): This variant is no longer available`
              );
              continue;
            }

            const available = variant.stock_quantity;

            // Check if out of stock
            if (available === 0) {
              outOfStock.push(item);
              errors.push(
                `${item.name} (${item.color}, ${item.size}): Out of stock`
              );
            }
            // Check if requested quantity exceeds available
            else if (available < item.quantity) {
              lowStock.push({
                ...item,
                available,
              });
              errors.push(
                `${item.name} (${item.color}, ${item.size}): You have ${item.quantity} in your bag but only ${available} ${available === 1 ? "is" : "are"} available`
              );
            }
          } catch (err) {
            errors.push(
              `${item.name}: Unexpected error - ${err instanceof Error ? err.message : "Unknown"}`
            );
          }
        }

        const isValid = outOfStock.length === 0 && lowStock.length === 0;

        setValidation({
          isValid,
          outOfStockItems: outOfStock,
          lowStockItems: lowStock,
          removedItems: outOfStock,
          errors,
        });
      } finally {
        setIsChecking(false);
      }
    };

    validateInventory();
  }, [items]);

  return {
    validation,
    isChecking,
  };
};
