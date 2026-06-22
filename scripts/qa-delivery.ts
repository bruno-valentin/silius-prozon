// Manual QA harness for the delivery engine (test-plan EPIC-2, §10.1 alternative to vitest).
// Run: node scripts/qa-delivery.ts   (Node 22+ strips the TS types natively)
// Reference visit date = Monday 2026-06-22 (test-plan §4.1). Pure, deterministic.

import { estimateDelivery, addBusinessDays, FR_HOLIDAYS_2026 } from '../lib/delivery.ts'
import type { DeliverySupplyInput, DeliverySupplierInput } from '../lib/delivery.ts'

const REF = new Date(Date.UTC(2026, 5, 22)) // Monday 22 June 2026

let pass = 0
let fail = 0
const failures: string[] = []
function check(id: string, cond: boolean, detail = '') {
  if (cond) { pass++; console.log(`  PASS ${id}`) }
  else { fail++; failures.push(`${id} ${detail}`); console.log(`  FAIL ${id} ${detail}`) }
}

const sup = (t: DeliverySupplierInput) => t
const FR: DeliverySupplierInput = { default_supply_type: 'dropship_fr', force_long_delay: false }
const EU: DeliverySupplierInput = { default_supply_type: 'dropship_eu', force_long_delay: false }
const ASIA: DeliverySupplierInput = { default_supply_type: 'made_to_order', force_long_delay: false }
const FRKO: DeliverySupplierInput = { default_supply_type: 'dropship_fr', force_long_delay: true }

const est = (p: DeliverySupplyInput, supplier: DeliverySupplierInput = null, referenceDate = REF) =>
  estimateDelivery(p, { supplier, referenceDate })

// ---- 6.1 States & typologies ----
const tStock = est({ supply_type: 'prozon_stock' })
check('T2.1 firm', tStock.state === 'firm' && tStock.date === '2026-06-29' && tStock.provisional === true, JSON.stringify(tStock))
const tDfr = est({ supply_type: 'dropship_fr' }, FR)
check('T2.2 range FR short', tDfr.state === 'range' && tDfr.rangeStart! < tDfr.rangeEnd!)
const tDeu = est({ supply_type: 'dropship_eu' }, EU)
check('T2.3 range EU medium > FR', tDeu.state === 'range' && tDeu.rangeStart! > tDfr.rangeStart!)
const tMto = est({ supply_type: 'made_to_order' }, ASIA)
check('T2.4 cautious', tMto.state === 'cautious' && tMto.weeksMin === 5 && tMto.weeksMax === 7 && tMto.date === undefined)
check('T2.5 single state', ['firm', 'range', 'cautious'].includes(tStock.state))

// ---- 6.2 Firm stock date (business days + holidays) ----
check('T2.6 firm = lun. 29 juin', tStock.date === '2026-06-29' && /lun\.?\s*29 juin/.test(tStock.primary), tStock.primary)
const thu = new Date(Date.UTC(2026, 5, 25)) // Thursday 25 June
const tThu = est({ supply_type: 'prozon_stock' }, null, thu)
check('T2.7 weekend skip', tThu.date === '2026-07-02', tThu.date) // not 2026-06-30 (calendar +5)
const jul13 = new Date(Date.UTC(2026, 6, 13)) // Monday 13 July (14 July = holiday)
const tJul = est({ supply_type: 'prozon_stock' }, null, jul13)
check('T2.8 holiday skip 14/07', tJul.date === '2026-07-21', tJul.date) // not 2026-07-20

// ---- 6.3 Dropship ranges ----
check('T2.12 FR 26/06 -> 30/06', tDfr.rangeStart === '2026-06-26' && tDfr.rangeEnd === '2026-06-30', `${tDfr.rangeStart}..${tDfr.rangeEnd}`)
check('T2.13 EU 30/06 -> 03/07', tDeu.rangeStart === '2026-06-30' && tDeu.rangeEnd === '2026-07-03', `${tDeu.rangeStart}..${tDeu.rangeEnd}`)
// T2.14 is reported separately (locked-param inconsistency) — see QA report.
check('T2.15 ignores reported inputs', est({ supply_type: 'dropship_fr', /* no lead_time/score/freshness */ }, FR).rangeStart === '2026-06-26')

// ---- 6.4 Long delay (cautious) ----
check('T2.16 cautious copy + no date', tMto.primary === 'Expédié sous 5 à 7 semaines' && tMto.date === undefined)
check('T2.17 cta cautious only', !!tMto.cta && !tStock.cta && !tDfr.cta && !tDeu.cta)
const blacklist = /fabriqu|made in|sur commande|dropship|usine|origine|chine|import/i
const claims = [tStock, tDfr, tDeu, tMto].every(e => !blacklist.test(e.primary) && !blacklist.test(e.secondary))
check('T2.18 no production/origin claim', claims)

// ---- 6.5 Forcing (one-way) ----
check('T2.19 product force -> cautious', est({ supply_type: 'prozon_stock', force_long_delay: true }).state === 'cautious')
check('T2.20 supplier force -> cautious', est({ supply_type: 'dropship_fr' }, FRKO).state === 'cautious')
check('T2.21 product OR supplier', est({ supply_type: 'prozon_stock', force_long_delay: true }, FR).state === 'cautious' && est({ supply_type: 'prozon_stock' }, FRKO).state === 'cautious')
check('T2.22 force never firm/range', est({ supply_type: 'prozon_stock', force_long_delay: true }).state === 'cautious')

// ---- 6.6 Fallback ----
check('T2.23 null -> cautious', est({ supply_type: null }).state === 'cautious')
check('T2.24 invalid -> cautious', est({ supply_type: 'banana' as never }).state === 'cautious')
check('T2.25 no transit dependency (no crash)', est({ supply_type: 'dropship_eu' }, EU).state === 'range')
const sample = ['prozon_stock', 'dropship_fr', 'dropship_eu', 'made_to_order', null, 'xxx' as never]
check('T2.26 100% valid state', sample.every(t => ['firm', 'range', 'cautious'].includes(est({ supply_type: t as never }).state)))

// ---- 6.7 Determinism ----
check('T2.27 double call equal', JSON.stringify(est({ supply_type: 'prozon_stock' })) === JSON.stringify(est({ supply_type: 'prozon_stock' })))
check('T2.29 stable date', est({ supply_type: 'prozon_stock' }).date === est({ supply_type: 'prozon_stock' }).date)

// ---- 6.8 Zone hypothesis ----
check('T2.30 provisional metropole, no zoneLabel', tStock.provisional === true && tStock.zoneLabel === undefined)

// ---- Inheritance (US-4.2) ----
check('INHERIT type from supplier', est({ supply_type: null }, EU).state === 'range' && est({ supply_type: null }, EU).rangeStart === '2026-06-30')

// ---- addBusinessDays unit (T2.7/T2.8 isolated) ----
check('addBusinessDays +5 from Mon', addBusinessDays(REF, 5, FR_HOLIDAYS_2026).toISOString().slice(0, 10) === '2026-06-29')
check('addBusinessDays holiday', addBusinessDays(jul13, 5, FR_HOLIDAYS_2026).toISOString().slice(0, 10) === '2026-07-21')

console.log(`\n=== Engine QA: ${pass} PASS / ${fail} FAIL ===`)
if (fail) { console.log('Failures:', failures); process.exit(1) }
void sup
