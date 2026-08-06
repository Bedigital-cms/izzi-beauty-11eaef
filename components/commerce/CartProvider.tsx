'use client'
/**
 * Winkelwagenstatus in de browser.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * WAAROM DIT EEN CLIENT-ISLAND IS EN GEEN SERVER-COMPONENT
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * De header staat op ÉLKE pagina, ook op de ~90 statisch gegenereerde contentpagina's. Zou de header
 * de winkelwagen-cookie server-side lezen, dan markeert `cookies()` de hele boom als dynamisch en is
 * de site in één keer niet meer statisch. Dat is de kernkwaliteit van deze template en die geven we
 * niet op voor een getalletje bij een icoon.
 *
 * Dus: de badge rendert server-side NIETS en haalt zijn aantal na hydratie op. Gevolg is een korte
 * flits waarin er geen getal staat; dat vangen we op met een vaste breedte, zodat er geen layout-
 * verschuiving is. Dat is de juiste ruil.
 *
 * De provider bewaart alleen het AANTAL en de regels voor de weergave — nooit bedragen om mee te
 * rekenen. Elk totaal komt van de server.
 */
import * as React from 'react'

import type { Cart } from '@/lib/commerce/types'

type CartState = {
  cart: Cart | null
  itemCount: number
  loading: boolean
  /** Laatste foutmelding, bijv. "niet meer op voorraad". */
  error: string | null
}

type CartActions = {
  /** Voegt een variant toe en werkt de status bij. */
  add: (variantId: string | number, quantity?: number) => Promise<boolean>
  setQuantity: (lineId: string, quantity: number) => Promise<void>
  remove: (lineId: string) => Promise<void>
  applyDiscount: (code: string | null) => Promise<void>
  /** Haalt de winkelwagen opnieuw op (na een adreswijziging of vanaf een andere pagina). */
  refresh: () => Promise<void>
  /**
   * Vergeet de winkelwagen. Alleen na een BETAALDE bestelling: het CMS heeft de wagen dan omgezet en
   * de badge hoort meteen leeg te zijn (zie PaymentStatus.tsx).
   */
  clear: () => Promise<void>
  clearError: () => void
}

const CartContext = React.createContext<(CartState & CartActions) | null>(null)

/** Alles op deze site praat met de eigen API-routes, nooit rechtstreeks met het CMS. */
const API = '/api/commerce/cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<CartState>({
    cart: null,
    itemCount: 0,
    loading: true,
    error: null,
  })

  /** Verwerkt een antwoord van de eigen API-route. */
  const applyResponse = React.useCallback(async (res: Response): Promise<boolean> => {
    const body = (await res.json().catch(() => null)) as
      | { ok?: boolean; data?: { cart?: Cart | null; itemCount?: number }; error?: string }
      | null

    if (!body?.ok) {
      setState((s) => ({ ...s, loading: false, error: body?.error ?? 'Er ging iets mis.' }))
      return false
    }

    const cart = body.data?.cart ?? null
    setState({
      cart,
      itemCount: cart?.itemCount ?? body.data?.itemCount ?? 0,
      loading: false,
      error: null,
    })
    return true
  }, [])

  /** Alleen het aantal ophalen — genoeg voor de badge, en het lichtste verzoek. */
  const loadCount = React.useCallback(async () => {
    try {
      const res = await fetch(`${API}?countOnly=1`, { credentials: 'same-origin' })
      const body = (await res.json().catch(() => null)) as
        | { ok?: boolean; data?: { itemCount?: number } }
        | null
      setState((s) => ({ ...s, itemCount: body?.data?.itemCount ?? 0, loading: false }))
    } catch {
      // Stil falen: een niet-werkende badge mag de pagina niet stukmaken.
      setState((s) => ({ ...s, loading: false }))
    }
  }, [])

  const refresh = React.useCallback(async () => {
    try {
      const res = await fetch(API, { credentials: 'same-origin' })
      await applyResponse(res)
    } catch {
      setState((s) => ({ ...s, loading: false }))
    }
  }, [applyResponse])

  // Na hydratie het aantal ophalen. Bewust NIET de hele winkelwagen: op een productpagina heb je
  // alleen het getal nodig, en dit verzoek zit in het kritieke pad van de eerste weergave.
  React.useEffect(() => {
    void loadCount()
  }, [loadCount])

  const add = React.useCallback(
    async (variantId: string | number, quantity = 1): Promise<boolean> => {
      setState((s) => ({ ...s, error: null }))
      try {
        const res = await fetch(API, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ variantId, quantity }),
        })
        return await applyResponse(res)
      } catch {
        setState((s) => ({ ...s, error: 'Er ging iets mis. Probeer het opnieuw.' }))
        return false
      }
    },
    [applyResponse],
  )

  const setQuantity = React.useCallback(
    async (lineId: string, quantity: number) => {
      try {
        const res = await fetch(API, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ lineId, quantity }),
        })
        await applyResponse(res)
      } catch {
        setState((s) => ({ ...s, error: 'Er ging iets mis. Probeer het opnieuw.' }))
      }
    },
    [applyResponse],
  )

  const remove = React.useCallback(
    async (lineId: string) => {
      try {
        const res = await fetch(`${API}?lineId=${encodeURIComponent(lineId)}`, {
          method: 'DELETE',
          credentials: 'same-origin',
        })
        await applyResponse(res)
      } catch {
        setState((s) => ({ ...s, error: 'Er ging iets mis. Probeer het opnieuw.' }))
      }
    },
    [applyResponse],
  )

  const applyDiscount = React.useCallback(
    async (code: string | null) => {
      try {
        const res = await fetch(API, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ discountCode: code }),
        })
        await applyResponse(res)
      } catch {
        setState((s) => ({ ...s, error: 'Er ging iets mis. Probeer het opnieuw.' }))
      }
    },
    [applyResponse],
  )

  const clear = React.useCallback(async () => {
    // Eerst de weergave leegmaken: de bezoeker staat op de bedankpagina en hoort daar geen gevulde
    // badge te zien terwijl het verzoek nog loopt.
    setState({ cart: null, itemCount: 0, loading: false, error: null })
    try {
      await fetch(`${API}?action=reset`, { method: 'POST', credentials: 'same-origin' })
    } catch {
      // Stil falen: bij het volgende ophalen ziet deze route de omgezette wagen toch en ruimt hij op.
    }
  }, [])

  const value = React.useMemo(
    () => ({
      ...state,
      add,
      setQuantity,
      remove,
      applyDiscount,
      refresh,
      clear,
      clearError: () => setState((s) => ({ ...s, error: null })),
    }),
    [state, add, setQuantity, remove, applyDiscount, refresh, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

/**
 * Winkelwagen-context. Geeft een veilige lege staat terug als de provider ontbreekt.
 *
 * Dat laatste is nodig omdat de provider alleen gemount wordt bij tenants MET een webshop: een
 * component dat er per ongeluk buiten staat, mag geen crash geven.
 */
export function useCart(): CartState & CartActions {
  const ctx = React.useContext(CartContext)
  if (ctx) return ctx
  return {
    cart: null,
    itemCount: 0,
    loading: false,
    error: null,
    add: async () => false,
    setQuantity: async () => {},
    remove: async () => {},
    applyDiscount: async () => {},
    refresh: async () => {},
    clear: async () => {},
    clearError: () => {},
  }
}
