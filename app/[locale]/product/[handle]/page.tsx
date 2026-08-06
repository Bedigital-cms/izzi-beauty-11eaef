import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { LocaleLink } from '@/components/LocaleLink'
import { AddToCart } from '@/components/commerce/AddToCart'
import { ProductGallery } from '@/components/commerce/ProductGallery'
import { CtaBand } from '@/components/sections'
import { Shell } from '@/components/Shell'
import { getShop } from '@/content/shop'
import { getProduct } from '@/lib/commerce/client'
import { commerceEnabled } from '@/lib/commerce/config'
import { formatTaxRate, schemaAvailability, schemaPrice } from '@/lib/commerce/format'

/**
 * /product/[handle] — productdetailpagina.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * WAAROM PRODUCTEN ONDER /product/ STAAN EN NIET IN DE VLAKKE NAMESPACE
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * De rest van deze site gebruikt vlakke URL's (`/lip-blush` in plaats van `/behandelingen/lip-blush`),
 * met een build-time controle die dubbele slugs afkeurt. Die controle leest de content-JSON en kan dus
 * alleen zien wat in git staat.
 *
 * Producten staan in de DATABASE en veranderen zonder build. Een productslug zou daardoor stil kunnen
 * botsen met een behandelingsslug: Next kiest dan de statische route en het product is voor altijd
 * onbereikbaar — zonder foutmelding, want er is geen moment waarop iets die botsing kan opmerken.
 * Vandaar een eigen `/product/`-segment: één gereserveerde naam die het hele probleem wegneemt.
 */
export const dynamic = 'force-dynamic'

/**
 * Bewust LEEG en zonder fetch.
 *
 * De verleiding is om hier "de 50 populairste producten" te prerenderen. Niet doen: dan haalt de
 * validatie-build van het CMS weer data op zonder bereikbare API, en breekt de publicatie van élke
 * tenant. `dynamicParams` staat standaard aan, dus elke handle werkt gewoon op aanvraag.
 */
export function generateStaticParams() {
  return []
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>
}): Promise<Metadata> {
  const { locale, handle } = await params
  if (!commerceEnabled()) return {}

  const result = await getProduct(handle)
  if (!result.ok) {
    // NOOIT gooien in generateMetadata: dat laat het hele verzoek falen. Een minimale titel is beter.
    return { title: getShop(locale).hero.title }
  }

  const p = result.data.product
  return {
    title: p.seo.title || p.title,
    description: p.seo.description || p.shortDescription,
    openGraph: {
      title: p.seo.title || p.title,
      description: p.seo.description || p.shortDescription,
      images: p.images.length ? [{ url: p.images[0].url }] : undefined,
      type: 'website',
    },
    // Bewust GEEN `alternates.languages`: die zou andere talen adverteren waarvan we niet weten of
    // het product er bestaat. Een hreflang naar een 404 is een fout in Search Console.
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>
}) {
  const { locale, handle } = await params
  if (!commerceEnabled()) notFound()

  const shop = getShop(locale)
  const ui = shop.ui

  const result = await getProduct(handle)
  // Onbekend, concept, gearchiveerd of van een andere tenant → allemaal 404.
  if (!result.ok) notFound()

  const product = result.data.product
  const pricesIncludeTax = result.data.pricesIncludeTax

  return (
    <Shell locale={locale}>
      <article className="section product-detail">
        <div className="container">
          <nav aria-label="Kruimelpad" className="product-breadcrumb">
            <LocaleLink href="/winkel">{shop.hero.breadcrumb}</LocaleLink>
            <span aria-hidden="true"> / </span>
            <span>{product.title}</span>
          </nav>

          <div className="product-layout">
            {/* Afbeeldingen. Geen next/image: deze template gebruikt bewust gewone <img> met een
                eigen /media-proxy. Alle afbeeldingen zijn aanklikbaar — zie ProductGallery. */}
            <ProductGallery images={product.images} title={product.title} />

            <div className="product-info">
              <h1>{product.title}</h1>
              {product.shortDescription && <p className="product-lead">{product.shortDescription}</p>}

              <AddToCart product={product} ui={ui} />

              <p className="product-tax-note">
                {pricesIncludeTax ? ui.taxIncluded : ui.tax}
                {product.taxRateBasisPoints !== null && ` (${formatTaxRate(product.taxRateBasisPoints)})`}
              </p>

              {product.categories.length > 0 && (
                <p className="product-categories">
                  {product.categories.map((c) => (
                    <LocaleLink href={`/winkel?categorie=${encodeURIComponent(c.slug)}`} key={String(c.id)}>
                      {c.name}
                    </LocaleLink>
                  ))}
                </p>
              )}
            </div>
          </div>

          {/*
           * De volledige omschrijving, onder de twee kolommen.
           *
           * Bewust NIET in de rechterkolom naast de afbeelding: die kolom bevat de koopbeslissing
           * (prijs, voorraad, knop) en die moet boven de vouw blijven. Een omschrijving van enkele
           * alinea's zou de knop naar beneden duwen.
           *
           * `dangerouslySetInnerHTML` is hier verantwoord: de HTML komt van het CMS, geschreven
           * door een ingelogde redacteur — dezelfde vertrouwensgrens als de overige content op
           * deze site. Er komt geen bezoekersinvoer in dit veld.
           */}
          {product.description && (
            <div
              className="product-body prose"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}
        </div>
      </article>

      <CtaBand cta={shop.cta} />

      {/* Structured data voor Google. `schemaPrice` zet centen om naar "19.99" zonder float. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.title,
            description: product.seo.description || product.shortDescription,
            sku: product.variants[0]?.sku || undefined,
            image: product.images.map((i) => i.url),
            offers:
              product.priceCents === null
                ? undefined
                : {
                    '@type': 'Offer',
                    price: schemaPrice(product.priceCents),
                    priceCurrency: product.currency,
                    availability: schemaAvailability(product.inStock),
                  },
          }),
        }}
      />
    </Shell>
  )
}
