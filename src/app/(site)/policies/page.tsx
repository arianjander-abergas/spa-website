import type { Metadata } from "next";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Policies",
  description: "Cancellation, late arrival, payment and privacy policies.",
};

const policies = [
  {
    id: "cancellation",
    title: "Cancelling or moving a booking",
    body: [
      `You can cancel or move your booking free of charge up to ${site.cancelWindowHours} hours before it starts, using the link in your confirmation email.`,
      `Inside ${site.cancelWindowHours} hours, please call us. We will always try to help, but late cancellations and missed appointments may be charged in full.`,
    ],
  },
  {
    id: "arrival",
    title: "Arriving",
    body: [
      "Please arrive ten minutes before your appointment so your treatment can start on time.",
      "If you arrive late we may need to shorten your treatment so the next guest is not kept waiting. The full price still applies.",
    ],
  },
  {
    id: "payment",
    title: "Payment",
    body: [
      "Payment is taken at the spa after your treatment unless you chose to pay online when booking. Prices include all taxes.",
    ],
  },
  {
    id: "health",
    title: "Health and comfort",
    body: [
      "Tell us when booking if you are pregnant, have an injury, allergy or medical condition, so we can adapt your treatment or suggest a better one.",
      "You are always in control of pressure, temperature and draping. Just say.",
    ],
  },
  {
    id: "privacy",
    title: "Your details",
    body: [
      "We use your name, email and phone number only to manage your booking and to contact you about it. We do not sell or share them, and we do not send marketing unless you ask us to.",
      `To have your details removed, email ${site.email}.`,
    ],
  },
];

export default function PoliciesPage() {
  return (
    <div className="container-page section">
      <p className="eyebrow">Good to know</p>
      <h1 className="display mt-5">Policies</h1>

      <div className="mt-14 max-w-3xl">
        {policies.map((p) => (
          <section key={p.id} id={p.id} className="scroll-mt-28 border-t border-line py-9">
            <h2 className="subheading">{p.title}</h2>
            <div className="mt-3 space-y-3 text-stone">
              {p.body.map((para) => (
                <p key={para}>{para}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
