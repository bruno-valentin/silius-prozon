// Delivery estimate engine — "délai de livraison estimé fiable" (V1).
//
// Pure, deterministic, no I/O, no Math.random (replaces the random window that
// used to live in app/product/[slug]/page.tsx). Given the same inputs and the
// same reference date, estimateDelivery() always returns the same object.
//
// Design constraints (test-plan §10):
//   - referenceDate is injectable (never reads new Date() deep in the logic),
//   - addBusinessDays / holidays are pure and exported (testable in isolation),
//   - the client labels are generated here from centralised templates — callers
//     never write the promise text (FR13/FR17: no production/origin claim possible),
//   - the estimate can only ever DEGRADE towards prudence (firm -> range -> cautious),
//     never the other way round (FR9 / INV-2). Missing/invalid data -> cautious (FR8).
//
// Locked business parameters (2026-06-22): all delays in business days, no P90
// calibration, no cutoff. See test-plan §4.4.

export type SupplyType = 'prozon_stock' | 'dropship_fr' | 'dropship_eu' | 'made_to_order'

// Internal state names — NEVER shown to the customer (FR11). They drive the visual variant.
export type DeliveryState = 'firm' | 'range' | 'cautious'

export type DeliveryEstimate = {
  state: DeliveryState
  primary: string // ready-to-display FR label (e.g. "Livraison estimée le lun. 29 juin")
  secondary: string // short context line
  provisional: boolean // true = product page (zone assumption), false = checkout (real zone)
  zoneLabel?: string // checkout only — unused in V1 (no checkout display)
  confidence: 'high' | 'medium' | 'low' // internal calibration, never displayed
  cta?: { label: string; href: string } // 'cautious' only -> quote request
  // raw data (in case a consumer reformats) — a 'cautious' estimate NEVER carries a usable date (FR3/INV-3):
  date?: string // ISO yyyy-mm-dd — 'firm' only
  rangeStart?: string // ISO — 'range' only
  rangeEnd?: string // ISO — 'range' only
  weeksMin?: number // 'cautious' only
  weeksMax?: number // 'cautious' only
}

// Minimal shape the engine needs from a product (a subset of Product).
export type DeliverySupplyInput = {
  supply_type: SupplyType | null
  force_long_delay?: boolean | null
}

// Minimal shape the engine needs from the product's supplier (null = none).
export type DeliverySupplierInput = {
  default_supply_type: SupplyType
  force_long_delay: boolean
} | null

export type EstimateOptions = {
  referenceDate?: Date // "today" — injectable for deterministic tests; defaults to now
  supplier?: DeliverySupplierInput // carries inherited type + supplier-level force flag
  holidays?: ReadonlySet<string> // ISO yyyy-mm-dd non-working days; defaults to FR 2026
  zone?: string // reserved for a future checkout context — no consumer in V1
}

// Locked V1 parameters (business days), in working days. test-plan §4.4.
const PARAMS = {
  prozon_stock: { lead: 5 }, // firm: visit + 5 business days
  dropship_fr: { lead: 4, margin: 2 }, // range: [visit+4, +2]
  dropship_eu: { lead: 6, margin: 3 }, // range: [visit+6, +3]
  made_to_order: { weeksMin: 5, weeksMax: 7 }, // cautious: "sous 5 à 7 semaines"
} as const

// French public holidays 2026 (project is short-term — 2026 only). test-plan §4.4.
// 15/08 and 01/11 fall on a week-end in 2026 (no effect on the business-day count) but
// are listed for completeness.
export const FR_HOLIDAYS_2026: ReadonlySet<string> = new Set([
  '2026-01-01', // Jour de l'an
  '2026-04-06', // Lundi de Pâques
  '2026-05-01', // Fête du Travail
  '2026-05-08', // Victoire 1945
  '2026-05-14', // Ascension
  '2026-05-25', // Lundi de Pentecôte
  '2026-07-14', // Fête nationale
  '2026-08-15', // Assomption (samedi)
  '2026-11-01', // Toussaint (dimanche)
  '2026-11-11', // Armistice
  '2026-12-25', // Noël
])

// ---- Calendar helpers (UTC-based so the result is independent of the server timezone) ----

/** ISO yyyy-mm-dd for a date, in UTC. */
export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function isBusinessDay(d: Date, holidays: ReadonlySet<string>): boolean {
  const day = d.getUTCDay() // 0 = Sunday, 6 = Saturday
  if (day === 0 || day === 6) return false
  return !holidays.has(toISODate(d))
}

/**
 * Returns `start` advanced by `n` business days (week-ends + holidays excluded).
 * Pure: does not mutate `start`. n must be >= 0.
 */
