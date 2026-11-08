-- Account 5770 is the rent pot: a month of rent goes in, €140 comes back each week. It is neutral, not a top-up.

update public.categories set name = 'Rent pot (5770)' where name = 'Rent funding (from 5770)';

insert into public.categories (household_id, name, kind)
select h.id, 'Rent pot (5770)', 'transfer' from public.households h
on conflict (household_id, name) do nothing;

insert into public.merchant_rules (household_id, pattern, category_id)
select c.household_id, p.pattern, c.id
from public.categories c
cross join (values ('FR 5770'), ('TO 5770')) as p(pattern)
where c.name = 'Rent pot (5770)'
on conflict (household_id, pattern) do update set category_id = excluded.category_id;

update public.transactions t set category_id = c.id
from public.categories c
where c.household_id = t.household_id and c.name = 'Rent pot (5770)'
  and upper(t.merchant) in ('FR 5770', 'TO 5770')
  and (t.category_id is null or t.category_id in (select x.id from public.categories x where x.name = 'Transfers'));

create or replace function public.create_household(household_name text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare hid uuid;
begin
  if (select auth.uid()) is null then raise exception 'not signed in'; end if;
  insert into public.households (name) values (household_name) returning id into hid;
  insert into public.household_members (household_id, user_id, role) values (hid, (select auth.uid()), 'owner');
  insert into public.categories (household_id, name, kind) values
    (hid,'Groceries','expense'),(hid,'Eating out & takeaways','expense'),(hid,'Coffee & snacks','expense'),
    (hid,'Rent','expense'),(hid,'Energy & utilities','expense'),(hid,'Subscriptions & TV','expense'),
    (hid,'Transport','expense'),(hid,'Kids & school','expense'),(hid,'Kids'' activities & days out','expense'),
    (hid,'Clothes & shopping','expense'),(hid,'Health & pharmacy','expense'),(hid,'Insurance','expense'),
    (hid,'Cash','expense'),(hid,'Bank fees & interest','expense'),(hid,'Holidays','expense'),
    (hid,'Other','expense'),(hid,'Salary','income'),(hid,'Social welfare','income'),
    (hid,'Transfers','transfer'),(hid,'Rent pot (5770)','transfer'),(hid,'Top-ups from 7440','transfer'),
    (hid,'Savings','savings');
  return hid;
end $$;
revoke all on function public.create_household(text) from public, anon;
grant execute on function public.create_household(text) to authenticated;
