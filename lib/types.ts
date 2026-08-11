/** Content types for the IZZI Beauty template. Kept flat + descriptive so the BE Digital CMS
 *  Content Editor (and the AI agent) can edit every field through a recursive form. */

/* ---------- shared ---------- */
export type NavChild = { label: string; url: string; tag?: string }
export type NavColumn = { heading: string; url?: string; links: NavChild[] }
export type NavItem = { label: string; url: string; columns?: NavColumn[] }
export type SocialLink = { label: string; url: string; icon: string }
export type Location = { name: string; city: string; address: string; postcode: string; phone: string; hours: string; mapUrl: string }
export type FooterLink = { label: string; url: string }
export type FooterColumn = { heading: string; links: FooterLink[] }

export type SiteContent = {
  brandName: string
  tagline: string
  /** Logo image path for the HEADER (e.g. "/media/izzi-logo.png"). Empty → the brand name is
   *  shown as a text logo instead. Set this to use an uploaded logo image. */
  logo: string
  nav: NavItem[]
  ctaLabel: string
  ctaUrl: string
  bookingUrl: string
  footer: {
    /** Logo image path for the FOOTER — separate from the header logo, so a light-on-dark variant
     *  can be uploaded for the dark footer. Empty → falls back to the header `logo`; if that is
     *  empty too the brand name is shown as text. */
    logo?: string
    about: string
    locations: Location[]
    email: string
    phone: string
    columns: FooterColumn[]
    socials: SocialLink[]
    rightsText: string
    legalLabel: string
    legalUrl: string
  }
}

/* ---------- reusable section pieces ---------- */
export type Stat = { num: string; lbl: string }
export type Feature = { icon: string; title: string; text: string }
export type Review = { stars: number; quote: string; who: string; what: string }
export type Step = { title: string; text: string }
export type Faq = { q: string; a: string }
export type CtaBlock = { script?: string; title: string; text: string; primaryLabel: string; primaryUrl: string; secondaryLabel?: string; secondaryUrl?: string }

/** A card that links to a treatment/training/other page. */
export type LinkCard = { title: string; meta?: string; text: string; image: string; url: string; linkLabel?: string }

/* ---------- landing ---------- */
export type HomeContent = {
  hero: {
    eyebrow: string
    titleLead: string
    titleEm: string
    titleTail: string
    text: string
    primaryLabel: string
    primaryUrl: string
    secondaryLabel: string
    secondaryUrl: string
    image: string
    /** Optional hero background video (e.g. "/media/video/hero.mp4"). Empty → the image is used. */
    videoUrl: string
    meta: Stat[]
  }
  reviewStrip: { text: string; linkLabel: string; linkUrl: string }
  intro: { eyebrow: string; title: string; text: string; checklist: string[]; image: string; badgeNum: string; badgeLabel: string; buttonLabel: string; buttonUrl: string }
  treatments: { eyebrow: string; title: string; text: string; items: LinkCard[]; buttonLabel: string; buttonUrl: string }
  trainings: { eyebrow: string; title: string; text: string; items: LinkCard[]; buttonLabel: string; buttonUrl: string }
  usps: { eyebrow: string; title: string; text: string; items: Feature[] }
  stats: Stat[]
  reviewsSection: { eyebrow: string; title: string; items: Review[] }
  locationsSection: { eyebrow: string; title: string; text: string }
  /** Contact section (before footer). All fields — including the contact details on the left —
   *  are edited here via the Content Editor, independent of the footer. */
  contactSection: {
    eyebrow: string
    title: string
    text: string
    email: string
    phone: string
    locations: { name: string; address: string; hours: string }[]
  }
  cta: CtaBlock
}

/* ---------- generic hub page (behandelingen, opleidingen, online-trainingen) ---------- */
export type HubContent = {
  hero: { eyebrow: string; title: string; text: string; breadcrumb: string }
  intro?: { title: string; text: string }
  groups: { heading: string; text?: string; items: LinkCard[] }[]
  cta: CtaBlock
}

/* ---------- treatment / training detail page ---------- */
export type DetailFact = { k: string; v: string }
export type DetailContent = {
  hero: { eyebrow: string; title: string; text: string; breadcrumb: string }
  image: string
  intro: string
  body: { heading: string; paragraphs: string[]; checklist?: string[] }[]
  steps?: { title: string; items: Step[] }
  faq?: { title: string; items: Faq[] }
  aside: { factsTitle: string; facts: DetailFact[]; ctaTitle: string; ctaText: string; ctaLabel: string; ctaUrl: string }
  cta: CtaBlock
}