export function addBusinessDays(start: Date, n: number, holidays: ReadonlySet<string> = FR_HOLIDAYS_2026): Date {
  // Work from UTC midnight of the start day so partial-day time never shifts the count.
  const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()))
  let added = 0
  while (added < n) {
    d.setUTCDate(d.getUTCDate() + 1)
    if (isBusinessDay(d, holidays)) added++
  }
  return d
}

// ---- Label templates (centralised — callers never write these strings, FR17) ----

const LONG_DATE = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})

/** "lun. 29 juin" — long, decision-friendly format for the firm date (UX §6). */
function formatLong(d: Date): string {
  // Intl yields "lun. 29 juin" — trim a trailing period some locales add and keep it clean.
  return LONG_DATE.format(d).replace(/\.$/, '')
}

/** "29/06" — compact format for the range bounds (UX §6). */
function formatShort(d: Date): string {
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}`
}

const QUOTE_CTA = { label: 'Demander un devis', href: '/devis' }

// ---- Engine ----

/** Resolves the effective supply type: explicit on the product, else inherited from the supplier. */
function resolveSupplyType(product: DeliverySupplyInput, supplier: DeliverySupplierInput): SupplyType | null {
  if (product.supply_type) return product.supply_type
  if (supplier) return supplier.default_supply_type
  return null
}

function isSupplyType(value: SupplyType | null): value is SupplyType {
  return value === 'prozon_stock' || value === 'dropship_fr' || value === 'dropship_eu' || value === 'made_to_order'
}

function firm(date: Date, provisional: boolean): DeliveryEstimate {
  return {
    state: 'firm',
    primary: `Livraison estimée le ${formatLong(date)}`,
    secondary: 'Préparé et expédié depuis notre entrepôt',
    provisional,
    confidence: 'high',
    date: toISODate(date),
  }
}

function range(start: Date, end: Date, provisional: boolean): DeliveryEstimate {
  return {
    state: 'range',
    primary: `Livraison estimée entre le ${formatShort(start)} et le ${formatShort(end)}`,
    secondary: 'Expédié par notre fournisseur partenaire', // never the word "dropshipping" (FR11)
    provisional,
    confidence: 'medium',
    rangeStart: toISODate(start),
    rangeEnd: toISODate(end),
  }
}

function cautious(provisional: boolean): DeliveryEstimate {
  // No raw date — a cautious estimate must never expose a hard date (FR3/INV-3).
  // No production/origin claim — only an estimated duration + a path to a quote (FR13).
  return {
    state: 'cautious',
    primary: `Expédié sous ${PARAMS.made_to_order.weeksMin} à ${PARAMS.made_to_order.weeksMax} semaines`,
    secondary: 'Demandez un devis pour obtenir des précisions sur votre livraison.',
    provisional,
    confidence: 'low',
    cta: QUOTE_CTA,
    weeksMin: PARAMS.made_to_order.weeksMin,
    weeksMax: PARAMS.made_to_order.weeksMax,
  }
}

/**
 * Computes the delivery estimate for a product. Single source of truth shared by
 * the product page and the back-office live preview.
 *
 * On the product page the customer's address is unknown -> a "France métropolitaine
 * standard" assumption is used (provisional = true). The reserved `zone` option has
 * no consumer in V1 (no checkout display).
 */
export function estimateDelivery(product: DeliverySupplyInput, opts: EstimateOptions = {}): DeliveryEstimate {
  const referenceDate = opts.referenceDate ?? new Date()
  const supplier = opts.supplier ?? null
  const holidays = opts.holidays ?? FR_HOLIDAYS_2026
  const provisional = true // V1: product page only

  // Forcing "long delay" at the product OR the supplier level degrades to cautious (FR15/FR18).
  const forced = Boolean(product.force_long_delay) || Boolean(supplier?.force_long_delay)
  if (forced) return cautious(provisional)

  const type = resolveSupplyType(product, supplier)

  // Fallback: missing or unknown typology -> cautious, never a fake date, never random (FR8/INV-2).
  if (!isSupplyType(type)) return cautious(provisional)

  switch (type) {
    case 'prozon_stock': {
      const date = addBusinessDays(referenceDate, PARAMS.prozon_stock.lead, holidays)
      return firm(date, provisional)
    }
    case 'dropship_fr': {
      const start = addBusinessDays(referenceDate, PARAMS.dropship_fr.lead, holidays)
      const end = addBusinessDays(start, PARAMS.dropship_fr.margin, holidays)
      return range(start, end, provisional)
    }
    case 'dropship_eu': {
      const start = addBusinessDays(referenceDate, PARAMS.dropship_eu.lead, holidays)
      const end = addBusinessDays(start, PARAMS.dropship_eu.margin, holidays)
      return range(start, end, provisional)
    }
    case 'made_to_order':
    default:
      return cautious(provisional)
  }
}
