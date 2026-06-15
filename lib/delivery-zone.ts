import { calculateDistance } from './utils';

// ── Vakulaa delivery zone ────────────────────────────────────────
// Free, no API: we approximate the serviceable area with two circles.
//   1. "Inside ORR" Hyderabad  → circle around the city centre
//   2. Chevella (Rangareddy)   → small circle around Chevella town
// Tune these radii if you want to widen/narrow coverage.

const ORR_CENTER = { lat: 17.42, lng: 78.46 }; // ~centre of the Outer Ring Road
const ORR_RADIUS_KM = 24; // covers everything inside the ORR

const CHEVELLA = { lat: 17.3206, lng: 78.133 }; // Chevella town, Rangareddy
const CHEVELLA_RADIUS_KM = 8;

/**
 * Returns true if the given coordinates fall inside the deliverable zone
 * (inside ORR Hyderabad, or in/near Chevella).
 */
export function isWithinDeliveryZone(lat?: number | null, lng?: number | null): boolean {
  if (lat == null || lng == null) return false;
  const inORR =
    calculateDistance(ORR_CENTER.lat, ORR_CENTER.lng, lat, lng) <= ORR_RADIUS_KM;
  const inChevella =
    calculateDistance(CHEVELLA.lat, CHEVELLA.lng, lat, lng) <= CHEVELLA_RADIUS_KM;
  return inORR || inChevella;
}
