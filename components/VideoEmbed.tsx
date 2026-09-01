/**
 * YouTube-video in een contentpagina.
 *
 * De CMS-redacteur plakt de link die hij in zijn adresbalk ziet — en dat is zelden het embed-adres.
 * Daarom accepteert dit component alle vormen waarin YouTube een video uitdeelt (watch, youtu.be,
 * /embed, /shorts, /live) en destilleert daar zelf het id uit. Herkent hij niets, dan rendert hij
 * niets: een lege of verkeerde link hoort geen kapot kader op de pagina op te leveren.
 *
 * Twee keuzes die bewust zijn:
 *
 * - **youtube-nocookie.com.** Op het gewone domein zet YouTube al trackingcookies zodra het kader
 *   in beeld komt — dus ook bij bezoekers die de video nooit starten. Dat is voor de site een
 *   cookiemelding die niemand heeft aangevraagd.
 * - **loading="lazy".** Een embed sleept een flink script mee. Deze video's staan halverwege een
 *   pagina, dus laden ze pas als de bezoeker er in de buurt komt.
 */

/** Haalt het video-id uit elke YouTube-URL-vorm; `null` als het er geen is. */
export function youtubeId(url: string): string | null {
  const raw = (url ?? '').trim()
  if (!raw) return null

  // Kaal id (11 tekens) mag ook — dan is er niets te ontleden.
  if (/^[\w-]{11}$/.test(raw)) return raw

  let u: URL
  try {
    u = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
  } catch {
    return null
  }

  const host = u.hostname.replace(/^www\./, '')
  const id =
    host === 'youtu.be'
      ? u.pathname.slice(1)
      : (u.searchParams.get('v') ?? u.pathname.replace(/^\/(embed|shorts|live|v)\//, ''))

  return /^[\w-]{11}$/.test(id) ? id : null
}

export function VideoEmbed({ url, title = 'Video' }: { url?: string | null; title?: string }) {
  const id = youtubeId(url ?? '')
  if (!id) return null

  return (
    <div className="video-embed">
      <iframe
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        src={`https://www.youtube-nocookie.com/embed/${id}`}
        title={title}
      />
    </div>
  )
}
