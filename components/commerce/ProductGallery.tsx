'use client'
/**
 * Afbeeldingen op de productdetailpagina.
 *
 * ── Waarom een client-component ───────────────────────────────────────────────────────────────
 * De rest van de pagina blijft server-gerenderd; alleen het wisselen van de hoofdafbeelding heeft
 * state nodig. Bij één afbeelding hydrateert er niets zinnigs, dus dan rendert dit als een
 * eenvoudige `<figure>` zonder knoppen.
 *
 * ── Waarom een vaste verhouding op élke afbeelding ────────────────────────────────────────────
 * Productfoto's komen uit het CMS en hebben willekeurige afmetingen: een vierkante cover naast een
 * liggende foto naast een staand portret. Zonder vaste verhouding krijgt elke thumbnail een andere
 * hoogte en staat de rij rafelig — precies wat er gebeurde toen de thumbs alleen `overflow: hidden`
 * hadden. `aspect-ratio` + `object-fit: cover` geeft één rustig raster; de hoofdafbeelding krijgt
 * `contain` zodat een staande foto niet bijgesneden wordt.
 */
import * as React from 'react'

import { Media } from '@/components/Media'
import type { CommerceImage } from '@/lib/commerce/types'

export function ProductGallery({ images, title }: { images: CommerceImage[]; title: string }) {
  const [active, setActive] = React.useState(0)

  // Geen afbeeldingen → de placeholder van `Media`, zodat de layout niet inzakt.
  if (!images.length) {
    return (
      <div className="pgallery">
        <div className="pgallery-main">
          <Media alt={title} label={title} shape="square" src="" />
        </div>
      </div>
    )
  }

  const current = images[Math.min(active, images.length - 1)]

  return (
    <div className="pgallery">
      <div className="pgallery-main">
        <Media alt={current.alt || title} label={title} shape="square" src={current.url} />
      </div>

      {/* Eén afbeelding → geen keuze te maken, dus geen thumbnailrij. */}
      {images.length > 1 && (
        <div className="pgallery-thumbs">
          {images.map((img, i) => (
            <button
              aria-current={i === active ? 'true' : undefined}
              aria-label={`Afbeelding ${i + 1} van ${images.length}`}
              className={`pgallery-thumb${i === active ? ' pgallery-thumb--active' : ''}`}
              key={`${img.url}-${i}`}
              onClick={() => setActive(i)}
              type="button"
            >
              <Media alt={img.alt} shape="square" src={img.url} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
