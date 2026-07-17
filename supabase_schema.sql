-- OwnerHub HRM - Supabase schema
-- Paste this whole file into Supabase Dashboard -> SQL Editor -> Run.

create extension if not exists pgcrypto;

do $$
begin
  create type candidate_status as enum (
    'new',
    'contact_attempted',
    'initial_contact',
    'qualified',
    'docs_requested',
    'docs_received',
    'quote_pending',
    'insurance_approved',
    'insurance_rejected',
    'offer_presented',
    'agreement_sent',
    'agreement_signed',
    'equipment_shipped',
    'inspection_pending',
    'safety_onboarding',
    'dispatch_onboarding',
    'ready_first_load',
    'first_load',
    'active',
    'lost'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type document_status as enum (
    'not_requested',
    'requested',
    'received',
    'review',
    'approved',
    'rejected',
    'expired'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type insurance_status as enum (
    'not_started',
    'pending',
    'approved',
    'rejected'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type followup_status as enum (
    'open',
    'done'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type equipment_type as enum (
    'truck',
    'trailer'
  );
exception when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'OwnerHub HRM',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id)
);

create table if not exists public.app_settings (
  id text primary key default ('settings_' || replace(gen_random_uuid()::text, '-', '')),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  company_name text not null default 'Sofia Logistics LLC',
  hub_name text not null default 'OwnerHub HRM',
  hr_name text not null default 'HR Manager',
  default_script_language text not null default 'ru',
  offer_profile jsonb not null default '{}'::jsonb,
  quo_api_key text not null default '',
  quo_sms_from text not null default '',
  welcome_sms_enabled boolean not null default false,
  welcome_sms_template text not null default 'Hello {{firstName}}, thank you for your application. We received your request, and our HR manager will contact you shortly.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_webhook_tokens (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null default 'Make',
  token_value text not null default '',
  token_hash text not null unique,
  token_preview text not null default '',
  active boolean not null default true,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_quo_webhooks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  label text not null default 'Quo',
  token_value text not null default '',
  token_hash text not null unique,
  token_preview text not null default '',
  signing_secret text not null default '',
  active boolean not null default true,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.candidates (
  id text primary key default ('cand_' || replace(gen_random_uuid()::text, '-', '')),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  first_name text not null default '',
  last_name text not null default '',
  phone text not null default '',
  email text not null default '',
  language text not null default 'Russian',
  source text not null default '',

  city text not null default '',
  state text not null default '',
  zip text not null default '',

  work_preference text not null default '',
  home_time text not null default '',
  start_date date,
  days_per_week integer,
  restrictions text not null default '',
  expected_gross text not null default '',

  cdl text not null default '',
  license_type text not null default '',
  experience_years numeric(5, 2),
  car_hauling_years numeric(5, 2),
  two_car_experience text not null default '',
  accidents text not null default '',
  violations text not null default '',
  medical_card text not null default '',
  previous_insurance_rejection text not null default '',

  status candidate_status not null default 'new',
  score integer not null default 50 check (score between 0 and 100),
  owner_name text not null default 'HR Manager',
  notes text not null default '',
  last_contact timestamptz,
  next_follow_up date,
  tags text[] not null default '{}',
  demo boolean not null default false
);

create table if not exists public.candidate_equipment (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  candidate_id text not null references public.candidates(id) on delete cascade,
  equipment_type equipment_type not null,

  make text not null default '',
  model text not null default '',
  year integer,
  vin text not null default '',
  gvwr text not null default '',
  fuel text not null default '',
  condition text not null default '',
  inspection text not null default '',

  length text not null default '',
  capacity text not null default '',
  body_type text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (candidate_id, equipment_type)
);

create table if not exists public.candidate_documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  candidate_id text not null references public.candidates(id) on delete cascade,
  document_type text not null check (
    document_type in (
      'license',
      'truckRegistration',
      'trailerRegistration',
      'medicalCard',
      'truckInspection',
      'trailerInspection',
      'w9',
      'voidedCheck',
      'leaseAgreement'
    )
  ),
  status document_status not null default 'not_requested',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (candidate_id, document_type)
);

create table if not exists public.candidate_insurance (
  candidate_id text primary key references public.candidates(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  status insurance_status not null default 'not_started',
  weekly_quote text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.candidate_call_state (
  candidate_id text primary key references public.candidates(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  step_id text not null default 'start',
  history jsonb not null default '[]'::jsonb,
  answers jsonb not null default '{}'::jsonb,
  completed boolean not null default false,
  language text not null default 'ru',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.call_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  candidate_id text not null references public.candidates(id) on delete cascade,
  outcome text not null default '',
  language text not null default 'ru',
  answers jsonb not null default '{}'::jsonb,
  notes text not null default '',
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.call_knowledge_items (
  id text primary key default ('kb_' || replace(gen_random_uuid()::text, '-', '')),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  category text not null default 'Custom',
  title text not null default '',
  content text not null default '',
  tags text[] not null default '{}',
  sort_order integer not null default 100,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.followups (
  id text primary key default ('fu_' || replace(gen_random_uuid()::text, '-', '')),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  candidate_id text not null references public.candidates(id) on delete cascade,
  followup_date date not null,
  followup_time time,
  type text not null default 'Call',
  note text not null default '',
  status followup_status not null default 'open',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activities (
  id text primary key default ('act_' || replace(gen_random_uuid()::text, '-', '')),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  candidate_id text references public.candidates(id) on delete cascade,
  type text not null default 'note',
  text text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.candidate_attachments (
  id text primary key default ('att_' || replace(gen_random_uuid()::text, '-', '')),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  candidate_id text references public.candidates(id) on delete cascade,
  source text not null default 'quo_message',
  message_id text not null default '',
  from_number text not null default '',
  to_number text not null default '',
  direction text not null default 'incoming',
  document_type text not null default '',
  file_name text not null default '',
  mime_type text not null default '',
  size_bytes integer,
  external_url text not null default '',
  storage_path text not null default '',
  notes text not null default '',
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (workspace_id, message_id, external_url)
);

create table if not exists public.quo_call_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  candidate_id text references public.candidates(id) on delete set null,
  call_id text not null,
  event_id text not null default '',
  event_type text not null default '',
  from_number text not null default '',
  to_number text not null default '',
  direction text not null default '',
  conversation_id text not null default '',
  phone_number_id text not null default '',
  user_id text not null default '',
  answered_at timestamptz,
  completed_at timestamptz,
  summary text[] not null default '{}',
  next_steps text[] not null default '{}',
  summary_imported_at timestamptz,
  recording_url text not null default '',
  recording_type text not null default '',
  recording_duration_seconds integer,
  recording_storage_path text not null default '',
  recording_imported_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, call_id)
);

alter table public.app_settings add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.app_settings add column if not exists offer_profile jsonb not null default '{}'::jsonb;
alter table public.app_settings add column if not exists quo_api_key text not null default '';
alter table public.app_settings add column if not exists quo_sms_from text not null default '';
alter table public.app_settings add column if not exists welcome_sms_enabled boolean not null default false;
alter table public.app_settings add column if not exists welcome_sms_template text not null default 'Hello {{firstName}}, thank you for your application. We received your request, and our HR manager will contact you shortly.';
alter table public.workspace_webhook_tokens add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.workspace_webhook_tokens add column if not exists token_value text not null default '';
alter table public.workspace_quo_webhooks add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.workspace_quo_webhooks add column if not exists token_value text not null default '';
alter table public.workspace_quo_webhooks add column if not exists signing_secret text not null default '';
alter table public.candidates add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.candidate_equipment add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.candidate_documents add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.candidate_insurance add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.candidate_call_state add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.call_sessions add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.call_knowledge_items add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.followups add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.activities add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.candidate_attachments add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.candidate_attachments add column if not exists source text not null default 'quo_message';
alter table public.candidate_attachments add column if not exists message_id text not null default '';
alter table public.candidate_attachments add column if not exists from_number text not null default '';
alter table public.candidate_attachments add column if not exists to_number text not null default '';
alter table public.candidate_attachments add column if not exists direction text not null default 'incoming';
alter table public.candidate_attachments add column if not exists document_type text not null default '';
alter table public.candidate_attachments add column if not exists file_name text not null default '';
alter table public.candidate_attachments add column if not exists mime_type text not null default '';
alter table public.candidate_attachments add column if not exists size_bytes integer;
alter table public.candidate_attachments add column if not exists external_url text not null default '';
alter table public.candidate_attachments add column if not exists storage_path text not null default '';
alter table public.candidate_attachments add column if not exists notes text not null default '';
alter table public.candidate_attachments add column if not exists raw_payload jsonb not null default '{}'::jsonb;
alter table public.quo_call_events add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.quo_call_events add column if not exists summary_imported_at timestamptz;
alter table public.quo_call_events add column if not exists recording_url text not null default '';
alter table public.quo_call_events add column if not exists recording_type text not null default '';
alter table public.quo_call_events add column if not exists recording_duration_seconds integer;
alter table public.quo_call_events add column if not exists recording_storage_path text not null default '';
alter table public.quo_call_events add column if not exists recording_imported_at timestamptz;

create unique index if not exists idx_app_settings_workspace_id_unique on public.app_settings(workspace_id);
create index if not exists idx_workspace_webhook_tokens_workspace_id on public.workspace_webhook_tokens(workspace_id);
create index if not exists idx_workspace_webhook_tokens_token_hash on public.workspace_webhook_tokens(token_hash);
create index if not exists idx_workspace_quo_webhooks_workspace_id on public.workspace_quo_webhooks(workspace_id);
create index if not exists idx_workspace_quo_webhooks_token_hash on public.workspace_quo_webhooks(token_hash);
create index if not exists idx_candidates_workspace_id on public.candidates(workspace_id);
create index if not exists idx_candidates_status on public.candidates(status);
create index if not exists idx_candidates_state on public.candidates(state);
create index if not exists idx_candidates_work_preference on public.candidates(work_preference);
create index if not exists idx_candidates_updated_at on public.candidates(updated_at desc);
create index if not exists idx_followups_workspace_id on public.followups(workspace_id);
create index if not exists idx_followups_candidate_id on public.followups(candidate_id);
create index if not exists idx_followups_open_date on public.followups(status, followup_date, followup_time);
create index if not exists idx_activities_workspace_id on public.activities(workspace_id);
create index if not exists idx_activities_candidate_id_created on public.activities(candidate_id, created_at desc);
create index if not exists idx_candidate_attachments_workspace_id on public.candidate_attachments(workspace_id);
create index if not exists idx_candidate_attachments_candidate_id_created on public.candidate_attachments(candidate_id, created_at desc);
create index if not exists idx_candidate_attachments_message_id on public.candidate_attachments(workspace_id, message_id);
create index if not exists idx_documents_candidate_id on public.candidate_documents(candidate_id);
create index if not exists idx_equipment_candidate_id on public.candidate_equipment(candidate_id);
create index if not exists idx_equipment_workspace_id on public.candidate_equipment(workspace_id);
create index if not exists idx_documents_workspace_id on public.candidate_documents(workspace_id);
create index if not exists idx_insurance_workspace_id on public.candidate_insurance(workspace_id);
create index if not exists idx_call_state_workspace_id on public.candidate_call_state(workspace_id);
create index if not exists idx_call_sessions_workspace_id on public.call_sessions(workspace_id);
create index if not exists idx_call_knowledge_items_workspace_id on public.call_knowledge_items(workspace_id);
create index if not exists idx_call_knowledge_items_category on public.call_knowledge_items(workspace_id, category, active);
create index if not exists idx_quo_call_events_workspace_id on public.quo_call_events(workspace_id);
create index if not exists idx_quo_call_events_call_id on public.quo_call_events(workspace_id, call_id);
create index if not exists idx_quo_call_events_candidate_id on public.quo_call_events(candidate_id);

create or replace function public.create_candidate_defaults()
returns trigger
language plpgsql
as $$
begin
  insert into public.candidate_equipment (workspace_id, candidate_id, equipment_type, capacity, body_type)
  values
    (new.workspace_id, new.id, 'truck', '', ''),
    (new.workspace_id, new.id, 'trailer', '2', 'Open')
  on conflict (candidate_id, equipment_type) do update
  set workspace_id = excluded.workspace_id;

  insert into public.candidate_documents (workspace_id, candidate_id, document_type)
  values
    (new.workspace_id, new.id, 'license'),
    (new.workspace_id, new.id, 'truckRegistration'),
    (new.workspace_id, new.id, 'trailerRegistration'),
    (new.workspace_id, new.id, 'medicalCard'),
    (new.workspace_id, new.id, 'truckInspection'),
    (new.workspace_id, new.id, 'trailerInspection'),
    (new.workspace_id, new.id, 'w9'),
    (new.workspace_id, new.id, 'voidedCheck'),
    (new.workspace_id, new.id, 'leaseAgreement')
  on conflict (candidate_id, document_type) do update
  set workspace_id = excluded.workspace_id;

  insert into public.candidate_insurance (workspace_id, candidate_id)
  values (new.workspace_id, new.id)
  on conflict (candidate_id) do update
  set workspace_id = excluded.workspace_id;

  insert into public.candidate_call_state (workspace_id, candidate_id)
  values (new.workspace_id, new.id)
  on conflict (candidate_id) do update
  set workspace_id = excluded.workspace_id;

  return new;
end;
$$;

drop trigger if exists set_updated_at_workspaces on public.workspaces;
create trigger set_updated_at_workspaces
before update on public.workspaces
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_app_settings on public.app_settings;
create trigger set_updated_at_app_settings
before update on public.app_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_workspace_webhook_tokens on public.workspace_webhook_tokens;
create trigger set_updated_at_workspace_webhook_tokens
before update on public.workspace_webhook_tokens
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_workspace_quo_webhooks on public.workspace_quo_webhooks;
create trigger set_updated_at_workspace_quo_webhooks
before update on public.workspace_quo_webhooks
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_candidates on public.candidates;
create trigger set_updated_at_candidates
before update on public.candidates
for each row execute function public.set_updated_at();

drop trigger if exists create_candidate_defaults_after_insert on public.candidates;
create trigger create_candidate_defaults_after_insert
after insert on public.candidates
for each row execute function public.create_candidate_defaults();

drop trigger if exists set_updated_at_candidate_equipment on public.candidate_equipment;
create trigger set_updated_at_candidate_equipment
before update on public.candidate_equipment
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_candidate_documents on public.candidate_documents;
create trigger set_updated_at_candidate_documents
before update on public.candidate_documents
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_candidate_insurance on public.candidate_insurance;
create trigger set_updated_at_candidate_insurance
before update on public.candidate_insurance
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_candidate_call_state on public.candidate_call_state;
create trigger set_updated_at_candidate_call_state
before update on public.candidate_call_state
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_followups on public.followups;
create trigger set_updated_at_followups
before update on public.followups
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_call_knowledge_items on public.call_knowledge_items;
create trigger set_updated_at_call_knowledge_items
before update on public.call_knowledge_items
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_candidate_attachments on public.candidate_attachments;
create trigger set_updated_at_candidate_attachments
before update on public.candidate_attachments
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_quo_call_events on public.quo_call_events;
create trigger set_updated_at_quo_call_events
before update on public.quo_call_events
for each row execute function public.set_updated_at();

alter table public.workspaces enable row level security;
alter table public.app_settings enable row level security;
alter table public.workspace_webhook_tokens enable row level security;
alter table public.workspace_quo_webhooks enable row level security;
alter table public.candidates enable row level security;
alter table public.candidate_equipment enable row level security;
alter table public.candidate_documents enable row level security;
alter table public.candidate_insurance enable row level security;
alter table public.candidate_call_state enable row level security;
alter table public.call_sessions enable row level security;
alter table public.call_knowledge_items enable row level security;
alter table public.candidate_attachments enable row level security;
alter table public.followups enable row level security;
alter table public.activities enable row level security;
alter table public.quo_call_events enable row level security;

drop policy if exists "authenticated all workspaces" on public.workspaces;
create policy "authenticated all workspaces"
on public.workspaces for all
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "authenticated read app_settings" on public.app_settings;
drop policy if exists "authenticated update app_settings" on public.app_settings;
drop policy if exists "authenticated insert app_settings" on public.app_settings;
drop policy if exists "authenticated all app_settings" on public.app_settings;
create policy "authenticated all app_settings"
on public.app_settings for all
to authenticated
using (
  exists (
    select 1 from public.workspaces w
    where w.id = app_settings.workspace_id
      and w.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.workspaces w
    where w.id = app_settings.workspace_id
      and w.owner_user_id = auth.uid()
  )
);

drop policy if exists "authenticated all workspace webhook tokens" on public.workspace_webhook_tokens;
create policy "authenticated all workspace webhook tokens"
on public.workspace_webhook_tokens for all
to authenticated
using (
  exists (
    select 1 from public.workspaces w
    where w.id = workspace_webhook_tokens.workspace_id
      and w.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.workspaces w
    where w.id = workspace_webhook_tokens.workspace_id
      and w.owner_user_id = auth.uid()
  )
);

drop policy if exists "authenticated all workspace quo webhooks" on public.workspace_quo_webhooks;
create policy "authenticated all workspace quo webhooks"
on public.workspace_quo_webhooks for all
to authenticated
using (
  exists (
    select 1 from public.workspaces w
    where w.id = workspace_quo_webhooks.workspace_id
      and w.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.workspaces w
    where w.id = workspace_quo_webhooks.workspace_id
      and w.owner_user_id = auth.uid()
  )
);

drop policy if exists "authenticated read candidates" on public.candidates;
drop policy if exists "authenticated insert candidates" on public.candidates;
drop policy if exists "authenticated update candidates" on public.candidates;
drop policy if exists "authenticated delete candidates" on public.candidates;
drop policy if exists "authenticated all candidates" on public.candidates;
create policy "authenticated all candidates"
on public.candidates for all
to authenticated
using (
  exists (
    select 1 from public.workspaces w
    where w.id = candidates.workspace_id
      and w.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.workspaces w
    where w.id = candidates.workspace_id
      and w.owner_user_id = auth.uid()
  )
);

drop policy if exists "authenticated all equipment" on public.candidate_equipment;
create policy "authenticated all equipment"
on public.candidate_equipment for all
to authenticated
using (
  exists (
    select 1 from public.workspaces w
    where w.id = candidate_equipment.workspace_id
      and w.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.workspaces w
    where w.id = candidate_equipment.workspace_id
      and w.owner_user_id = auth.uid()
  )
);

drop policy if exists "authenticated all documents" on public.candidate_documents;
create policy "authenticated all documents"
on public.candidate_documents for all
to authenticated
using (
  exists (
    select 1 from public.workspaces w
    where w.id = candidate_documents.workspace_id
      and w.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.workspaces w
    where w.id = candidate_documents.workspace_id
      and w.owner_user_id = auth.uid()
  )
);

drop policy if exists "authenticated all insurance" on public.candidate_insurance;
create policy "authenticated all insurance"
on public.candidate_insurance for all
to authenticated
using (
  exists (
    select 1 from public.workspaces w
    where w.id = candidate_insurance.workspace_id
      and w.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.workspaces w
    where w.id = candidate_insurance.workspace_id
      and w.owner_user_id = auth.uid()
  )
);

drop policy if exists "authenticated all call state" on public.candidate_call_state;
create policy "authenticated all call state"
on public.candidate_call_state for all
to authenticated
using (
  exists (
    select 1 from public.workspaces w
    where w.id = candidate_call_state.workspace_id
      and w.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.workspaces w
    where w.id = candidate_call_state.workspace_id
      and w.owner_user_id = auth.uid()
  )
);

drop policy if exists "authenticated all call sessions" on public.call_sessions;
create policy "authenticated all call sessions"
on public.call_sessions for all
to authenticated
using (
  exists (
    select 1 from public.workspaces w
    where w.id = call_sessions.workspace_id
      and w.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.workspaces w
    where w.id = call_sessions.workspace_id
      and w.owner_user_id = auth.uid()
  )
);

drop policy if exists "authenticated all call knowledge items" on public.call_knowledge_items;
create policy "authenticated all call knowledge items"
on public.call_knowledge_items for all
to authenticated
using (
  exists (
    select 1 from public.workspaces w
    where w.id = call_knowledge_items.workspace_id
      and w.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.workspaces w
    where w.id = call_knowledge_items.workspace_id
      and w.owner_user_id = auth.uid()
  )
);

drop policy if exists "authenticated all followups" on public.followups;
create policy "authenticated all followups"
on public.followups for all
to authenticated
using (
  exists (
    select 1 from public.workspaces w
    where w.id = followups.workspace_id
      and w.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.workspaces w
    where w.id = followups.workspace_id
      and w.owner_user_id = auth.uid()
  )
);

drop policy if exists "authenticated all activities" on public.activities;
create policy "authenticated all activities"
on public.activities for all
to authenticated
using (
  exists (
    select 1 from public.workspaces w
    where w.id = activities.workspace_id
      and w.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.workspaces w
    where w.id = activities.workspace_id
      and w.owner_user_id = auth.uid()
  )
);

drop policy if exists "authenticated all candidate attachments" on public.candidate_attachments;
create policy "authenticated all candidate attachments"
on public.candidate_attachments for all
to authenticated
using (
  exists (
    select 1 from public.workspaces w
    where w.id = candidate_attachments.workspace_id
      and w.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.workspaces w
    where w.id = candidate_attachments.workspace_id
      and w.owner_user_id = auth.uid()
  )
);

drop policy if exists "authenticated all quo call events" on public.quo_call_events;
create policy "authenticated all quo call events"
on public.quo_call_events for all
to authenticated
using (
  exists (
    select 1 from public.workspaces w
    where w.id = quo_call_events.workspace_id
      and w.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.workspaces w
    where w.id = quo_call_events.workspace_id
      and w.owner_user_id = auth.uid()
  )
);
