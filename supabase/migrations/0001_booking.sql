-- Spa booking schema.
-- Public visitors may read the menu and call the booking functions below.
-- Everything else (bookings, guest details, time off) is staff-only.

create extension if not exists btree_gist;

-- ---------------------------------------------------------------- tables

-- One row of booking rules.
create table settings (
  id boolean primary key default true check (id),
  timezone text not null default 'Asia/Manila',
  slot_interval_min int not null default 30 check (slot_interval_min between 5 and 240),
  min_notice_min int not null default 120 check (min_notice_min >= 0), -- how close to now a slot may be booked
  max_days_ahead int not null default 60 check (max_days_ahead between 1 and 365),
  cancel_window_hours int not null default 24 check (cancel_window_hours >= 0),
  hold_minutes int not null default 30 check (hold_minutes between 5 and 1440)
);
insert into settings default values;

create table services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null,
  summary text not null default '',
  description text not null default '',
  duration_min int not null check (duration_min between 5 and 600),
  price_cents int not null check (price_cents >= 0),
  image text,
  sort int not null default 0,
  active boolean not null default true
);

create table staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean not null default true
);

create table staff_services (
  staff_id uuid not null references staff on delete cascade,
  service_id uuid not null references services on delete cascade,
  primary key (staff_id, service_id)
);

create table opening_hours (
  weekday int primary key check (weekday between 0 and 6), -- 0 = Sunday
  opens time not null default '10:00',
  closes time not null default '20:00',
  closed boolean not null default false,
  check (closes > opens)
);

-- Blocks of time that cannot be booked. staff_id null = the whole spa is closed.
create table time_off (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references staff on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  check (ends_at > starts_at)
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services,
  staff_id uuid not null references staff,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  during tstzrange generated always as (tstzrange(starts_at, ends_at, '[)')) stored,
  guest_name text not null,
  guest_email text not null,
  guest_phone text not null,
  note text,
  status text not null default 'confirmed'
    check (status in ('confirmed', 'pending_payment', 'cancelled', 'completed', 'no_show')),
  payment_method text not null default 'at_spa' check (payment_method in ('at_spa', 'online')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'refunded')),
  price_cents int not null,
  hold_expires_at timestamptz,
  payment_ref text,
  manage_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),

  -- The guarantee: one therapist can never hold two live bookings that overlap.
  constraint no_double_booking exclude using gist (staff_id with =, during with &&)
    where (status in ('confirmed', 'pending_payment'))
);
create index bookings_starts_at_idx on bookings (starts_at);
create index bookings_email_idx on bookings (lower(guest_email));

-- Staff accounts allowed into the admin.
create table admins (
  user_id uuid primary key references auth.users on delete cascade
);

-- ------------------------------------------------------------- functions

create function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- Therapists who can perform the service and are free for the whole period.
create function free_staff(p_service uuid, p_start timestamptz, p_end timestamptz, p_staff uuid default null)
returns setof uuid
language sql stable security definer set search_path = public as $$
  select st.id
  from staff st
  join staff_services ss on ss.staff_id = st.id and ss.service_id = p_service
  where st.active
    and (p_staff is null or st.id = p_staff)
    and not exists (
      select 1 from bookings b
      where b.staff_id = st.id
        and b.status in ('confirmed', 'pending_payment')
        and not (b.status = 'pending_payment' and b.hold_expires_at < now())
        and b.during && tstzrange(p_start, p_end, '[)')
    )
    and not exists (
      select 1 from time_off t
      where (t.staff_id = st.id or t.staff_id is null)
        and tstzrange(t.starts_at, t.ends_at, '[)') && tstzrange(p_start, p_end, '[)')
    );
$$;

-- Bookable start times for a service on one calendar day (spa time zone).
create function get_available_slots(p_service uuid, p_date date, p_staff uuid default null)
returns table (slot timestamptz)
language sql stable security definer set search_path = public as $$
  with cfg as (select * from settings),
  svc as (select duration_min from services where id = p_service and active),
  cand as (
    select (g at time zone cfg.timezone) as s, svc.duration_min as dur
    from cfg, svc, opening_hours oh,
      generate_series(
        p_date + oh.opens,
        p_date + oh.closes - make_interval(mins => svc.duration_min), -- must finish by closing
        make_interval(mins => cfg.slot_interval_min)
      ) g
    where oh.weekday = extract(dow from p_date)::int
      and not oh.closed
      and p_date <= (now() at time zone cfg.timezone)::date + cfg.max_days_ahead
  )
  select c.s
  from cand c, cfg
  where c.s >= now() + make_interval(mins => cfg.min_notice_min)
    and exists (select 1 from free_staff(p_service, c.s, c.s + make_interval(mins => c.dur), p_staff))
  order by c.s;
