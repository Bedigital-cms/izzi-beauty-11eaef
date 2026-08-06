/**
 * Filters boven de bestellijst: datum, bedrag en sortering.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * EEN GEWOON GET-FORMULIER, GEEN CLIENT-COMPONENT
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * `<form method="get">` zet de velden in de URL en de pagina rendert opnieuw op de server, die met die
 * waarden in de DATABASE filtert. Dat is hier op elk punt beter dan een client-component met state:
 *
 *  - **de lijst blijft compleet.** Er komen twintig bestellingen per pagina; client-side filteren zou
 *    "de eerste twintig, en daarvan wat past" opleveren — verkeerd zodra iemand meer bestellingen heeft,
 *    en verkeerd zonder dat iemand het ziet;
 *  - **de gefilterde lijst is een URL**: te bookmarken, te delen, en de terugknop doet wat je verwacht;
 *  - **het werkt zonder JavaScript**, en er is geen extra bundel voor nodig.
 *
 * De `action` blijft leeg: dan post het formulier naar de huidige URL, inclusief het taalvoorvoegsel.
 * Een hardcoded pad zou `/nl` verliezen (of juist verdubbelen bij een taal zonder voorvoegsel).
 */
import type { ShopUIStrings } from '@/lib/types'

export function OrderFilters({
  ui,
  values,
}: {
  ui: ShopUIStrings
  values: { from?: string; to?: string; min?: string; max?: string; sort: string }
}) {
  const hasFilter = Boolean(values.from || values.to || values.min || values.max)

  return (
    <form className="order-filters" method="get">
      <div className="order-filters-row">
        <div className="form-field">
          <label className="form-label" htmlFor="of-from">
            {ui.filterFrom}
          </label>
          <input defaultValue={values.from ?? ''} id="of-from" name="from" type="date" />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="of-to">
            {ui.filterTo}
          </label>
          <input defaultValue={values.to ?? ''} id="of-to" name="to" type="date" />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="of-min">
            {ui.filterMin}
          </label>
          {/*
           * `inputMode decimal` + `step any`: bedragen mogen centen hebben, en op mobiel hoort er een
           * cijfertoetsenbord te komen. Het CMS accepteert zowel een punt als een komma.
           */
          }
          <input
            defaultValue={values.min ?? ''}
            id="of-min"
            inputMode="decimal"
            min="0"
            name="min"
            step="any"
            type="number"
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="of-max">
            {ui.filterMax}
          </label>
          <input
            defaultValue={values.max ?? ''}
            id="of-max"
            inputMode="decimal"
            min="0"
            name="max"
            step="any"
            type="number"
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="of-sort">
            {ui.sortBy}
          </label>
          <select defaultValue={values.sort} id="of-sort" name="sort">
            <option value="newest">{ui.filterSortNewest}</option>
            <option value="oldest">{ui.filterSortOldest}</option>
            <option value="price_desc">{ui.filterSortPriceDesc}</option>
            <option value="price_asc">{ui.filterSortPriceAsc}</option>
          </select>
        </div>
      </div>

      <div className="order-filters-actions">
        <button className="btn btn-gold" type="submit">
          {ui.filterApply}
        </button>
        {/*
         * "Wissen" is een LINK naar de pagina zonder parameters, geen resetknop: een `type="reset"` zet
         * de velden terug maar laat de lijst gefilterd staan — precies het soort halve actie waar een
         * bezoeker op klikt en dan denkt dat het niet werkt.
         */}
        {hasFilter && (
          <a className="btn btn-outline" href="?">
            {ui.filterClear}
          </a>
        )}
      </div>
    </form>
  )
}
