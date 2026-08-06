'use client'
/**
 * Adresboek van de klant: bekijken, toevoegen, wijzigen en verwijderen.
 *
 * ── Waarom de lijst hier in state staat en niet uit een router-refresh komt ────────────────────
 * Elke bewerking geeft het bijgewerkte adres terug, dus de lijst kan meteen kloppen zonder de pagina
 * opnieuw op te halen. Dat maakt het verschil bij verwijderen: met een `router.refresh()` blijft het
 * verwijderde adres nog een fractie staan, en dan denkt de bezoeker dat de knop niet werkte en klikt
 * hij nog een keer.
 *
 * ── Verwijderen vraagt om een bevestiging in het component zelf ───────────────────────────────
 * Bewust geen `window.confirm`: die staat op mobiel soms geblokkeerd en breekt de opmaak van de
 * pagina. Een tweede klik op dezelfde knop ("Weet je het zeker?") is even veilig en blijft in de stijl
 * van de site.
 */
import * as React from 'react'

import type { CustomerAddress } from '@/lib/commerce/types'
import type { ShopUIStrings } from '@/lib/types'

const API = '/api/commerce/account/addresses'

/** Leeg formulier voor een nieuw adres. */
const EMPTY: CustomerAddress = {
  id: '',
  label: '',
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

export function AddressBook({
  initial,
  ui,
  /** Maximum uit het CMS; boven dit aantal verdwijnt de knop "Adres toevoegen". */
  max = 10,
}: {
  initial: CustomerAddress[]
  ui: ShopUIStrings
  max?: number
}) {
  const [addresses, setAddresses] = React.useState<CustomerAddress[]>(initial)
  /** `null` = niets open, `'new'` = nieuw adres, anders het id dat bewerkt wordt. */
  const [editing, setEditing] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState<CustomerAddress>(EMPTY)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState('')
  /** Id waarvoor de verwijderknop op "weet je het zeker?" staat. */
  const [confirming, setConfirming] = React.useState<string | null>(null)

  const openNew = () => {
    setDraft(EMPTY)
    setEditing('new')
    setError('')
  }

  const openEdit = (address: CustomerAddress) => {
    setDraft({ ...EMPTY, ...address })
    setEditing(String(address.id))
    setError('')
  }

  const close = () => {
    setEditing(null)
    setError('')
  }

  const set = (field: keyof CustomerAddress) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setDraft((d) => ({ ...d, [field]: e.target.value }))

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError('')

    const isNew = editing === 'new'
    const body = { ...draft, ...(isNew ? {} : { id: draft.id }) }

    try {
      const res = await fetch(API, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body),
      })
      const result = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string; data?: { address?: CustomerAddress } }
        | null

      if (!result?.ok || !result.data?.address) {
        setError(result?.error ?? ui.genericError)
        setBusy(false)
        return
      }

      const saved = result.data.address
      setAddresses((list) =>
        isNew ? [saved, ...list] : list.map((a) => (String(a.id) === String(saved.id) ? saved : a)),
      )
      setEditing(null)
    } catch {
      setError(ui.genericError)
    }
    setBusy(false)
  }

  async function remove(id: string | number) {
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`${API}?id=${encodeURIComponent(String(id))}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      const result = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null
      if (!result?.ok) {
        setError(result?.error ?? ui.genericError)
        setBusy(false)
        return
      }
      setAddresses((list) => list.filter((a) => String(a.id) !== String(id)))
      setConfirming(null)
    } catch {
      setError(ui.genericError)
    }
    setBusy(false)
  }

  return (
    <div className="addressbook">
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {addresses.length === 0 && editing === null && <p className="account-empty">{ui.noAddressesYet}</p>}

      <ul className="address-list">
        {addresses.map((a) => (
          <li className="address-card" key={String(a.id)}>
            {editing === String(a.id) ? (
              <AddressFields
                busy={busy}
                draft={draft}
                onCancel={close}
                onChange={set}
                onSubmit={save}
                ui={ui}
              />
            ) : (
              <>
                {a.label && <span className="address-card-label">{a.label}</span>}
                <p className="address-card-body">
                  {[a.firstName, a.lastName].filter(Boolean).join(' ')}
                  {a.company && (
                    <>
                      <br />
                      {a.company}
                    </>
                  )}
                  <br />
                  {[a.street, a.houseNumber, a.houseNumberAddition].filter(Boolean).join(' ')}
                  <br />
                  {a.postalCode} {a.city}
                  <br />
                  {a.country}
                  {a.phone && (
                    <>
                      <br />
                      {a.phone}
                    </>
                  )}
                </p>
                <div className="address-card-actions">
                  <button className="link-button" disabled={busy} onClick={() => openEdit(a)} type="button">
                    {ui.edit}
                  </button>
                  {confirming === String(a.id) ? (
                    <>
                      <button
                        className="link-button link-button--danger"
                        disabled={busy}
                        onClick={() => void remove(a.id)}
                        type="button"
                      >
                        {ui.confirmDelete}
                      </button>
                      <button className="link-button" disabled={busy} onClick={() => setConfirming(null)} type="button">
                        {ui.cancel}
                      </button>
                    </>
                  ) : (
                    <button
                      className="link-button link-button--danger"
                      disabled={busy}
                      onClick={() => setConfirming(String(a.id))}
                      type="button"
                    >
                      {ui.deleteLabel}
                    </button>
                  )}
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      {editing === 'new' ? (
        <div className="address-card">
          <span className="address-card-label">{ui.newAddress}</span>
          <AddressFields busy={busy} draft={draft} onCancel={close} onChange={set} onSubmit={save} ui={ui} />
        </div>
      ) : (
        addresses.length < max && (
          <button className="btn btn-gold" disabled={busy} onClick={openNew} type="button">
            {ui.addAddress}
          </button>
        )
      )}
    </div>
  )
}

/**
 * Het adresformulier. Dezelfde veldindeling als bij het afrekenen — huisnummer en toevoeging LOS van
 * de straat, want PostNL en DHL vragen die apart aan.
 */
function AddressFields({
  draft,
  onChange,
  onSubmit,
  onCancel,
  busy,
  ui,
}: {
  draft: CustomerAddress
  onChange: (
    field: keyof CustomerAddress,
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onCancel: () => void
  busy: boolean
  ui: ShopUIStrings
}) {
  return (
    <form className="form address-form" noValidate onSubmit={onSubmit}>
      <div className="form-field">
        <label className="form-label" htmlFor="adr-label">
          {ui.addressLabelField}
        </label>
        <input id="adr-label" onChange={onChange('label')} type="text" value={draft.label ?? ''} />
      </div>

      <div className="address-grid">
        <div className="form-field">
          <label className="form-label" htmlFor="adr-firstName">
            {ui.firstName}
          </label>
          <input
            autoComplete="given-name"
            id="adr-firstName"
            onChange={onChange('firstName')}
            type="text"
            value={draft.firstName ?? ''}
          />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="adr-lastName">
            {ui.lastName}
          </label>
          <input
            autoComplete="family-name"
            id="adr-lastName"
            onChange={onChange('lastName')}
            type="text"
            value={draft.lastName ?? ''}
          />
        </div>
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="adr-company">
          {ui.company}
        </label>
        <input
          autoComplete="organization"
          id="adr-company"
          onChange={onChange('company')}
          type="text"
          value={draft.company ?? ''}
        />
      </div>

      <div className="address-grid address-grid--street">
        <div className="form-field">
          <label className="form-label" htmlFor="adr-street">
            {ui.street}
          </label>
          <input
            autoComplete="address-line1"
            id="adr-street"
            onChange={onChange('street')}
            required
            type="text"
            value={draft.street ?? ''}
          />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="adr-houseNumber">
            {ui.houseNumber}
          </label>
          <input
            id="adr-houseNumber"
            onChange={onChange('houseNumber')}
            required
            type="text"
            value={draft.houseNumber ?? ''}
          />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="adr-addition">
            {ui.houseNumberAddition}
          </label>
          <input
            id="adr-addition"
            onChange={onChange('houseNumberAddition')}
            type="text"
            value={draft.houseNumberAddition ?? ''}
          />
        </div>
      </div>

      <div className="address-grid address-grid--city">
        <div className="form-field">
          <label className="form-label" htmlFor="adr-postalCode">
            {ui.postalCode}
          </label>
          <input
            autoComplete="postal-code"
            id="adr-postalCode"
            onChange={onChange('postalCode')}
            required
            type="text"
            value={draft.postalCode ?? ''}
          />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="adr-city">
            {ui.city}
          </label>
          <input
            autoComplete="address-level2"
            id="adr-city"
            onChange={onChange('city')}
            required
            type="text"
            value={draft.city ?? ''}
          />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="adr-country">
            {ui.country}
          </label>
          <select id="adr-country" onChange={onChange('country')} value={draft.country ?? 'NL'}>
            <option value="NL">Nederland</option>
            <option value="BE">België</option>
            <option value="DE">Duitsland</option>
          </select>
        </div>
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="adr-phone">
          {ui.phone}
        </label>
        <input autoComplete="tel" id="adr-phone" onChange={onChange('phone')} type="tel" value={draft.phone ?? ''} />
      </div>

      <div className="form-actions">
        <button className="btn btn-gold" disabled={busy} type="submit">
          {busy ? ui.saving : ui.save}
        </button>
        <button className="btn btn-outline" disabled={busy} onClick={onCancel} type="button">
          {ui.cancel}
        </button>
      </div>
    </form>
  )
}
