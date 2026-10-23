create table public.shop_sales (
 id uuid primary key, sale_date date not null, quantity integer not null check(quantity between 1 and 10000),
 unit_price integer not null default 2000 check(unit_price=2000),
 deduct_stock boolean not null, recorded_by text not null, created timestamptz not null default now(),
 voided_at timestamptz
);
alter table public.shop_sales enable row level security;
revoke all on public.shop_sales from public,anon,authenticated;
grant select,insert,update on public.shop_sales to service_role;
create index shop_sales_date_idx on public.shop_sales(sale_date);
alter table public.bookings add column collected_at timestamptz;
-- Existing collections have no reliable collection timestamp; do not invent one.
create index bookings_collected_at_idx on public.bookings(collected_at) where status='collected';

create or replace function public.update_booking(p_id uuid,p_status text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare b public.bookings%rowtype;
begin
 if p_status is null or p_status not in ('collected','cancelled') then return jsonb_build_object('error','invalid_status'); end if;
 perform 1 from public.shop_settings where id=1 for update;
 select * into b from public.bookings where id=p_id for update;
 if not found then return jsonb_build_object('error','not_found'); end if;
 if b.status=p_status then return jsonb_build_object('ok',true); end if;
 if b.status<>'reserved' then return jsonb_build_object('error','booking_conflict'); end if;
 update public.bookings set status=p_status,collected_at=case when p_status='collected' then now() else null end where id=p_id;
 if p_status='cancelled' then update public.shop_settings set available=available+b.quantity,version=version+1 where id=1; end if;
 return jsonb_build_object('ok',true);
end; $$;

create function public.record_shop_sale(p_id uuid,p_date date,p_quantity integer,p_deduct boolean,p_actor text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare s public.shop_settings%rowtype; existing public.shop_sales%rowtype;
begin
 if p_id is null or p_date is null or p_date>(now() at time zone 'Africa/Kampala')::date or p_date<date '2020-01-01'
 or p_quantity is null or p_quantity not between 1 and 10000 or p_deduct is null
 or p_actor is null or not exists(select 1 from public.shop_team where email=p_actor)
 then return jsonb_build_object('error','invalid_sale'); end if;
 select * into s from public.shop_settings where id=1 for update;
 select * into existing from public.shop_sales where id=p_id;
 if found then
  if existing.sale_date<>p_date or existing.quantity<>p_quantity or existing.deduct_stock<>p_deduct or existing.recorded_by<>p_actor or existing.voided_at is not null
  then return jsonb_build_object('error','sale_conflict'); end if;
  return jsonb_build_object('ok',true,'id',p_id);
 end if;
 if s.id is null or (p_deduct and s.available<p_quantity) then return jsonb_build_object('error','insufficient_stock'); end if;
 insert into public.shop_sales(id,sale_date,quantity,deduct_stock,recorded_by) values(p_id,p_date,p_quantity,p_deduct,p_actor);
 if p_deduct then update public.shop_settings set available=available-p_quantity,version=version+1 where id=1; end if;
 return jsonb_build_object('ok',true,'id',p_id);
end; $$;

create function public.void_shop_sale(p_id uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare s public.shop_sales%rowtype; stock integer;
begin
 select available into stock from public.shop_settings where id=1 for update;
 select * into s from public.shop_sales where id=p_id for update;
 if not found then return jsonb_build_object('error','not_found'); end if;
 if s.voided_at is not null then return jsonb_build_object('ok',true); end if;
 if s.deduct_stock and stock+s.quantity>10000 then return jsonb_build_object('error','stock_limit'); end if;
 update public.shop_sales set voided_at=now() where id=p_id;
 if s.deduct_stock then update public.shop_settings set available=available+s.quantity,version=version+1 where id=1; end if;
 return jsonb_build_object('ok',true);
end; $$;

create function public.daily_sales(p_date date)
returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object(
 'walkInPacks',coalesce((select sum(quantity) from public.shop_sales where sale_date=p_date and voided_at is null),0),
 'collectedPacks',coalesce((select sum(quantity) from public.bookings where status='collected' and collected_at>=p_date::timestamp at time zone 'Africa/Kampala' and collected_at<(p_date+1)::timestamp at time zone 'Africa/Kampala'),0),
 'undatedCollections',(select count(*) from public.bookings where status='collected' and collected_at is null),
 'entries',coalesce((select jsonb_agg(to_jsonb(s) order by s.created desc) from public.shop_sales s where s.sale_date=p_date),'[]'::jsonb)
 );
$$;
revoke all on function public.record_shop_sale(uuid,date,integer,boolean,text),public.void_shop_sale(uuid),public.daily_sales(date) from public,anon,authenticated;
grant execute on function public.record_shop_sale(uuid,date,integer,boolean,text),public.void_shop_sale(uuid),public.daily_sales(date) to service_role;
