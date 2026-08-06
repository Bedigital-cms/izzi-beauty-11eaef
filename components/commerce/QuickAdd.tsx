'use client'
/**
 * De knop onderaan een productkaart in het rooster.
 *
 * ── Waarom niet gewoon `AddToCart` hergebruiken ───────────────────────────────────────────────
 * `AddToCart` bevat een variantkiezer, een aantalveld en een voorraadmelding. Dat hoort op de
 * detailpagina, waar iemand een keuze maakt. In een rooster is er geen ruimte voor die keuze en is
 * de juiste actie afhankelijk van het product:
 *
 *  - één variant  → direct in de winkelwagen, zonder tussenstap;
 *  - meer varianten → naar de detailpagina, want er válT iets te kiezen;
 *  - uitverkocht  → een uitgeschakelde knop, zodat de kaart niet leeg oogt.
 *
 * ── Waarom dit een los client-component is ────────────────────────────────────────────────────
 * `ProductCard` is een server-component en blijft dat: alleen deze knop hydrateert. Zo kost een
 * rooster van 24 producten 24 kleine eilandjes in plaats van een volledig client-gerenderde pagina.
 *
 * ── Waarom de knop BUITEN de kaartlink staat ──────────────────────────────────────────────────
 * Een `<button>` in een `<a>` is ongeldige HTML en geeft in de praktijk onvoorspelbaar gedrag: de
 * browser navigeert soms alsnog. De kaart lost dat op met een overlay-link (zie `.card-link` in
 * globals.css) die het hele oppervlak bedekt behalve deze knop.
 */
import * as React from 'react'
import { useRouter } from 'next/navigation'

import type { Product } from '@/lib/commerce/types'
import type { ShopUIStrings } from '@/lib/types'

import { useCart } from './CartProvider'

/**
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * WAAROM DEZE KNOP ZIJN FOUT MOET TONEN
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Hier zat een bug die als "de webshop is helemaal stuk" werd gemeld: klikken op "In winkelwagen"
 * deed zichtbaar niets.
 *
 * De keten werkte nagemeten prima. De API antwoordde netjes met
 * `{"ok":false,"error":"Dit artikel bestaat niet (meer)."}` en status 400 — de variant-id uit een
 * gecachete pagina wees naar een product dat intussen opnieuw geïmporteerd (en dus opnieuw
 * aangemaakt) was. `CartProvider` zette die melding gewoon in zijn `error`-state.
 *
 * Alleen: deze knop LAS die state niet. Bij `ok === false` gebeurde er niets — geen melding, geen
 * kleur, niets. En een actie die stil faalt is erger dan een actie die faalt: de bezoeker klikt nog
 * eens, en nog eens, en concludeert dat de winkel niet werkt.
 *
 * `AddToCart` op de detailpagina deed het al goed (`const { add, error } = useCart()`); deze knop
 * hoorde daarin niet af te wijken.
 */
export function QuickAdd({
  product,
  ui,
  href,
}: {
  product: Product
  ui: ShopUIStrings
  href: string
}) {
  const router = useRouter()
  const { add, error, clearError } = useCart()
  const [busy, setBusy] = React.useState(false)
  const [added, setAdded] = React.useState(false)
  /*
   * Of DEZE kaart de fout mag tonen. `error` is gedeelde cart-state, dus zonder deze vlag zouden
   * alle 24 kaarten in het rooster dezelfde melding tonen zodra er één faalt.
   */
  const [failed, setFailed] = React.useState(false)

  // Alleen bij precies één variant kunnen we zonder keuze toevoegen.
  const single = product.variants.length === 1 ? product.variants[0] : null
  const needsChoice = product.variants.length > 1
  const soldOut = !product.inStock || (!needsChoice && !single?.inStock)

  React.useEffect(() => {
    if (!added) return
    const t = setTimeout(() => setAdded(false), 2000)
    return () => clearTimeout(t)
  }, [added])

  async function onAdd(e: React.MouseEvent) {
    // De kaart is één grote link; deze klik mag daar niet doorheen lekken.
    e.preventDefault()
    e.stopPropagation()
    if (!single) return

    // Een eerdere mislukte poging wissen, zodat een tweede klik niet de oude melding laat staan.
    setFailed(false)
    clearError()

    setBusy(true)
    const ok = await add(single.id, 1)
    setBusy(false)

    if (ok) {
      setAdded(true)
      // Badge en winkelwagenpagina tonen nu andere aantallen.
      router.refresh()
      return
    }

    /*
     * Mislukt. Twee dingen tegelijk, want één is niet genoeg:
     *  - de MELDING, zodat de bezoeker weet wát er aan de hand is (bijv. "Dit artikel bestaat niet
     *    (meer)" na een herimport);
     *  - `router.refresh()`, want de meest voorkomende oorzaak is een verouderde pagina. Verversen
     *    haalt de actuele producten op, waarna een tweede klik wél werkt.
     */
    setFailed(true)
    router.refresh()
  }

  if (soldOut) {
    return (
      <button className="btn btn-ghost product-card-btn" disabled type="button">
        {ui.soldOut}
      </button>
    )
  }

  // Varianten → geen directe toevoeging, maar doorsturen naar de keuze.
  if (needsChoice) {
    return (
      <button
        className="btn btn-ghost product-card-btn"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          router.push(href)
        }}
        type="button"
      >
        {ui.chooseOption}
      </button>
    )
  }

  return (
    <>
      <button
        className={`btn btn-gold product-card-btn${added ? ' product-card-btn--added' : ''}`}
        disabled={busy}
        onClick={onAdd}
        type="button"
      >
        {/* Niet `ui.loading` ("Laden…"): deze knop laadt niets, hij zet een product in de winkelwagen. */}
        {busy ? ui.addingToCart : added ? ui.addedToCart : ui.addToCart}
      </button>
      {/*
        `failed` én `error`: de vlag zorgt dat alleen de aangeklikte kaart iets toont, de tekst komt
        van de API zodat de bezoeker de échte reden ziet. `role="alert"` laat een schermlezer hem
        voorlezen — anders is een stille mislukking voor die bezoeker helemáál onzichtbaar.
      */}
      {failed && error ? (
        <p className="form-error product-card-error" role="alert">
          {error}
        </p>
      ) : null}
    </>
  )
}
