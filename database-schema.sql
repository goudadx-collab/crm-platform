-- CRM Platform v1.1
-- Supabase/PostgreSQL-ready schema.
-- Safe to re-run after a partial execution.
-- Authentication remains handled by Supabase Auth; profiles reference auth.users.

begin;

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

-- Index the columns used by the RLS policies and common relationships.
create index if not exists profiles_id_idx on public.profiles(id);
create index if not exists companies_owner_id_idx on public.companies(owner_id);
create index if not exists contacts_owner_id_idx on public.contacts(owner_id);
create index if not exists contacts_company_id_idx on public.contacts(company_id);
create index if not exists leads_owner_id_idx on public.leads(owner_id);
create index if not exists deals_owner_id_idx on public.deals(owner_id);
create index if not exists deals_company_id_idx on public.deals(company_id);
create index if not exists tasks_owner_id_idx on public.tasks(owner_id);
create index if not exists tasks_contact_id_idx on public.tasks(contact_id);
create index if not exists tasks_company_id_idx on public.tasks(company_id);
create index if not exists tasks_deal_id_idx on public.tasks(deal_id);
create index if not exists activities_owner_id_idx on public.activities(owner_id);
create index if not exists activities_contact_id_idx on public.activities(contact_id);
create index if not exists activities_company_id_idx on public.activities(company_id);
create index if not exists activities_deal_id_idx on public.activities(deal_id);

-- Enable Row Level Security on every CRM table.
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.leads enable row level security;
alter table public.deals enable row level security;
alter table public.tasks enable row level security;
alter table public.activities enable row level security;

-- Remove the previous policy names if an earlier run created them.
drop policy if exists "profiles own row" on public.profiles;
drop policy if exists "companies own rows" on public.companies;
drop policy if exists "contacts own rows" on public.contacts;
drop policy if exists "leads own rows" on public.leads;
drop policy if exists "deals own rows" on public.deals;
drop policy if exists "tasks own rows" on public.tasks;
drop policy if exists "activities own rows" on public.activities;

-- Also remove the explicit v1.1 policy names so this file remains re-runnable.
drop policy if exists "profiles select own" on public.profiles;
drop policy if exists "profiles insert own" on public.profiles;
drop policy if exists "profiles update own" on public.profiles;
drop policy if exists "profiles delete own" on public.profiles;
drop policy if exists "companies select own" on public.companies;
drop policy if exists "companies insert own" on public.companies;
drop policy if exists "companies update own" on public.companies;
drop policy if exists "companies delete own" on public.companies;
drop policy if exists "contacts select own" on public.contacts;
drop policy if exists "contacts insert own" on public.contacts;
drop policy if exists "contacts update own" on public.contacts;
drop policy if exists "contacts delete own" on public.contacts;
drop policy if exists "leads select own" on public.leads;
drop policy if exists "leads insert own" on public.leads;
drop policy if exists "leads update own" on public.leads;
drop policy if exists "leads delete own" on public.leads;
drop policy if exists "deals select own" on public.deals;
drop policy if exists "deals insert own" on public.deals;
drop policy if exists "deals update own" on public.deals;
drop policy if exists "deals delete own" on public.deals;
drop policy if exists "tasks select own" on public.tasks;
drop policy if exists "tasks insert own" on public.tasks;
drop policy if exists "tasks update own" on public.tasks;
drop policy if exists "tasks delete own" on public.tasks;
drop policy if exists "activities select own" on public.activities;
drop policy if exists "activities insert own" on public.activities;
drop policy if exists "activities update own" on public.activities;
drop policy if exists "activities delete own" on public.activities;

-- Client roles get only the privileges required by the browser CRM.
revoke all on table public.profiles, public.companies, public.contacts, public.leads, public.deals, public.tasks, public.activities from anon, authenticated;
grant select, insert, update, delete on table public.profiles, public.companies, public.contacts, public.leads, public.deals, public.tasks, public.activities to authenticated;

-- Profiles: a user can manage only their own profile row.
create policy "profiles select own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles insert own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles update own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "profiles delete own" on public.profiles for delete to authenticated using ((select auth.uid()) = id);

-- CRM records: a user can manage only rows they own.
create policy "companies select own" on public.companies for select to authenticated using ((select auth.uid()) = owner_id);
create policy "companies insert own" on public.companies for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "companies update own" on public.companies for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "companies delete own" on public.companies for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "contacts select own" on public.contacts for select to authenticated using ((select auth.uid()) = owner_id);
create policy "contacts insert own" on public.contacts for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "contacts update own" on public.contacts for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "contacts delete own" on public.contacts for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "leads select own" on public.leads for select to authenticated using ((select auth.uid()) = owner_id);
create policy "leads insert own" on public.leads for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "leads update own" on public.leads for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "leads delete own" on public.leads for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "deals select own" on public.deals for select to authenticated using ((select auth.uid()) = owner_id);
create policy "deals insert own" on public.deals for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "deals update own" on public.deals for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "deals delete own" on public.deals for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "tasks select own" on public.tasks for select to authenticated using ((select auth.uid()) = owner_id);
create policy "tasks insert own" on public.tasks for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "tasks update own" on public.tasks for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "tasks delete own" on public.tasks for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "activities select own" on public.activities for select to authenticated using ((select auth.uid()) = owner_id);
create policy "activities insert own" on public.activities for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "activities update own" on public.activities for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "activities delete own" on public.activities for delete to authenticated using ((select auth.uid()) = owner_id);

commit;
