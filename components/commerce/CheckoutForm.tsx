'use client'
/**
 * Afrekenformulier.
 *
 * ── Waarom niet `Form.tsx` hergebruiken ───────────────────────────────────────────────────────
 * Dat component rendert een formulier uit `content/forms.json` en post naar het formulier-endpoint van
 * het CMS. Afrekenen heeft adresvalidatie, verzendmethoden die het totaal veranderen, en een
 * doorverwijzing naar Mollie. Dat in de JSON-gestuurde renderer proppen zou beide slechter maken.
 *
 * Wat we WEL overnemen: de opmaakklassen (`.form`, `.form-field`, `.form-error`) en de
 * statusmachine `idle → sending → error`, zodat het aanvoelt als de rest van de site.
 *
 * ── Het bedrag ────────────────────────────────────────────────────────────────────────────────
 * `expectedTotalCents` gaat mee als CONTROLE, niet als opdracht. Rekent het CMS een ander bedrag uit
 * (prijs of voorraad gewijzigd tijdens het invullen), dan komt er 409 terug en zien we het nieuwe
 * totaal — er wordt nooit stilzwijgend iets anders afgerekend.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * INLOGGEN IS EEN AANBOD, NOOIT EEN DREMPEL
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Bovenaan staat één blok: ingelogd → wie je bent plus je opgeslagen adressen; niet ingelogd → de
 * uitnodiging om in te loggen, met daaronder het gewone formulier dat al zichtbaar en bruikbaar is. Een
 * bezoeker die geen account wil, hoeft dus NIETS te doen: hij vult zijn adres in en rekent af als gast.
 *
 * Dat is een bewuste keuze en geen luiheid. Verplicht inloggen bij het afrekenen is een van de
 * bekendste manieren om een verkoop te verliezen — de bezoeker heeft al gekozen wat hij wil en krijgt
 * dan een formulier dat niets met zijn aankoop te maken heeft. Vandaar: inloggen levert gemak op
 * (adres automatisch ingevuld, bestelling in je account), maar het pad zonder account blijft
 * onaangetast.
 *
 * ── De adresvelden staan in state, niet in de DOM ─────────────────────────────────────────────
 * Ze waren `defaultValue`-velden (ongecontroleerd). Dat werkt zolang alleen de bezoeker typt, maar het
 * kiezen van een opgeslagen adres moet ze VULLEN — en een `defaultValue` verandert na de eerste
 * weergave niets meer. Vandaar één `address`-object in state als bron voor zowel de velden als het
 * verzoek naar de winkelwagen.
 */
import * as React from 'react'
import { useRouter } from 'next/navigation'

import { formatMoneySafe, deliveryEstimate, taxIsIncluded } from '@/lib/commerce/format'
import type { Address, Cart, Customer, CustomerAddress, ShippingMethod } from '@/lib/commerce/types'
import type { ShopUIStrings } from '@/lib/types'

import { AuthForm } from './AuthForm'

type Status = 'idle' | 'saving' | 'redirecting' | 'error'

/** Leeg adres — ook de vertrekpositie voor een gast. */
const EMPTY_ADDRESS: Required<Address> = {
  firstName: '',
  lastName: '',
  company: '',
  street: '',
  houseNumber: '',
  houseNumberAddition: '',
  postalCode: '',
  city: '',
  country: 'NL',
  phone: '',
}

/** Adresboek-item → de velden van dit formulier (zonder `id`, `label` en `type`). */
const toFormAddress = (a: CustomerAddress | undefined): Required<Address> => ({
  ...EMPTY_ADDRESS,
  firstName: a?.firstName ?? '',
  lastName: a?.lastName ?? '',
  company: a?.company ?? '',
  street: a?.street ?? '',
  houseNumber: a?.houseNumber ?? '',
  houseNumberAddition: a?.houseNumberAddition ?? '',
  postalCode: a?.postalCode ?? '',
  city: a?.city ?? '',
  country: a?.country ?? 'NL',
  phone: a?.phone ?? '',
})

