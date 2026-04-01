-- Hospital Finder Migration
-- Run this in the Supabase SQL editor after blood_donors_migration.sql

-- Extended hospital table for the Find Hospital feature
-- (separate from the static HOSPITALS constant used by the emergency Hospitals screen)
create table if not exists hospital_finder (
  id            uuid          primary key default gen_random_uuid(),
  name_en       text          not null,
  name_ne       text          not null,
  phone         text          not null,
  emergency_phone text,
  hospital_type text          not null default 'government'
                              check (hospital_type in ('government', 'private', 'ngo')),
  specialities  text[]        not null default '{}',
  lat           double precision not null,
  lng           double precision not null,
  address_en    text          not null,
  address_ne    text          not null,
  opd_hours_en  text          not null default 'Sun–Fri 9am–5pm',
  opd_hours_ne  text          not null default 'आइत–शुक्र बिहान ९–साँझ ५',
  is_24hr_emergency boolean   not null default false,
  consultation_fee_min  integer,
  consultation_fee_max  integer,
  rating        numeric(3,2)  not null default 0,
  review_count  integer       not null default 0,
  created_at    timestamptz   not null default now()
);

-- Community-reported price estimates
create table if not exists hospital_prices (
  id            uuid          primary key default gen_random_uuid(),
  hospital_id   uuid          not null references hospital_finder(id) on delete cascade,
  service_en    text          not null,
  service_ne    text          not null default '',
  price_min     integer       not null,
  price_max     integer       not null,
  reported_by   uuid          references users(id) on delete set null,
  verified      boolean       not null default false,
  created_at    timestamptz   not null default now()
);

-- User reviews
create table if not exists hospital_reviews (
  id            uuid          primary key default gen_random_uuid(),
  hospital_id   uuid          not null references hospital_finder(id) on delete cascade,
  reviewer_id   uuid          references users(id) on delete set null,
  rating        integer       not null check (rating between 1 and 5),
  comment_en    text          not null default '',
  comment_ne    text          not null default '',
  created_at    timestamptz   not null default now()
);

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table hospital_finder  enable row level security;
alter table hospital_prices  enable row level security;
alter table hospital_reviews enable row level security;

-- Anyone can read
create policy "public read hospital_finder"
  on hospital_finder for select using (true);

create policy "public read hospital_prices"
  on hospital_prices for select using (true);

create policy "public read hospital_reviews"
  on hospital_reviews for select using (true);

-- Anyone can contribute prices and reviews (anon + authenticated)
create policy "anon insert hospital_prices"
  on hospital_prices for insert with check (true);

create policy "anon insert hospital_reviews"
  on hospital_reviews for insert with check (true);

-- ── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists hospital_finder_specialities_idx
  on hospital_finder using gin(specialities);

create index if not exists hospital_finder_type_idx
  on hospital_finder(hospital_type);

create index if not exists hospital_prices_hospital_id_idx
  on hospital_prices(hospital_id);

create index if not exists hospital_reviews_hospital_id_idx
  on hospital_reviews(hospital_id);

-- ── Trigger: auto-update rating when review is added ────────────────────────
create or replace function update_hospital_rating()
returns trigger as $$
begin
  update hospital_finder
  set
    rating       = (select coalesce(avg(rating), 0) from hospital_reviews where hospital_id = coalesce(new.hospital_id, old.hospital_id)),
    review_count = (select count(*) from hospital_reviews where hospital_id = coalesce(new.hospital_id, old.hospital_id))
  where id = coalesce(new.hospital_id, old.hospital_id);
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger update_hospital_rating_trigger
  after insert or update or delete on hospital_reviews
  for each row execute function update_hospital_rating();
