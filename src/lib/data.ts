import { cacheLife, cacheTag } from "next/cache";
import { sampleHours, sampleServices, sampleStaff } from "@/content/sample";
import { hasSupabase, publicClient } from "@/lib/supabase/public";
import type { OpeningHours, Service, StaffMember } from "@/lib/types";

/**
 * The public menu. Cached, and refreshed the moment staff edit it in the
 * admin (see updateTag("catalog") in the admin actions).
 */
export async function getServices(): Promise<Service[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  if (!hasSupabase) return sampleServices;
  const { data, error } = await publicClient()
    .from("services")
    .select("*")
    .eq("active", true)
    .order("sort");
  if (error) throw new Error(error.message);
  return data as Service[];
}

export async function getService(slug: string): Promise<Service | null> {
  const all = await getServices();
  return all.find((s) => s.slug === slug) ?? null;
}

export async function getStaff(): Promise<StaffMember[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  if (!hasSupabase) return sampleStaff;
  const { data, error } = await publicClient()
    .from("staff")
    .select("id, name, active")
    .eq("active", true)
    .order("name");
  if (error) throw new Error(error.message);
  return data as StaffMember[];
}

/** Which therapists can perform which treatment: { serviceId: staffId[] } */
export async function getStaffServices(): Promise<Record<string, string[]>> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  if (!hasSupabase) {
    return Object.fromEntries(sampleServices.map((s) => [s.id, sampleStaff.map((t) => t.id)]));
  }
  const { data, error } = await publicClient().from("staff_services").select("staff_id, service_id");
  if (error) throw new Error(error.message);
  const map: Record<string, string[]> = {};
  for (const row of data) (map[row.service_id] ??= []).push(row.staff_id);
  return map;
}

export async function getOpeningHours(): Promise<OpeningHours[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  if (!hasSupabase) return sampleHours;
  const { data, error } = await publicClient().from("opening_hours").select("*").order("weekday");
  if (error) throw new Error(error.message);
  return data as OpeningHours[];
}

/** How far ahead guests may book (set in the settings table). */
export async function getMaxDaysAhead(): Promise<number> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  if (!hasSupabase) return 60;
  const { data, error } = await publicClient().from("settings").select("max_days_ahead").single();
  if (error) throw new Error(error.message);
  return data.max_days_ahead as number;
}

export function groupByCategory(services: Service[]): [string, Service[]][] {
  const groups = new Map<string, Service[]>();
  for (const s of services) {
    if (!groups.has(s.category)) groups.set(s.category, []);
    groups.get(s.category)!.push(s);
  }
  return [...groups.entries()];
}
