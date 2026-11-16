"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { site } from "@/content/site";
import { createBooking, type FieldErrors } from "@/lib/booking";
import { formatDuration, formatPrice, formatTime, formatYmd } from "@/lib/format";
import type { Service, StaffMember } from "@/lib/types";
import { DateTimePicker } from "./DateTimePicker";

type Props = {
  services: Service[];
  staff: StaffMember[];
  /** { serviceId: staffId[] } */
  staffServices: Record<string, string[]>;
  maxDaysAhead: number;
};

type Details = { name: string; email: string; phone: string; note: string };

const STEPS = ["Treatment", "Date & time", "Your details", "Confirm"] as const;

export function BookingFlow(props: Props) {
  // ?service=slug comes from the "Book" links on treatment cards.
  const preselected = useSearchParams().get("service");
  return <Flow {...props} preselectedSlug={preselected} />;
}

function Flow({ services, staff, staffServices, maxDaysAhead, preselectedSlug }: Props & { preselectedSlug: string | null }) {
  const router = useRouter();
  const initial = services.find((s) => s.slug === preselectedSlug) ?? null;

  const [step, setStep] = useState(initial ? 2 : 1);
  const [serviceId, setServiceId] = useState<string | null>(initial?.id ?? null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [details, setDetails] = useState<Details>({ name: "", email: "", phone: "", note: "" });
  const [honeypot, setHoneypot] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [pending, startTransition] = useTransition();

  const service = services.find((s) => s.id === serviceId) ?? null;
  const therapists = service ? staff.filter((t) => staffServices[service.id]?.includes(t.id)) : [];
  const therapist = staff.find((t) => t.id === staffId) ?? null;

  // Move focus to the step heading on each step change, so keyboard and
  // screen-reader users land in the right place.
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    document.getElementById("booking-top")?.scrollIntoView({ block: "start" });
  }, [step]);

  const goTo = (n: number) => {
    setNotice(null);
    setStep(n);
  };

  const chooseService = (s: Service) => {
    if (s.id !== serviceId) {
      setServiceId(s.id);
      setStaffId(null);
      setDate(null);
      setSlot(null);
    }
    goTo(2);
  };

  const validateDetails = (): boolean => {
    const errors: FieldErrors = {};
    if (details.name.trim().length < 2) errors.name = "Please enter your full name.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(details.email.trim()))
      errors.email = "Enter an email address like name@example.com.";
    if (details.phone.replace(/\D/g, "").length < 7) errors.phone = "Enter a phone number we can reach you on.";
    if (details.note.length > 500) errors.note = "Please keep your note under 500 characters.";
    setFieldErrors(errors);
    const first = Object.keys(errors)[0];
    if (first) document.getElementById(`field-${first}`)?.focus();
    return !first;
  };

  const confirm = () => {
    if (!service || !slot) return;
    setNotice(null);
    startTransition(async () => {
      const result = await createBooking({
        serviceId: service.id,
        staffId,
        start: slot,
        name: details.name,
        email: details.email.trim(),
        phone: details.phone,
        note: details.note || undefined,
        website: honeypot,
      }).catch(() => ({ ok: false as const, code: "ERROR" as const }));

      if (result.ok) {
        router.push(`/book/confirmed/${result.token}`);
        return;
      }
      switch (result.code) {
        case "SLOT_UNAVAILABLE":
          // Someone took the time while this guest was deciding. Keep
          // everything else and bring them back to pick another time.
          setSlot(null);
          setRefreshKey((k) => k + 1);
          setStep(2);
          setNotice("Sorry — that time has just been taken. Please choose another; your details are saved.");
          break;
        case "INVALID_DETAILS":
          setFieldErrors("fieldErrors" in result && result.fieldErrors ? result.fieldErrors : {});
          setStep(3);
          setNotice("Please check your details and try again.");
          break;
        case "TOO_MANY_BOOKINGS":
          setNotice(`You already have several upcoming bookings. To add more, please call us on ${site.phone}.`);
          break;
        default:
          setNotice(`Something went wrong and your booking was not made. Please try again, or call us on ${site.phone}.`);
      }
    });
  };

  return (
    <div id="booking-top" className="scroll-mt-24">
      {/* Progress */}
      <ol className="flex gap-2 sm:gap-3" aria-label="Booking progress">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = n < step;
          const current = n === step;
          return (
            <li key={label} className="flex-1">
              <button
                type="button"
                disabled={!done || pending}
                onClick={() => goTo(n)}
                aria-current={current ? "step" : undefined}
                className={`block w-full border-t-2 pt-3 text-left transition-colors ${
                  current ? "border-ink" : done ? "border-brass hover:border-ink" : "border-line"
                }`}
              >
                <span className="eyebrow block">Step {n}</span>
                <span className={`mt-1 hidden text-sm sm:block ${current || done ? "text-ink" : "text-mist"}`}>
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_20rem] lg:gap-16">
        <div key={step} className="step-enter min-w-0">
          {notice && (
            <p role="alert" className="mb-8 border-l-2 border-error bg-white px-4 py-3 text-sm">
              {notice}
            </p>
          )}

          {/* Step 1 — treatment */}
          {step === 1 && (
            <section aria-labelledby="step-heading">
              <StepHeading ref={headingRef}>Choose a treatment</StepHeading>
              <div className="mt-8 space-y-10">
                {groupByCategory(services).map(([category, list]) => (
                  <div key={category}>
                    <h3 className="eyebrow mb-3">{category}</h3>
                    <ul className="border-t border-line">
                      {list.map((s) => {
                        const selected = s.id === serviceId;
                        return (
                          <li key={s.id} className="border-b border-line">
                            <button
                              type="button"
                              onClick={() => chooseService(s)}
                              aria-pressed={selected}
                              className={`group flex w-full items-center gap-4 px-3 py-5 text-left transition-colors hover:bg-white ${
                                selected ? "bg-white" : ""
                              }`}
                            >
                              <span className="min-w-0 flex-1">
                                <span className="block font-serif text-xl">{s.name}</span>
                                <span className="mt-1 block text-sm text-stone">{s.summary}</span>
                                <span className="mt-2 block text-sm tabular-nums sm:hidden">
                                  {formatDuration(s.duration_min)} <span className="mx-1 text-brass">·</span>{" "}
                                  {formatPrice(s.price_cents)}
                                </span>
                              </span>
                              <span className="hidden shrink-0 text-right text-sm tabular-nums sm:block">
                                <span className="block">{formatPrice(s.price_cents)}</span>
                                <span className="block text-stone">{formatDuration(s.duration_min)}</span>
                              </span>
                              <Chevron className={selected ? "text-ink" : "text-mist group-hover:text-ink"} />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Step 2 — date and time */}
          {step === 2 && service && (
            <section aria-labelledby="step-heading">
              <StepHeading ref={headingRef}>Choose a date and time</StepHeading>

              {therapists.length > 1 && (
                <div className="mt-8 max-w-xs">
                  <label htmlFor="therapist" className="field-label">
                    Therapist
                  </label>
                  <select
                    id="therapist"
                    className="field"
                    value={staffId ?? ""}
                    onChange={(e) => {
                      setStaffId(e.target.value || null);
                      setSlot(null);
                    }}
                  >
                    <option value="">No preference (most availability)</option>
                    {therapists.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mt-8">
                <DateTimePicker
                  serviceId={service.id}
                  staffId={staffId}
                  date={date}
                  slot={slot}
                  maxDaysAhead={maxDaysAhead}
                  refreshKey={refreshKey}
                  onDate={setDate}
                  onSlot={setSlot}
                />
              </div>

              <StepActions
                onBack={() => goTo(1)}
                next={
                  <Button disabled={!slot} onClick={() => goTo(3)} className="w-full sm:w-auto">
                    Continue
                  </Button>
                }
                hint={slot ? `${formatYmd(date!, { weekday: "short", month: "short" })}, ${formatTime(slot)}` : "Select a time to continue"}
              />
            </section>
          )}

          {/* Step 3 — details */}
          {step === 3 && (
            <section aria-labelledby="step-heading">
              <StepHeading ref={headingRef}>Your details</StepHeading>
              <p className="mt-3 text-sm text-stone">No account needed. We only use these to manage your booking.</p>
              <form
                noValidate
                className="mt-8 max-w-lg space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (validateDetails()) goTo(4);
                }}
              >
                <Field
                  id="name"
                  label="Full name"
                  autoComplete="name"
                  value={details.name}
                  error={fieldErrors.name}
                  onChange={(v) => setDetails({ ...details, name: v })}
                />
                <Field
                  id="email"
                  label="Email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  hint="Your confirmation is sent here."
                  value={details.email}
                  error={fieldErrors.email}
                  onChange={(v) => setDetails({ ...details, email: v })}
                />
                <Field
                  id="phone"
                  label="Mobile number"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  hint="Only used if we need to reach you about this booking."
                  value={details.phone}
                  error={fieldErrors.phone}
                  onChange={(v) => setDetails({ ...details, phone: v })}
                />
                <div>
                  <label htmlFor="field-note" className="field-label">
                    Anything we should know? <span className="font-normal text-stone">(optional)</span>
                  </label>
                  <textarea
                    id="field-note"
                    rows={3}
                    maxLength={500}
                    className="field"
                    placeholder="Injuries, allergies, pregnancy, pressure preference…"
                    value={details.note}
                    aria-invalid={Boolean(fieldErrors.note)}
                    aria-describedby={fieldErrors.note ? "error-note" : undefined}
                    onChange={(e) => setDetails({ ...details, note: e.target.value })}
                  />
                  {fieldErrors.note && (
                    <p id="error-note" className="mt-1.5 text-sm text-error">
                      {fieldErrors.note}
                    </p>
                  )}
                </div>

                {/* Hidden from people; bots that fill it in are ignored. */}
                <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label>
                    Website
                    <input
                      tabIndex={-1}
                      autoComplete="off"
                      name="website"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />
                  </label>
                </div>

                <StepActions
                  onBack={() => goTo(2)}
                  next={
                    <Button type="submit" className="w-full sm:w-auto">
                      Review booking
                    </Button>
                  }
                />
              </form>
            </section>
          )}

          {/* Step 4 — review and confirm */}
          {step === 4 && service && slot && (
            <section aria-labelledby="step-heading">
              <StepHeading ref={headingRef}>Review and confirm</StepHeading>

              <dl className="mt-8 border-t border-line">
                <ReviewRow label="Treatment" onChange={() => goTo(1)} disabled={pending}>
                  {service.name}
                  <span className="block text-sm text-stone">{formatDuration(service.duration_min)}</span>
                </ReviewRow>
                <ReviewRow label="When" onChange={() => goTo(2)} disabled={pending}>
                  {formatYmd(date!)}
                  <span className="block text-sm text-stone">
                    {formatTime(slot)} · {therapist ? `with ${therapist.name}` : "first available therapist"}
                  </span>
                </ReviewRow>
                <ReviewRow label="Your details" onChange={() => goTo(3)} disabled={pending}>
                  {details.name}
                  <span className="block break-words text-sm text-stone">
                    {details.email} · {details.phone}
                  </span>
                  {details.note && <span className="mt-1 block text-sm text-stone">“{details.note}”</span>}
                </ReviewRow>
                <div className="grid grid-cols-[7rem_1fr] gap-4 border-b border-line py-5">
                  <dt className="eyebrow pt-1">Payment</dt>
                  <dd>
                    {formatPrice(service.price_cents)}
                    <span className="block text-sm text-stone">Pay at the spa after your treatment. Nothing to pay now.</span>
                  </dd>
                </div>
              </dl>

              <p className="mt-6 text-sm text-stone">
                Free to cancel or move up to {site.cancelWindowHours} hours before.{" "}
                <Link href="/policies#cancellation" target="_blank" className="link">
                  Cancellation policy
                </Link>
              </p>

              <StepActions
                onBack={() => goTo(3)}
                backDisabled={pending}
                next={
                  <Button onClick={confirm} disabled={pending} className="w-full sm:w-auto" aria-live="polite">
                    {pending ? "Confirming…" : "Confirm booking"}
                  </Button>
                }
              />
            </section>
          )}
        </div>

        {/* Running summary */}
        {/* On phones a single line is enough; the full card would push the step down the screen. */}
        {service && (
          <p className="order-first -mb-6 border-b border-line pb-4 text-sm lg:hidden">
            <span className="font-medium">{service.name}</span>
            <span className="text-stone">
              {" "}
              · {formatDuration(service.duration_min)} · {formatPrice(service.price_cents)}
            </span>
          </p>
        )}
        <aside aria-label="Your booking" className="hidden lg:block">
          <div className="border border-line bg-white p-5 lg:sticky lg:top-28 lg:p-7">
            <h2 className="eyebrow">Your booking</h2>
            {service ? (
              <dl className="mt-4 space-y-4 text-sm lg:mt-5">
                <div>
                  <dt className="sr-only">Treatment</dt>
                  <dd className="font-serif text-xl leading-snug">{service.name}</dd>
                  <dd className="text-stone">{formatDuration(service.duration_min)}</dd>
                </div>
                {slot && date && (
                  <div>
                    <dt className="sr-only">When</dt>
                    <dd>{formatYmd(date)}</dd>
                    <dd className="text-stone">
                      {formatTime(slot)}
                      {therapist ? ` · ${therapist.name}` : ""}
                    </dd>
                  </div>
                )}
                <div className="flex items-baseline justify-between border-t border-line pt-4">
                  <dt className="text-stone">Total</dt>
                  <dd className="font-serif text-xl tabular-nums">{formatPrice(service.price_cents)}</dd>
                </div>
              </dl>
            ) : (
              <p className="mt-3 text-sm text-stone">Choose a treatment to begin.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- parts */

function StepHeading({ children, ref }: { children: React.ReactNode; ref: React.Ref<HTMLHeadingElement> }) {
  return (
    <h2 id="step-heading" ref={ref} tabIndex={-1} className="heading" style={{ outline: "none" }}>
      {children}
    </h2>
  );
}

function StepActions({
  onBack,
  backDisabled,
  next,
  hint,
}: {
  onBack: () => void;
  backDisabled?: boolean;
  next: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="mt-10 flex flex-col-reverse gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
      <button type="button" onClick={onBack} disabled={backDisabled} className="link min-h-11 self-start text-sm disabled:opacity-40">
        Back
      </button>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        {hint && <p className="text-sm text-stone">{hint}</p>}
        {next}
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  value,
  onChange,
  ...input
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
} & Omit<React.ComponentProps<"input">, "id" | "value" | "onChange">) {
  const describedBy = [error && `error-${id}`, hint && `hint-${id}`].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={`field-${id}`} className="field-label">
        {label}
      </label>
      <input
        id={`field-${id}`}
        className="field"
        required
        value={value}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        onChange={(e) => onChange(e.target.value)}
        {...input}
      />
      {error ? (
        <p id={`error-${id}`} className="mt-1.5 text-sm text-error">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`hint-${id}`} className="mt-1.5 text-sm text-stone">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

function ReviewRow({
  label,
  onChange,
  disabled,
  children,
}: {
  label: string;
  onChange: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[7rem_1fr_auto] gap-4 border-b border-line py-5">
      <dt className="eyebrow pt-1">{label}</dt>
      <dd className="min-w-0">{children}</dd>
      <dd>
        <button type="button" onClick={onChange} disabled={disabled} className="link text-sm disabled:opacity-40">
          Change<span className="sr-only"> {label.toLowerCase()}</span>
        </button>
      </dd>
    </div>
  );
}

function Chevron({ className = "" }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      aria-hidden
      className={`shrink-0 transition-colors ${className}`}
    >
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

function groupByCategory(services: Service[]): [string, Service[]][] {
  const groups = new Map<string, Service[]>();
  for (const s of services) {
    if (!groups.has(s.category)) groups.set(s.category, []);
    groups.get(s.category)!.push(s);
  }
  return [...groups.entries()];
}