/** A keyed collection of detail pages (services.json / trainings-detail.json). Each key is a
 *  URL slug ("powder-brows") → its DetailContent. Add a new key to publish a new detail page;
 *  the [slug] route renders it and the hub link-cards point to it. This is the canonical
 *  pattern the CMS Content Editor + AI agent use to add pages. */
export type DetailCollection = Record<string, DetailContent>

/* ---------- prijzen ---------- */
export type PriceItem = { name: string; desc?: string; amount: string }
export type PriceGroup = { heading: string; items: PriceItem[] }
export type PrijzenContent = {
  hero: { eyebrow: string; title: string; text: string; breadcrumb: string }
  groups: PriceGroup[]
  note?: string
  cta: CtaBlock
}

/* ---------- over-izzi (about) ---------- */
export type OverContent = {
  hero: { eyebrow: string; title: string; text: string; breadcrumb: string }
  story: { eyebrow: string; title: string; paragraphs: string[]; image: string; badgeNum: string; badgeLabel: string }
  values: { eyebrow: string; title: string; text: string; items: Feature[] }
  stats: Stat[]
  founder: { eyebrow: string; title: string; paragraphs: string[]; image: string; name: string; role: string }
  cta: CtaBlock
}

/* ---------- portfolio ---------- */
export type PortfolioContent = {
  hero: { eyebrow: string; title: string; text: string; breadcrumb: string }
  intro?: string
  images: string[]
  cta: CtaBlock
}

/* ---------- contact ---------- */
export type ContactContent = {
  hero: { eyebrow: string; title: string; text: string; breadcrumb: string }
  intro: { title: string; text: string }
  locations: Location[]
  bookingLabel: string
  bookingUrl: string
  cta: CtaBlock
}

/* ---------- webshop ---------- */

/**
 * Teksten en labels van de webshop — GEEN productdata.
 *
 * ⚠️ Producten, prijzen en voorraad staan NIET in dit bestand en horen er ook nooit in te komen. Die
 * leven in de CMS-database en worden per verzoek opgehaald. Reden: de Content Editor en de AI-agent
 * hebben schrijfrechten op `content/*.json`, en een prijs die een agent kan aanpassen is geen prijs.
 *
 * Wat hier WEL in staat: de kopteksten van de winkelpagina's en alle UI-labels, zodat een klant zijn
 * eigen toon kan kiezen en de teksten via het gewone vertaalproces in andere talen komen.
 */