/** Korte weergave van een opgeslagen adres, voor de keuzelijst. */
const addressSummary = (a: CustomerAddress): string =>
  [
    a.label,
    [a.firstName, a.lastName].filter(Boolean).join(' '),
    [a.street, a.houseNumber, a.houseNumberAddition].filter(Boolean).join(' '),
    [a.postalCode, a.city].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .join(' · ')

export function CheckoutForm({
  initialCart,
  methods,
  ui,
  customer = null,
  addresses = [],
}: {
  initialCart: Cart
  methods: ShippingMethod[]
  ui: ShopUIStrings
  /** De ingelogde klant, of `null` bij een gast. */
  customer?: Customer | null
  /** Adresboek van de ingelogde klant. Leeg bij een gast. */
  addresses?: CustomerAddress[]
}) {
  const router = useRouter()
  const [cart, setCart] = React.useState(initialCart)
  const [status, setStatus] = React.useState<Status>('idle')
  const [message, setMessage] = React.useState('')
  const [shippingMethods, setShippingMethods] = React.useState(methods)
  const [selectedMethod, setSelectedMethod] = React.useState<string>(
    initialCart.shippingMethodId ? String(initialCart.shippingMethodId) : '',
  )
  const [showLogin, setShowLogin] = React.useState(false)

  /*
   * E-mailadres. Volgorde: wat al in de winkelwagen staat (de bezoeker vulde het eerder in), anders het
   * adres van de ingelogde klant. Voor een gast blijft het leeg.
   */
  const [email, setEmail] = React.useState(initialCart.email ?? customer?.email ?? '')

  /**
   * Welk opgeslagen adres gekozen is; `''` = zelf invullen.
   *
   * Standaard het eerste adres uit het boek: wie een adres heeft opgeslagen, wil vrijwel altijd dáár
   * bezorgd hebben. Hij kan altijd op "nieuw adres" klikken.
   */
  const [selectedAddressId, setSelectedAddressId] = React.useState<string>(
    addresses.length ? String(addresses[0].id) : '',
  )
  const [address, setAddress] = React.useState<Required<Address>>(
    addresses.length ? toFormAddress(addresses[0]) : EMPTY_ADDRESS,
  )
  /** Het ingevulde adres bewaren in het adresboek? Alleen zinvol voor een ingelogde klant. */
  const [saveAddressToAccount, setSaveAddressToAccount] = React.useState(addresses.length === 0)

  /**
   * Idempotency-sleutel, één keer per formulier-instantie.
   *
   * Blijft gelijk bij opnieuw proberen na een fout: zo levert een tweede poging dezelfde bestelling op
   * in plaats van een tweede. Alleen bij een echt nieuwe afrekenpoging (nieuwe pagina) is hij anders.
   */
  const idempotencyKey = React.useMemo(
    () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    [],
  )

  const money = (cents: number) => formatMoneySafe(cents, cart.currency)

  // Zit de btw al in de getoonde bedragen? Bepaalt het woord én de plek van de btw-regel.
  const taxIncluded = taxIsIncluded(cart)
  const taxRow =
    cart.taxCents > 0 ? (
      <div className="summary-row summary-row--muted">
        <span>{taxIncluded ? ui.taxIncluded : ui.tax}</span>
        <span>{money(cart.taxCents)}</span>
      </div>
    ) : null

  const setField =
    (field: keyof Required<Address>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.value
      setAddress((a) => ({ ...a, [field]: value }))
      /*
       * Zodra de bezoeker zélf iets aanpast, is dit niet meer "het opgeslagen adres". De keuzelijst
       * springt daarom naar "nieuw adres" — anders staat er een adres geselecteerd dat niet meer
       * overeenkomt met wat er in de velden staat, en dat is precies het moment waarop iemand op een
       * verkeerd adres laat bezorgen.
       */
      if (selectedAddressId) setSelectedAddressId('')
    }

  /** Een opgeslagen adres kiezen vult alle velden in één keer. */
  function pickAddress(id: string) {
    setSelectedAddressId(id)
    if (!id) {
      setAddress(EMPTY_ADDRESS)
      return
    }
    const found = addresses.find((a) => String(a.id) === id)
    if (!found) return
    const next = toFormAddress(found)
    setAddress(next)
    // Ander land → andere verzendmethoden en verzendkosten.
    if (next.country !== address.country) void onCountryChange(next.country)
  }

  /** Adres opslaan en de winkelwagen laten herberekenen (verzendkosten hangen van het land af). */
  async function saveAddressOnCart(): Promise<Cart | null> {
    const res = await fetch('/api/commerce/cart', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        email,
        shippingAddress: address,
        shippingMethodId: selectedMethod || null,
      }),
    })
    const body = (await res.json().catch(() => null)) as { ok?: boolean; data?: { cart?: Cart } } | null
    return body?.ok ? (body.data?.cart ?? null) : null
  }

  /**
   * Verzendmethoden opnieuw ophalen als het land wijzigt.
   *
   * ══════════════════════════════════════════════════════════════════════════════════════════════
   * WAAROM HIER MEER MEEGAAT DAN HET SUBTOTAAL
   * ══════════════════════════════════════════════════════════════════════════════════════════════
   * Het tarief in deze lijst moet HETZELFDE zijn als wat de prijsmotor straks rekent, anders
   * verandert het bedrag tussen kiezen en betalen. Twee dingen ontbraken:
   *
   *  - **de korting.** Een drempel voor gratis verzending wordt door het CMS getoetst aan het
   *    subtotaal NA korting. Werd alleen het subtotaal meegestuurd, dan stond er "Gratis" bij een
   *    winkelwagen die de drempel na korting niet haalde — en kwamen de verzendkosten er bij het
   *    kiezen alsnog bij.
   *  - **het gewicht.** Bij een gewichtsstaffel bepaalt dat het tarief. Er ging niets mee, dus rekende
   *    het CMS met 0 gram en toonde de lijst het GOEDKOOPSTE staffeltarief, waarna de prijsmotor het
   *    echte, hogere tarief pakte.
   *
   * Beide waarden komen uit de winkelwagen zelf (`totalWeightGrams` geeft het CMS mee), dus ze zijn
   * per definitie dezelfde getallen waarmee daar gerekend wordt.
   */
  async function onCountryChange(country: string) {
    const params = new URLSearchParams({
      country,
      subtotalCents: String(cart.subtotalCents),
      discountCents: String(cart.discountCents),
      weightGrams: String(cart.totalWeightGrams ?? 0),
    })
    const res = await fetch(`/api/commerce/shipping?${params.toString()}`, { credentials: 'same-origin' })
    const body = (await res.json().catch(() => null)) as
      | { ok?: boolean; data?: { methods?: ShippingMethod[] } }
      | null
    if (body?.ok) {
      const next = body.data?.methods ?? []
      setShippingMethods(next)
      // Gekozen methode bestaat niet meer voor dit land → keuze wissen.
      if (!next.some((m) => String(m.id) === selectedMethod)) setSelectedMethod('')
    }
  }

  async function onMethodChange(id: string) {
    setSelectedMethod(id)
    const res = await fetch('/api/commerce/cart', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ shippingMethodId: id || null }),
    })
    const body = (await res.json().catch(() => null)) as { ok?: boolean; data?: { cart?: Cart } } | null
    if (body?.ok && body.data?.cart) setCart(body.data.cart)
  }

  /**
   * Het adres in het adresboek zetten. Best-effort: mislukt het, dan gaat het afrekenen gewoon door —
   * een bestelling tegenhouden omdat een adres niet bewaard kon worden, zou de verkeerde afweging zijn.
   */
  async function storeAddressInAccount(): Promise<void> {
    try {
      await fetch('/api/commerce/account/addresses', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(address),
      })
    } catch {
      // stil
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('saving')
    setMessage('')

    const form = e.currentTarget

    // Eerst adres en e-mail vastleggen; dat herberekent ook de verzendkosten.
    const saved = await saveAddressOnCart()
    if (!saved) {
      setStatus('error')
      setMessage(ui.genericError)
      return
    }
    setCart(saved)

    // Ingelogd en gevraagd om te bewaren? Dan nu, vóór de doorverwijzing naar Mollie — daarna komt de
    // bezoeker niet meer op deze pagina terug.
    if (customer && saveAddressToAccount && !selectedAddressId) await storeAddressInAccount()

    // Dan afrekenen, met het bedrag dat de bezoeker NU ziet als controle.
    const res = await fetch('/api/commerce/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        expectedTotalCents: saved.totalCents,
        customerNote: String(new FormData(form).get('customerNote') ?? ''),
        idempotencyKey,
      }),
    })

    const body = (await res.json().catch(() => null)) as
      | {
          ok?: boolean
          error?: string
          code?: string
          data?: { checkoutUrl?: string | null; alreadyPaid?: boolean }
        }
      | null

    if (!body?.ok) {
      setStatus('error')
      if (body?.code === 'PRICE_CHANGED') {
        setMessage('Het totaalbedrag is gewijzigd. Controleer je bestelling en probeer het opnieuw.')
        router.refresh()
      } else if (body?.code === 'OUT_OF_STOCK') {
        setMessage('Niet alles is nog op voorraad. Pas je winkelwagen aan.')
        router.refresh()
      } else if (body?.code === 'PAYMENT_STATUS_UNKNOWN') {
        /*
         * De betaalprovider was even niet te bereiken om een eerdere poging na te gaan. Het CMS opent
         * dan bewust geen tweede betaling — die zou dubbel kunnen afrekenen. Zijn eigen boodschap
         * doorgeven: die zegt dat opnieuw proberen helpt, en dat is hier het juiste advies.
         */
        setMessage(body?.error ?? ui.genericError)
      } else {
        setMessage(body?.error ?? ui.genericError)
      }
      return
    }

    /*
     * Waar de bezoeker naartoe gaat. Normaal de betaalpagina van Mollie; was de vorige poging op deze
     * winkelwagen al betaald, dan geeft de proxy hier de bedankpagina van die bestelling terug. Voor
     * dit component is dat hetzelfde: één URL om naartoe te sturen.
     */
    const url = body.data?.checkoutUrl
    if (!url) {
      setStatus('error')
      setMessage(ui.genericError)
      return
    }

    // `assign` zodat de terugknop naar de winkel wijst.
    setStatus('redirecting')
    window.location.assign(url)
  }

  const busy = status === 'saving' || status === 'redirecting'

  return (
    <>
      {/* ── Wie ben je? Ingelogd, of het aanbod om in te loggen ───────────────────────────────── */}
      {customer ? (
        <div className="checkout-identity checkout-identity--known">
          <p>
            {ui.loggedInAs} <strong>{customer.email}</strong>
          </p>
        </div>
      ) : (
        <div className="checkout-identity">
          <div className="checkout-identity-head">
            <p>
              <strong>{ui.checkoutLoginPrompt}</strong> {ui.checkoutLoginText}
            </p>
            <button
              className="btn btn-outline"
              onClick={() => setShowLogin((v) => !v)}
              type="button"
            >
              {showLogin ? ui.cancel : ui.login}
            </button>
          </div>

          {showLogin && (
            /*
             * Na een geslaagde inlog de pagina opnieuw laden in plaats van de state bijwerken: het
             * afrekenformulier hangt aan server-side gegevens (klant, adresboek, en de winkelwagen die
             * intussen aan het account is gekoppeld). Die alle drie client-side nabouwen zou drie kansen
             * zijn om iets te missen; één herlaadslag is hier goedkoop en altijd juist.
             */
            <AuthForm compact mode="login" onSuccess={() => window.location.reload()} ui={ui} />
          )}

          <p className="checkout-identity-guest">{ui.continueAsGuest}</p>
        </div>
      )}

      <form className="form checkout-grid" noValidate onSubmit={onSubmit}>
        <div className="checkout-main">
          <fieldset className="checkout-step">
            <legend>{ui.contactDetails}</legend>
            <div className="form-field">
              <label className="form-label" htmlFor="email">
                {ui.email}
              </label>
              <input
                autoComplete="email"
                id="email"
                name="email"
                onChange={(e) => setEmail(e.target.value)}
                required
                type="email"
                value={email}
              />
            </div>
          </fieldset>

          <fieldset className="checkout-step">
            <legend>{ui.shippingAddress}</legend>

            {/* Opgeslagen adressen van een ingelogde klant: kiezen vult de velden hieronder. */}
            {addresses.length > 0 && (
              <div className="saved-addresses">
                {addresses.map((a) => (
                  <label
                    className={`ship-option${selectedAddressId === String(a.id) ? ' ship-option--active' : ''}`}
                    key={String(a.id)}
                  >
                    <input
                      checked={selectedAddressId === String(a.id)}
                      name="savedAddress"
                      onChange={() => pickAddress(String(a.id))}
                      type="radio"
                      value={String(a.id)}
                    />
                    <span className="ship-option-body">
                      <span className="ship-option-name">{addressSummary(a)}</span>
                    </span>
                  </label>
                ))}
                <label className={`ship-option${selectedAddressId === '' ? ' ship-option--active' : ''}`}>
                  <input
                    checked={selectedAddressId === ''}
                    name="savedAddress"
                    onChange={() => pickAddress('')}
                    type="radio"
                    value=""
                  />
                  <span className="ship-option-body">
                    <span className="ship-option-name">{ui.newAddress}</span>
                  </span>
                </label>
              </div>
            )}

            <div className="address-grid">
              <div className="form-field">
                <label className="form-label" htmlFor="firstName">
                  {ui.firstName}
                </label>
                <input
                  autoComplete="given-name"
                  id="firstName"
                  name="firstName"
                  onChange={setField('firstName')}
                  required
                  type="text"
                  value={address.firstName}
                />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="lastName">
                  {ui.lastName}
                </label>
                <input
                  autoComplete="family-name"
                  id="lastName"
                  name="lastName"
                  onChange={setField('lastName')}
                  required
                  type="text"
                  value={address.lastName}
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="company">
                {ui.company}
              </label>
              <input
                autoComplete="organization"
                id="company"
                name="company"
                onChange={setField('company')}
                type="text"
                value={address.company}
              />
            </div>

            {/* Huisnummer en toevoeging LOS van de straat: PostNL en DHL vragen die apart aan, en met
                één adresregel gaan bezorgingen mis. */}
            <div className="address-grid address-grid--street">
              <div className="form-field">
                <label className="form-label" htmlFor="street">
                  {ui.street}
                </label>
                <input
                  autoComplete="address-line1"
                  id="street"
                  name="street"
                  onChange={setField('street')}
                  required
                  type="text"
                  value={address.street}
                />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="houseNumber">
                  {ui.houseNumber}
                </label>
                <input
                  id="houseNumber"
                  name="houseNumber"
                  onChange={setField('houseNumber')}
                  required
                  type="text"
                  value={address.houseNumber}
                />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="houseNumberAddition">
                  {ui.houseNumberAddition}
                </label>
                <input
                  id="houseNumberAddition"
                  name="houseNumberAddition"
                  onChange={setField('houseNumberAddition')}
                  type="text"
                  value={address.houseNumberAddition}
                />
              </div>
            </div>

            <div className="address-grid address-grid--city">
              <div className="form-field">
                <label className="form-label" htmlFor="postalCode">
                  {ui.postalCode}
                </label>
                <input
                  autoComplete="postal-code"
                  id="postalCode"
                  name="postalCode"
                  onChange={setField('postalCode')}
                  required
                  type="text"
                  value={address.postalCode}
                />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="city">
                  {ui.city}
                </label>
                <input
                  autoComplete="address-level2"
                  id="city"
                  name="city"
                  onChange={setField('city')}
                  required
                  type="text"
                  value={address.city}
                />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="country">
                  {ui.country}
                </label>
                <select
                  id="country"
                  name="country"
                  onChange={(e) => {
                    setField('country')(e)
                    void onCountryChange(e.target.value)
                  }}
                  value={address.country}
                >
                  <option value="NL">Nederland</option>
                  <option value="BE">België</option>
                  <option value="DE">Duitsland</option>
                </select>
              </div>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="phone">
                {ui.phone}
              </label>
              <input
                autoComplete="tel"
                id="phone"
                name="phone"
                onChange={setField('phone')}
                type="tel"
                value={address.phone}
              />
            </div>

            {/* Alleen voor een ingelogde klant die een NIEUW adres invult; bij een gekozen adres uit het
                boek valt er niets te bewaren. */}
            {customer && !selectedAddressId && (
              <label className="form-check">
                <input
                  checked={saveAddressToAccount}
                  onChange={(e) => setSaveAddressToAccount(e.target.checked)}
                  type="checkbox"
                />
                <span>{ui.saveAddressToAccount}</span>
              </label>
            )}
          </fieldset>

          <fieldset className="checkout-step">
            <legend>{ui.shippingMethod}</legend>
            {shippingMethods.length === 0 ? (
              <p className="form-error">Voor dit land is nog geen verzendmethode beschikbaar.</p>
            ) : (
              <div className="ship-options">
                {shippingMethods.map((m) => (
                  <label
                    className={`ship-option${selectedMethod === String(m.id) ? ' ship-option--active' : ''}`}
                    key={String(m.id)}
                  >
                    <input
                      checked={selectedMethod === String(m.id)}
                      name="shippingMethod"
                      onChange={() => void onMethodChange(String(m.id))}
                      type="radio"
                      value={String(m.id)}
                    />
                    <span className="ship-option-body">
                      <span className="ship-option-name">{m.name}</span>
                      {m.description && <span className="ship-option-desc">{m.description}</span>}
                      {deliveryEstimate(m.estimatedDaysMin, m.estimatedDaysMax) && (
                        <span className="ship-option-days">
                          {deliveryEstimate(m.estimatedDaysMin, m.estimatedDaysMax)}
                        </span>
                      )}
                    </span>
                    <span className="ship-option-price">
                      {m.priceCents === 0 ? 'Gratis' : money(m.priceCents)}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>

          <div className="form-field">
            <label className="form-label" htmlFor="customerNote">
              {ui.orderNote}
            </label>
            <textarea id="customerNote" name="customerNote" rows={3} />
          </div>
        </div>

        <aside className="summary checkout-summary">
          <h2>{ui.orderSummary}</h2>
          <ul className="summary-lines">
            {cart.lines.map((l) => (
              <li key={l.id}>
                <span>
                  {l.quantity}× {l.title}
                  {l.variantTitle ? ` (${l.variantTitle})` : ''}
                </span>
                <span>{money(l.lineTotalCents)}</span>
              </li>
            ))}
          </ul>

          {/* Btw onder het totaal als hij er al in zit, erboven als hij erbovenop komt — zo telt de
              kolom op tot het bedrag dat de bezoeker straks betaalt. Zie `taxIsIncluded`. */}
          <div className="summary-row">
            <span>
              {ui.subtotal}
              {taxIncluded && cart.taxCents > 0 ? ` (${ui.taxInclusive})` : ''}
            </span>
            <span>{money(cart.subtotalCents)}</span>
          </div>
          {cart.discountCents > 0 && (
            <div className="summary-row summary-row--discount">
              <span>{ui.discount}</span>
              <span>−{money(cart.discountCents)}</span>
            </div>
          )}
          <div className="summary-row">
            <span>{ui.shipping}</span>
            <span>{selectedMethod ? money(cart.shippingCents) : ui.shippingCalculated}</span>
          </div>
          {!taxIncluded && taxRow}
          <div className="summary-row summary-row--total">
            <span>{ui.total}</span>
            <span>{money(cart.totalCents)}</span>
          </div>
          {taxIncluded && taxRow}

          {status === 'error' && (
            <p className="form-error" role="alert">
              {message}
            </p>
          )}

          <button className="btn btn-gold summary-cta" disabled={busy || !selectedMethod} type="submit">
            {/*
              Niet "Bezig…": tussen deze klik en de betaalpagina van Mollie zit een serververzoek dat de
              bestelling aanmaakt. Staat er niet dát hij doorgestuurd wordt, dan klikt een bezoeker
              opnieuw — en dat is precies de knop waar dubbelklikken geld kost.
            */}
            {busy ? ui.startingPayment : ui.payNow}
          </button>
          <p className="checkout-secure">Je betaalt veilig via Mollie.</p>
        </aside>
      </form>
    </>
  )
}
