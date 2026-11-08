-- Rent instead of Housing; separate categories for money arriving from other accounts; Hendrick hotel is a holiday.

update public.categories set name = 'Rent' where name = 'Housing';

insert into public.categories (household_id, name, kind)
select h.id, v.name, 'transfer'
from public.households h
cross join (values ('Rent funding (from 5770)'), ('Top-ups from 7440')) as v(name)
on conflict (household_id, name) do nothing;

insert into public.merchant_rules (household_id, pattern, category_id)
select c.household_id, r.pattern, c.id
from public.categories c
join (values ('THE HENDRICK', 'Holidays'), ('FR 5770', 'Rent funding (from 5770)'), ('FR 7440', 'Top-ups from 7440')) as r(pattern, cat)
  on r.cat = c.name
on conflict (household_id, pattern) do update set category_id = excluded.category_id;

-- Re-categorise existing transactions, leaving anything the user has already categorised by hand.
update public.transactions t set category_id = c.id
from public.categories c
where c.household_id = t.household_id and c.name = 'Holidays'
  and t.category_id is null and upper(t.merchant) like '%THE HENDRICK%';

update public.transactions t set category_id = c.id
from public.categories c
where c.household_id = t.household_id
  and upper(t.merchant) in ('FR 5770', 'FR 7440')
  and c.name = case upper(t.merchant) when 'FR 5770' then 'Rent funding (from 5770)' else 'Top-ups from 7440' end
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
    (hid,'Transfers','transfer'),(hid,'Rent funding (from 5770)','transfer'),(hid,'Top-ups from 7440','transfer'),
    (hid,'Savings','savings');
  return hid;
end $$;
revoke all on function public.create_household(text) from public, anon;
grant execute on function public.create_household(text) to authenticated;
