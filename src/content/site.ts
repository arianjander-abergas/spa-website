/**
 * Business details shown across the site.
 * PLACEHOLDERS — replace with the real spa's details before launch.
 */
export const site = {
  name: "Stillwater",
  descriptor: "Day Spa",
  tagline: "Quiet, considered care.",
  description:
    "A calm day spa offering massage, facials and body rituals. Reserve your treatment online in under a minute.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  phone: "+63 900 000 0000",
  email: "hello@example.com",
  addressLines: ["123 Placeholder Street", "Your City 1000"],
  /** Text used for the map and "Get directions" link. Leave empty to hide the map. */
  mapQuery: "",

  /** All times on the site are shown in the spa's own time zone. */
  timezone: "Asia/Manila",
  locale: "en-PH",
  currency: "PHP",

  /** Guests can cancel or move a booking online until this many hours before it starts. */
  cancelWindowHours: 24,
} as const;

export const nav = [
  { href: "/treatments", label: "Treatments" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Visit" },
] as const;