$$;

-- Days in a range that still have at least one free slot (for the calendar).
create function get_available_days(p_service uuid, p_from date, p_to date, p_staff uuid default null)
returns setof date
language sql stable security definer set search_path = public as $$
  select p_from + i
  from generate_series(0, least(p_to - p_from, 62)) i
  where exists (select 1 from get_available_slots(p_service, p_from + i, p_staff));
$$;

-- Creates a booking. Raises SLOT_UNAVAILABLE if the time has just been taken.
create function create_booking(
  p_service uuid,
  p_start timestamptz,
  p_staff uuid,
  p_name text,
  p_email text,
  p_phone text,
  p_note text default null,
  p_payment_method text default 'at_spa'
) returns json
language plpgsql security definer set search_path = public as $$
declare
  cfg settings;
  svc services;
  v_end timestamptz;
  v_staff uuid;
  v_row bookings;
begin
  select * into cfg from settings;
  select * into svc from services where id = p_service and active;
  if not found then raise exception 'SERVICE_NOT_FOUND'; end if;

  if length(trim(coalesce(p_name, ''))) < 2
     or coalesce(p_email, '') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
     or length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) < 7
     or length(coalesce(p_note, '')) > 1000
     or p_payment_method not in ('at_spa', 'online') then
    raise exception 'INVALID_DETAILS';
  end if;

  -- Release slots whose online payment was never completed.
  update bookings set status = 'cancelled'
  where status = 'pending_payment' and hold_expires_at < now();

  -- A little protection against one person filling the diary.
  if (select count(*) from bookings
      where lower(guest_email) = lower(trim(p_email))
        and status in ('confirmed', 'pending_payment')
        and starts_at > now()) >= 4 then
    raise exception 'TOO_MANY_BOOKINGS';
  end if;

  if not exists (
    select 1 from get_available_slots(p_service, (p_start at time zone cfg.timezone)::date, p_staff) s
    where s.slot = p_start
  ) then
    raise exception 'SLOT_UNAVAILABLE';
  end if;

  v_end := p_start + make_interval(mins => svc.duration_min);

  -- Try each free therapist, least busy that day first. If someone else takes
  -- the slot at the same instant the constraint rejects us and we try the next.
  for v_staff in
    select f from free_staff(p_service, p_start, v_end, p_staff) f
    order by (
      select count(*) from bookings b
      where b.staff_id = f
        and b.status in ('confirmed', 'pending_payment')
        and (b.starts_at at time zone cfg.timezone)::date = (p_start at time zone cfg.timezone)::date
    ), random()
  loop
    begin
      insert into bookings (
        service_id, staff_id, starts_at, ends_at, guest_name, guest_email, guest_phone, note,
        status, payment_method, price_cents, hold_expires_at
      ) values (
        p_service, v_staff, p_start, v_end, trim(p_name), lower(trim(p_email)), trim(p_phone),
        nullif(trim(coalesce(p_note, '')), ''),
        case when p_payment_method = 'online' then 'pending_payment' else 'confirmed' end,
        p_payment_method, svc.price_cents,
        case when p_payment_method = 'online' then now() + make_interval(mins => cfg.hold_minutes) end
      ) returning * into v_row;
      exit;
    exception when exclusion_violation then
      null; -- taken a moment ago; try the next therapist
    end;
  end loop;

  if v_row.id is null then raise exception 'SLOT_UNAVAILABLE'; end if;

  return json_build_object('id', v_row.id, 'manage_token', v_row.manage_token, 'status', v_row.status);
end;
$$;

-- A guest's own booking, looked up by the private token in their email.
create function get_booking(p_token uuid) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'id', b.id,
    'manage_token', b.manage_token,
    'status', b.status,
    'payment_method', b.payment_method,
    'payment_status', b.payment_status,
    'starts_at', b.starts_at,
    'ends_at', b.ends_at,
    'price_cents', b.price_cents,
    'guest_name', b.guest_name,
    'guest_email', b.guest_email,
    'guest_phone', b.guest_phone,
    'note', b.note,
    'service_id', s.id,
    'service_name', s.name,
    'service_slug', s.slug,
    'duration_min', s.duration_min,
    'staff_id', st.id,
    'staff_name', st.name,
    'can_change', b.status = 'confirmed'
      and b.starts_at > now() + make_interval(hours => (select cancel_window_hours from settings))
  )
  from bookings b
  join services s on s.id = b.service_id
  join staff st on st.id = b.staff_id
  where b.manage_token = p_token;
$$;

create function cancel_booking(p_token uuid) returns json
language plpgsql security definer set search_path = public as $$
declare
  b bookings;