export type ShopUIStrings = {
  /* winkel & product */
  addToCart: string
  addedToCart: string
  outOfStock: string
  soldOut: string
  /** Tekst in de ronde aanbiedingsbadge op een productkaart, bijv. "Sale!". */
  onSale: string
  from: string
  inStock: string
  onlyLeft: string
  sortBy: string
  sortNewest: string
  sortPriceAsc: string
  sortPriceDesc: string
  sortTitle: string
  allCategories: string
  categoriesTitle: string
  noCategories: string
  noProducts: string
  /** Aantal producten in een categorie, met `{n}` als plaatshouder. */
  productCount: string
  quantity: string
  chooseOption: string

  /* winkelwagen */
  cartTitle: string
  cartEmpty: string
  cartEmptyText: string
  continueShopping: string
  remove: string
  subtotal: string
  shipping: string
  shippingCalculated: string
  tax: string
  taxIncluded: string
  /**
   * Achtervoegsel bij het subtotaal wanneer de btw daar al in zit: "Subtotaal (incl. btw)".
   *
   * Zonder dat achtervoegsel stond er "Subtotaal" met daaronder een losse btw-regel, en las het
   * overzicht als een optelling die niet uitkwam. Zie `taxIsIncluded` in lib/commerce/format.ts.
   */
  taxInclusive: string
  discount: string
  discountCode: string
  discountApply: string
  discountInvalid: string
  total: string
  viewCart: string
  checkout: string

  /* afrekenen */
  checkoutTitle: string
  contactDetails: string
  email: string
  shippingAddress: string
  firstName: string
  lastName: string
  company: string
  street: string
  houseNumber: string
  houseNumberAddition: string
  postalCode: string
  city: string
  country: string
  phone: string
  shippingMethod: string
  paymentMethod: string
  orderNote: string
  orderSummary: string
  payNow: string

  /* ── Bezig-teksten ──────────────────────────────────────────────────────────────────────────
   * Wat er op een knop staat terwijl zijn actie loopt.
   *
   * ⚠️ ÉÉN LABEL PER ACTIE, GEEN GENERIEKE "Bezig…".
   * Hier stond één `processing: 'Bezig…'` voor álle knoppen: toevoegen aan de winkelwagen, opslaan,
   * inloggen, betalen. Voor de bezoeker verdwijnt daarmee precies de informatie die hij op dat moment
   * nodig heeft: waar hij op geklikt heeft en wat er nu gebeurt. Bij het afrekenen is dat het duurst —
   * "Bezig…" op de betaalknop zegt niet dat hij doorgestuurd wordt, dus klikt hij opnieuw of gaat weg.
   *
   * Een schermlezer leest de knop bovendien opnieuw voor als het label verandert; "Bezig…" is dan
   * letterlijk het enige dat hij te horen krijgt.
   *
   * Dus: benoem de actie. Nieuwe knop met een wachtstand → nieuw label hieronder, niet hergebruiken
   * wat ongeveer past.
   */
  addingToCart: string
  saving: string
  verifyingCode: string
  sendingCode: string
  loggingIn: string
  registering: string
  startingPayment: string

  /* bedankpagina & bestelling */
  thankYouTitle: string
  thankYouText: string
  paymentPending: string
  paymentPendingText: string
  paymentFailed: string
  paymentFailedText: string
  orderNumber: string
  orderDate: string
  deliveredOn: string
  orderStatus: string
  trackOrder: string
  trackingNumber: string
  viewOrder: string
  orderNotFound: string

  /* account */
  myAccount: string
  myOrders: string
  login: string
  logout: string
  register: string
  password: string
  forgotPassword: string
  noOrdersYet: string
  lookupOrder: string
  lookupOrderText: string
  lookupOrderSend: string

  /* account — inloggen, registreren en wachtwoord herstellen */
  loginTitle: string
  loginIntro: string
  noAccountYet: string
  registerTitle: string
  registerIntro: string
  alreadyHaveAccount: string
  forgotTitle: string
  forgotIntro: string
  forgotSubmit: string
  resetTitle: string
  resetIntro: string
  resetSubmit: string
  newPassword: string
  /** Uitleg onder een wachtwoordveld, bijv. "Minstens 8 tekens." */
  passwordHint: string
  /** Tooltip van het oogje naast een wachtwoordveld, als het wachtwoord verborgen is. */
  passwordShow: string
  /** Tooltip van hetzelfde oogje als het wachtwoord leesbaar op het scherm staat. */
  passwordHide: string
  backToLogin: string
  marketingOptIn: string

  /* account — de code uit de e-mail (OTP) */
  codeTitle: string
  codeIntro: string
  codeLabel: string
  codeHint: string
  codeSubmit: string
  codeResend: string
  codeSentText: string
  accountActivated: string
  /** Uitleg onder het registratieformulier: er komt een code, geen directe inlog. */
  registerCodeNote: string
  /** Uitleg onder "mijn gegevens": opslaan gaat via een code. */
  profileCodeNote: string
  /** Intro boven het codeveld bij een profielwijziging. */
  profileCodeIntro: string

  /* account — pagina's */
  accountIntro: string
  accountOverview: string
  accountDetails: string
  accountAddresses: string
  /** Boven de lijst met bestellingen op de overzichtspagina. */
  recentOrders: string
  viewAllOrders: string
  paymentStatus: string
  /** Kop van de betaalgeschiedenis. */
  paymentHistory: string
  loggedInAs: string
  downloadInvoice: string

  /* account — bestellingen filteren */
  filterFrom: string
  filterTo: string
  filterMin: string
  filterMax: string
  filterApply: string
  filterClear: string
  filterSortNewest: string
  filterSortOldest: string
  filterSortPriceDesc: string
  filterSortPriceAsc: string
  noOrdersInFilter: string
  /** Aantal resultaten na filteren, met `{n}` als plaatshouder. */
  filterResultCount: string

  /* account — adresboek */
  savedAddresses: string
  noAddressesYet: string
  addAddress: string
  newAddress: string
  addressLabelField: string
  useThisAddress: string
  saveAddressToAccount: string
  edit: string
  save: string
  saved: string
  cancel: string
  deleteLabel: string
  confirmDelete: string

  /* afrekenen — inloggen of als gast */
  checkoutLoginPrompt: string
  checkoutLoginText: string
  continueAsGuest: string

  /* algemeen */
  genericError: string
  loading: string
}

