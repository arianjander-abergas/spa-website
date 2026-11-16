import nodemailer from "nodemailer";
import { site } from "@/content/site";
import { formatDate, formatDuration, formatPrice, formatTime } from "@/lib/format";
import type { GuestBooking } from "@/lib/types";

const user = process.env.GMAIL_USER;
const pass = process.env.GMAIL_APP_PASSWORD;

export const hasEmail = Boolean(user && pass);

const transport = hasEmail
  ? nodemailer.createTransport({ service: "gmail", auth: { user, pass } })
  : null;

type Kind = "confirmed" | "moved" | "cancelled";

const subjects: Record<Kind, string> = {
  confirmed: "Your booking is confirmed",
  moved: "Your booking has been moved",
  cancelled: "Your booking has been cancelled",
};

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function guestHtml(kind: Kind, b: GuestBooking) {
  const manageUrl = `${site.url}/booking/${b.manage_token}`;
  const intro: Record<Kind, string> = {
    confirmed: "Thank you for booking with us. We look forward to seeing you.",
    moved: "Your booking has been moved. Your new time is below.",
    cancelled: "Your booking has been cancelled. We hope to see you another time.",
  };
  const row = (label: string, value: string) =>
    `<tr><td style="padding:10px 0;border-bottom:1px solid #e7e2da;color:#6b655c;width:110px">${label}</td><td style="padding:10px 0;border-bottom:1px solid #e7e2da">${escapeHtml(value)}</td></tr>`;

  return `<!doctype html><html><body style="margin:0;background:#faf8f5;font-family:Helvetica,Arial,sans-serif;color:#1a1a18;font-size:15px;line-height:1.6">
<div style="max-width:520px;margin:0 auto;padding:40px 24px">
  <p style="font-family:Georgia,serif;font-size:26px;margin:0 0 28px">${escapeHtml(site.name)}</p>
  <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:24px;margin:0 0 12px">${subjects[kind]}</h1>
  <p style="margin:0 0 24px">Dear ${escapeHtml(b.guest_name)},<br>${intro[kind]}</p>
  <table style="width:100%;border-collapse:collapse;border-top:1px solid #e7e2da">
    ${row("Treatment", `${b.service_name} (${formatDuration(b.duration_min)})`)}
    ${row("Date", formatDate(b.starts_at))}
    ${row("Time", formatTime(b.starts_at))}
    ${row("Therapist", b.staff_name)}
    ${row("Price", `${formatPrice(b.price_cents)} — ${b.payment_status === "paid" ? "paid" : "pay at the spa"}`)}
    ${row("Where", site.addressLines.join(", "))}
  </table>
  ${
    kind === "cancelled"
      ? `<p style="margin:28px 0 0"><a href="${site.url}/book" style="color:#1a1a18">Book another time</a></p>`
      : `<p style="margin:28px 0 8px">Please arrive ten minutes early.</p>
  <p style="margin:0 0 28px">Need to change something? You can move or cancel free of charge up to ${site.cancelWindowHours} hours before your appointment.</p>
  <p style="margin:0"><a href="${manageUrl}" style="display:inline-block;background:#1a1a18;color:#faf8f5;text-decoration:none;padding:14px 26px;font-size:13px;letter-spacing:2px;text-transform:uppercase">Manage booking</a></p>`
  }
  <p style="margin:40px 0 0;color:#6b655c;font-size:13px">${escapeHtml(site.name)} ${escapeHtml(site.descriptor)} · ${escapeHtml(site.phone)}</p>
</div></body></html>`;
}

function guestText(kind: Kind, b: GuestBooking) {
  return [
    subjects[kind],
    "",
    `${b.service_name} (${formatDuration(b.duration_min)})`,
    `${formatDate(b.starts_at)} at ${formatTime(b.starts_at)}`,
    `Therapist: ${b.staff_name}`,
    `Price: ${formatPrice(b.price_cents)}`,
    "",
    kind === "cancelled" ? `Book again: ${site.url}/book` : `Manage your booking: ${site.url}/booking/${b.manage_token}`,
    "",
    `${site.name} ${site.descriptor} · ${site.phone}`,
  ].join("\n");
}

/**
 * Emails the guest, and tells the spa. Never throws: a booking must not fail
 * because an email could not be sent.
 */
export async function sendBookingEmails(kind: Kind, b: GuestBooking): Promise<void> {
  if (!transport) {
    console.info(`[email] not configured — skipped "${kind}" email for booking ${b.id}`);
    return;
  }
  const from = `"${site.name} ${site.descriptor}" <${user}>`;
  const when = `${formatDate(b.starts_at)}, ${formatTime(b.starts_at)}`;
  try {
    await Promise.all([
      transport.sendMail({
        from,
        to: b.guest_email,
        subject: `${subjects[kind]} — ${site.name}`,
        text: guestText(kind, b),
        html: guestHtml(kind, b),
      }),
      transport.sendMail({
        from,
        to: process.env.NOTIFY_EMAIL || user,
        replyTo: b.guest_email,
        subject: `Booking ${kind}: ${b.service_name}, ${when}`,
        text: [
          `Booking ${kind}`,
          "",
          `${b.service_name} with ${b.staff_name}`,
          when,
          "",
          `${b.guest_name}`,
          `${b.guest_email}`,
          `${b.guest_phone}`,
          b.note ? `Note: ${b.note}` : "",
          "",
          `${site.url}/admin`,
        ].join("\n"),
      }),
    ]);
  } catch (err) {
    console.error("[email] failed to send", err);
  }
}
