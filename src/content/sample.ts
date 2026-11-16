import type { OpeningHours, Service, StaffMember } from "@/lib/types";

/**
 * Sample menu shown when no database is connected yet, so the site can be
 * previewed straight away. The same rows are in supabase/seed.sql.
 * Once Supabase is connected, the database is the source of truth.
 */
export const sampleServices: Service[] = [
  {
    id: "11111111-0000-4000-8000-000000000001",
    slug: "signature-massage",
    name: "Signature Massage",
    category: "Massage",
    summary: "Long, unhurried strokes with warm oil to settle body and mind.",
    description:
      "Our most requested treatment. A full-body massage using long, flowing strokes and warm botanical oil, with pressure set to your preference. Ideal if this is your first visit or you simply want to switch off.",
    duration_min: 60,
    price_cents: 180000,
    image: "/images/massage.jpg",
    sort: 10,
    active: true,
  },
  {
    id: "11111111-0000-4000-8000-000000000002",
    slug: "deep-tissue-massage",
    name: "Deep Tissue Massage",
    category: "Massage",
    summary: "Slow, firm pressure that works into tight shoulders, back and legs.",
    description:
      "Focused, firm work on the deeper layers of muscle. Your therapist concentrates on the areas you carry tension — typically neck, shoulders and lower back — and finishes with lighter strokes to release.",
    duration_min: 60,
    price_cents: 200000,
    image: "/images/deep-tissue.jpg",
    sort: 20,
    active: true,
  },
  {
    id: "11111111-0000-4000-8000-000000000003",
    slug: "hot-stone-massage",
    name: "Hot Stone Massage",
    category: "Massage",
    summary: "Smooth heated stones melt tension before a full-body massage.",
    description:
      "Warm basalt stones are placed along the back and used in the therapist's hands to ease muscles more deeply than hands alone. Ninety minutes of steady, enveloping warmth.",
    duration_min: 90,
    price_cents: 290000,
    image: "/images/hot-stone.jpg",
    sort: 30,
    active: true,
  },
  {
    id: "11111111-0000-4000-8000-000000000004",
    slug: "aromatherapy-massage",
    name: "Aromatherapy Massage",
    category: "Massage",
    summary: "A gentle massage with an essential-oil blend chosen with you.",
    description:
      "You choose from three essential-oil blends — calming, restoring or uplifting — before a light-to-medium pressure massage designed to quiet the nervous system.",
    duration_min: 60,
    price_cents: 190000,
    image: "/images/aromatherapy.jpg",
    sort: 40,
    active: true,
  },
  {
    id: "11111111-0000-4000-8000-000000000005",
    slug: "radiance-facial",
    name: "Radiance Facial",
    category: "Facials",
    summary: "Cleanse, exfoliate, mask and massage for rested, luminous skin.",
    description:
      "A classic facial tailored to your skin on the day: double cleanse, gentle exfoliation, a treatment mask, and a face, neck and shoulder massage while it works.",
    duration_min: 60,
    price_cents: 220000,
    image: "/images/facial.jpg",
    sort: 50,
    active: true,
  },
  {
    id: "11111111-0000-4000-8000-000000000006",
    slug: "body-polish",
    name: "Body Polish",
    category: "Body Rituals",
    summary: "A full-body exfoliation followed by rich, warm moisturiser.",
    description:
      "A fine mineral scrub smooths the skin from shoulders to feet, followed by a warm rinse and a generous application of body butter. Skin is left soft for days.",
    duration_min: 60,
    price_cents: 210000,
    image: "/images/body.jpg",
    sort: 60,
    active: true,
  },
  {
    id: "11111111-0000-4000-8000-000000000007",
    slug: "foot-ritual",
    name: "Foot Ritual",
    category: "Body Rituals",
    summary: "A warm floral soak, scrub and pressure-point foot massage.",
    description:
      "Begins with a warm soak, then a scrub and a slow pressure-point massage of the feet and lower legs. A good choice after travel or a long week on your feet.",
    duration_min: 45,
    price_cents: 120000,
    image: "/images/foot-ritual.jpg",
    sort: 70,
    active: true,
  },
  {
    id: "11111111-0000-4000-8000-000000000008",
    slug: "scalp-and-shoulder-release",
    name: "Scalp & Shoulder Release",
    category: "Body Rituals",
    summary: "Thirty focused minutes on the head, neck and shoulders.",
    description:
      "A short treatment for when time is tight. Warm oil is worked through the scalp, followed by focused massage of the neck and shoulders. Can be added to any massage.",
    duration_min: 30,
    price_cents: 90000,
    image: "/images/scalp.jpg",
    sort: 80,
    active: true,
  },
];

export const sampleStaff: StaffMember[] = [
  { id: "22222222-0000-4000-8000-000000000001", name: "Therapist One", active: true },
  { id: "22222222-0000-4000-8000-000000000002", name: "Therapist Two", active: true },
];

export const sampleHours: OpeningHours[] = [
  { weekday: 0, opens: "10:00:00", closes: "18:00:00", closed: false },
  { weekday: 1, opens: "10:00:00", closes: "20:00:00", closed: true },
  { weekday: 2, opens: "10:00:00", closes: "20:00:00", closed: false },
  { weekday: 3, opens: "10:00:00", closes: "20:00:00", closed: false },
  { weekday: 4, opens: "10:00:00", closes: "20:00:00", closed: false },
  { weekday: 5, opens: "10:00:00", closes: "21:00:00", closed: false },
  { weekday: 6, opens: "09:00:00", closes: "21:00:00", closed: false },
];