/**
 * Redactioneel blok in de zijbalk van de winkel, onder de categorielijst.
 *
 * Bewust vrij van productdata: dit is het soort blok dat op de oude site "Wat anderen zeggen" met een
 * Google-reviewsafbeelding was. Alle velden zijn optioneel, zodat een half ingevuld blok niets breekt.
 */
export type ShopSidebarWidget = {
  title: string
  text?: string
  /** Pad naar een afbeelding in `/media`, of leeg. */
  image?: string
  imageAlt?: string
  linkLabel?: string
  linkUrl?: string
}

export type WebshopContent = {
  hero: { eyebrow: string; title: string; text: string; breadcrumb: string }
  intro?: string
  /** Optionele redactionele promokaarten. Echte producten komen uit de CMS-API. */
  products: LinkCard[]
  /** Blokken onder de categorielijst in de zijbalk. Leeg = alleen de categorieën. */
  sidebarWidgets?: ShopSidebarWidget[]
  cta: CtaBlock
  /** Alle knop- en labelteksten van de webshop. */
  ui: ShopUIStrings
}

/* ---------- legal (algemene-voorwaarden, privacy, opleidingen-voorwaarden) ---------- */
export type LegalContent = {
  hero: { eyebrow: string; title: string; text: string; breadcrumb: string }
  sections: { heading: string; paragraphs: string[] }[]
}
/** Keyed by slug ("algemene-voorwaarden") so one [slug] route serves every legal/plain page. */
export type LegalCollection = Record<string, LegalContent>

/* ---------- info page (Werken Bij, UWV Subsidie, GGD, FAQ hub) — flexible content page ---------- */
export type InfoContent = {
  hero: { eyebrow: string; title: string; text: string; breadcrumb: string }
  image?: string
  body?: { heading: string; paragraphs: string[]; checklist?: string[] }[]
  faq?: { title: string; items: Faq[] }
  cta: CtaBlock
}
export type InfoCollection = Record<string, InfoContent>

/* ---------- SEO location page (Wenkbrauwen Amsterdam, Permanente Make-up Almere, …) ---------- */
export type LocationPageContent = {
  city: string
  hero: { eyebrow: string; title: string; text: string; breadcrumb: string }
  image: string
  intro: string
  body: { heading: string; paragraphs: string[]; checklist?: string[] }[]
  faq?: { title: string; items: Faq[] }
  location: Location
  cta: CtaBlock
}
export type LocationPageCollection = Record<string, LocationPageContent>

/* ---------- blog ---------- */
export type BlogPost = {
  title: string
  excerpt: string
  image: string
  author: string
  date: string
  category?: string
  /** SEO <title>, overgenomen van de oorspronkelijke WordPress-post. Valt terug op `title`. */
  seoTitle?: string
  /** SEO meta-description, overgenomen van de oorspronkelijke post. Valt terug op `excerpt`. */
  seoDescription?: string
  body: { heading?: string; paragraphs: string[] }[]
}
export type BlogCollection = Record<string, BlogPost>
export type BlogIndexContent = {
  hero: { eyebrow: string; title: string; text: string; breadcrumb: string }
  cta: CtaBlock
}

/* ---------- integrations (content/integrations.json) ---------- */

/** Where a script is injected. `head` = in <head> (trackers that must run early);
 *  `body-end` = just before </body> (widgets — the default, keeps them off the critical path). */
export type ScriptPosition = 'head' | 'body-end'

/** A configured instance of a KNOWN integration. The site owns the snippet; the CMS only stores
 *  `settings`, so an editor can never paste broken markup. `id` selects the provider definition in
 *  lib/integrations.ts — an unknown id is ignored (forward-compatible with newer CMS versions). */
export type IntegrationProvider = {
  id: string
  enabled: boolean
  settings: Record<string, string>
}

/** Free-form script — the superadmin-only escape hatch for integrations that have no provider yet.
 *  `code` is injected verbatim, so it is exactly as trusted as the person who typed it. */
export type CustomScript = {
  /** Human label, shown in the CMS list only — never rendered on the site. */
  name: string
  code: string
  position: ScriptPosition
  enabled: boolean
}

export type IntegrationsContent = {
  providers: IntegrationProvider[]
  customScripts: CustomScript[]
}
