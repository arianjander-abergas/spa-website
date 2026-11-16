import { describe, expect, it } from "vitest";
import {
  addDays,
  formatClock,
  formatDuration,
  hourInTz,
  spaLocalToIso,
  toYmd,
  weekdayOf,
  ymdInTz,
} from "./format";

// The site is configured for Asia/Manila (UTC+8, no daylight saving).

describe("calendar dates", () => {
  it("adds days across month and year ends", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("finds the last day of a month with day 0 of the next", () => {
    expect(toYmd(2026, 12, 0)).toBe("2026-11-30");
    expect(toYmd(2028, 3, 0)).toBe("2028-02-29");
  });

  it("knows the weekday", () => {
    expect(weekdayOf("2026-11-15")).toBe(0); // Sunday
    expect(weekdayOf("2026-11-21")).toBe(6); // Saturday
  });
});

describe("spa time zone", () => {
  it("gives the spa's date, not the visitor's", () => {
    // 17:00 UTC on the 15th is already 01:00 on the 16th in Manila.
    expect(ymdInTz("2026-11-15T17:00:00Z")).toBe("2026-11-16");
    expect(hourInTz("2026-11-15T17:00:00Z")).toBe(1);
  });

  it("converts a spa wall-clock time to the exact instant", () => {
    expect(spaLocalToIso("2026-11-21T14:30")).toBe("2026-11-21T06:30:00.000Z");
    expect(spaLocalToIso("2026-11-21T00:00")).toBe("2026-11-20T16:00:00.000Z");
  });
});

describe("labels", () => {
  it("formats durations", () => {
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(60)).toBe("1 hr");
    expect(formatDuration(90)).toBe("1 hr 30 min");
  });

  it("formats opening times", () => {
    expect(formatClock("10:00:00")).toBe("10 AM");
    expect(formatClock("17:30:00")).toBe("5:30 PM");
    expect(formatClock("12:00:00")).toBe("12 PM");
  });
});
