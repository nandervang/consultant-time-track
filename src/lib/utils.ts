import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { InvoiceItem } from "@/types/invoice"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts the quantity from an invoice item correctly for both hourly and fixed price items
 */
export function getInvoiceItemQuantity(item: InvoiceItem): number {
  if (item.hours) {
    // Hourly item - quantity is stored in hours field
    return item.hours;
  } else if (item.fixed_amount && item.fixed_amount > 0) {
    // Fixed price item - calculate quantity from total_amount / unit_price
    return item.total_amount / item.fixed_amount;
  } else {
    // Fallback for items without proper pricing
    return 1;
  }
}

/**
 * Gets the unit rate for an invoice item
 */
export function getInvoiceItemUnitRate(item: InvoiceItem): number {
  return item.hourly_rate || item.fixed_amount || 0;
}

/**
 * Determines if an invoice item is hourly or fixed price
 */
export function getInvoiceItemType(item: InvoiceItem): 'hourly' | 'fixed' {
  return item.hours ? 'hourly' : 'fixed';
}
