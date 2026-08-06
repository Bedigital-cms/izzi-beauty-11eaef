'use client'
/**
 * Mount de winkelwagen-context alleen bij tenants MET een webshop.
 *
 * Zonder webshop is dit een pure doorgeefluik: geen provider, geen state, geen fetch na hydratie. Zo
 * betalen de vele niet-webshop sites niets voor deze functionaliteit.
 *
 * `commerceEnabled()` leest een `NEXT_PUBLIC_`-variabele, dus die is ook in de browser beschikbaar.
 */
import { commerceEnabled } from '@/lib/commerce/config'

import { CartProvider } from './CartProvider'

export function CommerceBoundary({ children }: { children: React.ReactNode }) {
  if (!commerceEnabled()) return <>{children}</>
  return <CartProvider>{children}</CartProvider>
}
