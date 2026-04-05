create table if not exists icwa_agents (
  id                    serial primary key,
  name                  text not null,
  primary_region        text,
  icwa_designated_agent text,
  icwa_contact_title    text,
  icwa_phone_1          text,
  icwa_phone_2          text,
  icwa_fax              text,
  icwa_email_1          text,
  icwa_email_2          text,
  icwa_street_1         text,
  icwa_street_2         text,
  icwa_city             text,
  icwa_state            text,
  icwa_zip_code         text,
  state_full            text,
  tribe_affiliations    text,
  bia_objectid          integer unique,
  updated_at            timestamptz default now()
);

-- Index for common searches
create index if not exists idx_icwa_agents_name on icwa_agents using gin(to_tsvector('english', name));
create index if not exists idx_icwa_agents_region on icwa_agents(primary_region);
create index if not exists idx_icwa_agents_state on icwa_agents(state_full);

-- Allow public read access (no auth required for directory)
alter table icwa_agents enable row level security;
create policy "Public read" on icwa_agents for select using (true);
