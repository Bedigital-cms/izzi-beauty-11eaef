/**
 * Cookies van de webshop. **Alleen server-side** (gebruikt `next/headers`).
 *
 * ── Waarom de site zijn EIGEN cookies zet ─────────────────────────────────────────────────────
 * Het CMS staat op een ander domein. Een cookie die het CMS zet, is hier third-party en wordt
 * geblokkeerd door Safari ITP, Firefox TCP en inmiddels Chrome. De site zet daarom zelf een
 * first-party cookie met het token dat het CMS als JSON teruggaf.
 *
 * Twee details die er echt uitmaken:
 *
 *  - **`path: '/'`** — niet `/nl` of `/winkel`. De winkelwagen moet blijven bestaan als de bezoeker van
 *    taal wisselt (`/nl/winkelwagen` → `/fr/winkelwagen`) of naar een schone URL gaat. Met een taalgebonden pad
 *    zou hij bij elke taalwissel zijn winkelwagen kwijt zijn.
 *
 *  - **`sameSite: 'lax'`, niet `'strict'`** — na het betalen komt de bezoeker via een top-level
 *    redirect van mollie.com terug. Bij `strict` stuurt de browser de cookie op zo'n cross-site
 *    navigatie NIET mee, en is de winkelwagen op de bedankpagina "leeg". Dat is een echte bug die
 *    je pas in productie ziet, dus `lax` is hier geen laksheid maar noodzaak.
 */
import { cookies } from 'next/headers'

const CART_COOKIE = 'bd_cart'
const SESSION_COOKIE = 'bd_session'

const THIRTY_DAYS = 60 * 60 * 24 * 30

const baseOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
}

/** Winkelwagen-token uit de cookie, of `null`. */
export async function readCartToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(CART_COOKIE)?.value ?? null
}

export async function writeCartToken(token: string): Promise<void> {
  const store = await cookies()
  store.set(CART_COOKIE, token, { ...baseOptions, maxAge: THIRTY_DAYS })
}

export async function clearCartToken(): Promise<void> {
  const store = await cookies()
  store.set(CART_COOKIE, '', { ...baseOptions, maxAge: 0 })
}

/** Sessietoken van een ingelogde klant. */
export async function readSessionToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(SESSION_COOKIE)?.value ?? null
}

export async function writeSessionToken(token: string, expiresAt?: string): Promise<void> {
  const store = await cookies()
  // Cookie niet langer laten leven dan het token zelf: anders stuurt de browser een token mee dat
  // toch geweigerd wordt en lijkt de bezoeker ingelogd terwijl hij dat niet is.
  const maxAge = expiresAt
    ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
    : THIRTY_DAYS
  store.set(SESSION_COOKIE, token, { ...baseOptions, maxAge })
}

export async function clearSessionToken(): Promise<void> {
  const store = await cookies()
  store.set(SESSION_COOKIE, '', { ...baseOptions, maxAge: 0 })
}