begin
  select * into b from bookings where manage_token = p_token for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if b.status = 'cancelled' then return get_booking(p_token); end if;
  if b.status <> 'confirmed'
     or b.starts_at <= now() + make_interval(hours => (select cancel_window_hours from settings)) then
    raise exception 'TOO_LATE';
  end if;
  update bookings set status = 'cancelled' where id = b.id;
  return get_booking(p_token);
end;
$$;

create function reschedule_booking(p_token uuid, p_start timestamptz) returns json
language plpgsql security definer set search_path = public as $$
declare
  cfg settings;
  b bookings;
  v_end timestamptz;
  v_staff uuid;
  v_done boolean := false;
begin
  select * into cfg from settings;
  select * into b from bookings where manage_token = p_token for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if b.status <> 'confirmed'
     or b.starts_at <= now() + make_interval(hours => cfg.cancel_window_hours) then
    raise exception 'TOO_LATE';
  end if;

  -- Step the booking aside so its own time counts as free, then look again.
  -- Any exception below rolls this back.
  update bookings set status = 'cancelled' where id = b.id;

  if not exists (
    select 1 from get_available_slots(b.service_id, (p_start at time zone cfg.timezone)::date, null) s
    where s.slot = p_start
  ) then
    raise exception 'SLOT_UNAVAILABLE';
  end if;

  v_end := p_start + (b.ends_at - b.starts_at);

  for v_staff in
    select f from free_staff(b.service_id, p_start, v_end, null) f
    order by (f = b.staff_id) desc -- keep the same therapist when possible
  loop
    begin
      update bookings
      set starts_at = p_start, ends_at = v_end, staff_id = v_staff, status = 'confirmed'
      where id = b.id;
      v_done := true;
      exit;
    exception when exclusion_violation then
      null;
    end;
  end loop;

  if not v_done then raise exception 'SLOT_UNAVAILABLE'; end if;
  return get_booking(p_token);
end;
$$;

-- ----------------------------------------------------------- permissions

-- Functions are callable by everyone by default; close ours, then open the
-- ones guests need. free_staff stays internal.
revoke execute on function
  is_admin(),
  free_staff(uuid, timestamptz, timestamptz, uuid),
  get_available_slots(uuid, date, uuid),
  get_available_days(uuid, date, date, uuid),
  create_booking(uuid, timestamptz, uuid, text, text, text, text, text),
  get_booking(uuid),
  cancel_booking(uuid),
  reschedule_booking(uuid, timestamptz)
from public, anon, authenticated;
grant execute on function
  is_admin(),
  get_available_slots(uuid, date, uuid),
  get_available_days(uuid, date, date, uuid),
  create_booking(uuid, timestamptz, uuid, text, text, text, text, text),
  get_booking(uuid),
  cancel_booking(uuid),
  reschedule_booking(uuid, timestamptz)
to anon, authenticated;

alter table settings enable row level security;
alter table services enable row level security;
alter table staff enable row level security;
alter table staff_services enable row level security;
alter table opening_hours enable row level security;
alter table time_off enable row level security;
alter table bookings enable row level security;
alter table admins enable row level security;

grant select on settings, services, staff, staff_services, opening_hours to anon, authenticated;
grant insert, update, delete on settings, services, staff, staff_services, opening_hours to authenticated;
grant select, insert, update, delete on time_off, bookings to authenticated;

-- Anyone may read the menu.
create policy "public reads settings" on settings for select using (true);
create policy "public reads active services" on services for select using (active or (select is_admin()));
create policy "public reads staff" on staff for select using (true);
create policy "public reads staff services" on staff_services for select using (true);
create policy "public reads opening hours" on opening_hours for select using (true);

-- Only staff may change anything, or see bookings and time off.
create policy "staff manage settings" on settings for all to authenticated
  using ((select is_admin())) with check ((select is_admin()));
create policy "staff manage services" on services for all to authenticated
  using ((select is_admin())) with check ((select is_admin()));
create policy "staff manage staff" on staff for all to authenticated
  using ((select is_admin())) with check ((select is_admin()));
create policy "staff manage staff services" on staff_services for all to authenticated
  using ((select is_admin())) with check ((select is_admin()));
create policy "staff manage opening hours" on opening_hours for all to authenticated
  using ((select is_admin())) with check ((select is_admin()));
create policy "staff manage time off" on time_off for all to authenticated
  using ((select is_admin())) with check ((select is_admin()));
create policy "staff manage bookings" on bookings for all to authenticated
  using ((select is_admin())) with check ((select is_admin()));
-- admins: no policies, so it cannot be read or changed through the API at all.
