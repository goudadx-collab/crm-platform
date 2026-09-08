-- CRM Platform v1.0
-- Supabase/PostgreSQL-ready schema.
-- Authentication remains handled by Supabase Auth; profiles reference auth.users.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  company_name text,
  role text default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  industry text,
  website text,
  phone text,
  location text,
  status text default 'Active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  name text not null,
  email text,
  phone text,
  job_title text,
  status text default 'Prospect',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  owner_name text,
  source text,
  status text default 'New',
  company_id uuid references public.companies(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  name text not null,
  value numeric(14,2) default 0,
  stage text default 'New',
  expected_close_date date,
  owner_name text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  due_date date,
  owner_name text,
  status text default 'Open',
  priority text default 'Normal',
  contact_id uuid references public.contacts(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'Note',
  text text not null,
  contact_id uuid references public.contacts(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists companies_owner_id_idx on public.companies(owner_id);
create index if not exists contacts_owner_id_idx on public.contacts(owner_id);
create index if not exists contacts_company_id_idx on public.contacts(company_id);
create index if not exists leads_owner_id_idx on public.leads(owner_id);
create index if not exists deals_owner_id_idx on public.deals(owner_id);
create index if not exists deals_company_id_idx on public.deals(company_id);
create index if not exists tasks_owner_id_idx on public.tasks(owner_id);
create index if not exists activities_owner_id_idx on public.activities(owner_id);

-- Row Level Security: users can only access their own CRM records.
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.leads enable row level security;
alter table public.deals enable row level security;
alter table public.tasks enable row level security;
alter table public.activities enable row level security;

create policy "profiles own row" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "companies own rows" on public.companies for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "contacts own rows" on public.contacts for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "leads own rows" on public.leads for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "deals own rows" on public.deals for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "tasks own rows" on public.tasks for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "activities own rows" on public.activities for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
