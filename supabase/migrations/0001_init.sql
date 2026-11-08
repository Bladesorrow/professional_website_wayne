-- My Finance: core schema. Amounts are integer cents (negative = money out).
-- Every table is scoped to a household and protected by row-level security.

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);
create index on public.household_members (user_id);

create or replace function public.is_household_member(hid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.household_members
    where household_id = hid and user_id = (select auth.uid())
  );
$$;
revoke all on function public.is_household_member(uuid) from public, anon;
grant execute on function public.is_household_member(uuid) to authenticated;

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  institution text,
  kind text not null default 'current' check (kind in ('current','savings','credit_card','cash')),
  created_at timestamptz not null default now()
);
create index on public.accounts (household_id);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  parent_id uuid references public.categories(id) on delete set null,
  kind text not null default 'expense' check (kind in ('expense','income','transfer','savings')),
  monthly_budget_cents bigint,
  created_at timestamptz not null default now(),
  unique (household_id, name)
);
create index on public.categories (household_id);

create table public.merchant_rules (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  pattern text not null,                 -- matched case-insensitively against the cleaned merchant
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (household_id, pattern)
);
create index on public.merchant_rules (category_id);

create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  file_path text not null,
  extracted jsonb,
  status text not null default 'pending' check (status in ('pending','confirmed','rejected')),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index on public.receipts (household_id);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  receipt_id uuid references public.receipts(id) on delete set null,
  date date not null,
  description text not null,
  merchant text,
  payment_type text,
  amount_cents bigint not null,
  balance_cents bigint,
  source text not null default 'manual' check (source in ('manual','csv','receipt')),
  dedupe_key text,
  is_recurring boolean not null default false,
  created_at timestamptz not null default now(),
  unique (account_id, dedupe_key)
);
create index on public.transactions (household_id, date desc);
create index on public.transactions (category_id);
create index on public.transactions (receipt_id);

create table public.income_sources (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  amount_cents bigint not null,
  frequency text not null check (frequency in ('weekly','four_weekly','monthly','yearly')),
  taxable boolean not null default false,
  season_start_month int check (season_start_month between 1 and 12),
  season_end_month int check (season_end_month between 1 and 12),
  in_bank_account boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index on public.income_sources (household_id);

create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  target_cents bigint not null check (target_cents > 0),
  saved_cents bigint not null default 0,
  deadline date,
  created_at timestamptz not null default now()
);
create index on public.savings_goals (household_id);

-- Row-level security: members can read and write only their own household's rows.
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.merchant_rules enable row level security;
alter table public.receipts enable row level security;
alter table public.transactions enable row level security;
alter table public.income_sources enable row level security;
alter table public.savings_goals enable row level security;

create policy households_select on public.households for select to authenticated
  using (public.is_household_member(id));
create policy households_update on public.households for update to authenticated
  using (public.is_household_member(id)) with check (public.is_household_member(id));

create policy members_select on public.household_members for select to authenticated
  using (public.is_household_member(household_id));

do $$
declare t text;
begin
  foreach t in array array['accounts','categories','merchant_rules','receipts','transactions','income_sources','savings_goals']
  loop
    execute format('create policy %I on public.%I for all to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id))', t || '_all', t);
  end loop;
end $$;

-- Creating a household has to be a function: the creator isn't a member yet, so RLS would block a plain insert.
create or replace function public.create_household(household_name text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare hid uuid;
begin
  if (select auth.uid()) is null then raise exception 'not signed in'; end if;
  insert into public.households (name) values (household_name) returning id into hid;
  insert into public.household_members (household_id, user_id, role) values (hid, (select auth.uid()), 'owner');
  insert into public.categories (household_id, name, kind) values
    (hid,'Groceries','expense'),(hid,'Eating out & takeaways','expense'),(hid,'Coffee & snacks','expense'),
    (hid,'Housing','expense'),(hid,'Energy & utilities','expense'),(hid,'Subscriptions & TV','expense'),
    (hid,'Transport','expense'),(hid,'Kids & school','expense'),(hid,'Kids'' activities & days out','expense'),
    (hid,'Clothes & shopping','expense'),(hid,'Health & pharmacy','expense'),(hid,'Insurance','expense'),
    (hid,'Cash','expense'),(hid,'Bank fees & interest','expense'),(hid,'Holidays','expense'),
    (hid,'Other','expense'),(hid,'Salary','income'),(hid,'Social welfare','income'),
    (hid,'Transfers','transfer'),(hid,'Savings','savings');
  return hid;
end $$;
revoke all on function public.create_household(text) from public, anon;
grant execute on function public.create_household(text) to authenticated;
