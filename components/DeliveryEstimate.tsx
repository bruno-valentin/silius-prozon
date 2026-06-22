import Link from 'next/link'
import { Truck } from 'lucide-react'
import type { DeliveryEstimate } from '@/lib/delivery'

// Renders the delivery-estimate block. Shared, presentational only: it receives a
// ready-to-display estimate (computed by lib/delivery.ts) and never calculates or
// formats a delay itself — same component on the product page and the admin live
// preview (single source of truth).
//
// All three variants use the SAME truck icon and the same sober navy treatment
// (FR10) — no alert/hourglass picto, no colour change: the meaning is carried by
// the estimate text alone (UX §6, anti-anxiety / accessibility). No "how it's
// computed" link (FR5), no internal jargon (FR11).
export default function DeliveryEstimateBlock({ estimate }: { estimate: DeliveryEstimate }) {
  return (
    <div className="bg-prozon-gray border border-prozon-border p-4 mb-6">
      <div className="flex items-start gap-3">
        <Truck size={18} className="text-prozon-navy mt-0.5 shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <div className="font-display font-semibold text-prozon-navy leading-snug">{estimate.primary}</div>
          <div className="text-sm text-prozon-gray-mid mt-0.5">{estimate.secondary}</div>
          {estimate.provisional && (
            <div className="text-xs text-prozon-gray-mid mt-1.5">Estimé pour la France métropolitaine</div>
          )}
          {estimate.cta && (
            <Link href={estimate.cta.href} className="btn-primary text-sm mt-3 inline-flex">
              {estimate.cta.label}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
