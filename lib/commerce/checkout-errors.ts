/**
 * User-facing checkout errors.
 *
 * The API returns stable codes (`ZERO_PAYMENT`, `PRICE_CHANGED`, …). The storefront maps those
 * onto ShopUIStrings so an English page never shows a Dutch server string.
 */
import type { ShopUIStrings } from '@/lib/types'

export const CHECKOUT_ERROR_UI_KEYS = {
  ZERO_PAYMENT: 'zeroPaymentBlocked',
  PRICE_CHANGED: 'priceChanged',
  OUT_OF_STOCK: 'checkoutOutOfStock',
  PAYMENT_STATUS_UNKNOWN: 'paymentStatusUnknown',
} as const

export type CheckoutErrorCode = keyof typeof CHECKOUT_ERROR_UI_KEYS

export function checkoutErrorLabel(code: string | undefined, ui: ShopUIStrings): string {
  if (code && code in CHECKOUT_ERROR_UI_KEYS) {
    return ui[CHECKOUT_ERROR_UI_KEYS[code as CheckoutErrorCode]]
  }
  return ui.genericError
}
