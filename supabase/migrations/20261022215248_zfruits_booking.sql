-- Z-FRUITS: privileged writes are only available to the server's secret key.
create table public.shop_settings (
 id integer primary key check(id=1),
 available integer not null default 0 check(available between 0 and 10000),
 location text not null default 'Z-FRUITS shop, campus' check(length(location) between 1 and 160),
 hours text not null default 'Pick up after booking while stock is available.' check(length(hours)<=160),
 open boolean not null default true,
 version integer not null default 0
);
create table public.bookings (
 id uuid primary key,
 name text not null check(length(name) between 2 and 80),
 phone text not null check(phone ~ '^\+256[237][0-9]{8}$'),
 quantity integer not null check(quantity between 1 and 50),
 status text not null default 'reserved' check(status in ('reserved','collected','cancelled')),
 created timestamptz not null default now()
);
create index bookings_status_created_idx on public.bookings(status,created desc);
create table public.shop_team (email text primary key check(email=lower(email)));
alter table public.shop_settings enable row level security;
alter table public.bookings enable row level security;
alter table public.shop_team enable row level security;
revoke all on public.shop_settings,public.bookings,public.shop_team from public,anon,authenticated;
grant select on public.shop_settings to anon,authenticated;
create policy "Public stock and pickup details" on public.shop_settings for select to anon,authenticated using(true);
grant select,insert,update,delete on public.shop_settings,public.bookings,public.shop_team to service_role;
-- Intentional: bookings and shop_team have no public policies. Only service_role can access them.
insert into public.shop_settings(id) values(1);
insert into public.shop_team(email) values
 ('opakijonathan30@gmail.com'),('davidmula746@gmail.com'),('busingyembeine6@gmail.com');

create function public.reserve_packs(p_id uuid,p_name text,p_phone text,p_quantity integer)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare s public.shop_settings%rowtype; b public.bookings%rowtype;
begin
 if p_id is null or p_name is null or length(trim(p_name)) not between 2 and 80
 or p_phone is null or p_phone !~ '^\+256[237][0-9]{8}$'
 or p_quantity is null or p_quantity not between 1 and 50 then
 return jsonb_build_object('error','invalid_booking'); end if;
 -- All stock operations lock the single stock row first, for consistent lock ordering.
 select * into s from public.shop_settings where id=1 for update;
 select * into b from public.bookings where id=p_id;
 if found then
 if b.name<>trim(p_name) or b.phone<>p_phone or b.quantity<>p_quantity or b.status='cancelled' then
 return jsonb_build_object('error','booking_conflict'); end if;
 return jsonb_build_object('id',b.id,'quantity',b.quantity,'status',b.status);
 end if;
 if s.id is null or not s.open or s.available<p_quantity then
 return jsonb_build_object('error','unavailable'); end if;
 insert into public.bookings(id,name,phone,quantity) values(p_id,trim(p_name),p_phone,p_quantity);
 update public.shop_settings set available=available-p_quantity,version=version+1 where id=1;
 return jsonb_build_object('id',p_id,'quantity',p_quantity,'status','reserved');
end; $$;

create function public.update_booking(p_id uuid,p_status text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare b public.bookings%rowtype;
begin
 if p_status is null or p_status not in ('collected','cancelled') then return jsonb_build_object('error','invalid_status'); end if;
 perform 1 from public.shop_settings where id=1 for update;
 select * into b from public.bookings where id=p_id for update;
 if not found then return jsonb_build_object('error','not_found'); end if;
 if b.status=p_status then return jsonb_build_object('ok',true); end if;
 if b.status<>'reserved' then return jsonb_build_object('error','booking_conflict'); end if;
 update public.bookings set status=p_status where id=p_id;
 if p_status='cancelled' then
 update public.shop_settings set available=available+b.quantity,version=version+1 where id=1;
 end if;
 return jsonb_build_object('ok',true);
end; $$;

create function public.save_shop_settings(p_available integer,p_location text,p_hours text,p_open boolean,p_version integer)
returns jsonb language plpgsql security invoker set search_path='' as $$
begin
 if p_available is null or p_available not between 0 and 10000 or p_location is null
 or length(trim(p_location)) not between 1 and 160 or p_hours is null or length(p_hours)>160
 or p_open is null or p_version is null then return jsonb_build_object('error','invalid_settings'); end if;
 update public.shop_settings set available=p_available,location=trim(p_location),hours=p_hours,open=p_open,version=version+1
 where id=1 and version=p_version;
 if not found then return jsonb_build_object('error','stock_changed'); end if;
 return jsonb_build_object('ok',true);
end; $$;
revoke all on function public.reserve_packs(uuid,text,text,integer) from public,anon,authenticated;
revoke all on function public.update_booking(uuid,text) from public,anon,authenticated;
revoke all on function public.save_shop_settings(integer,text,text,boolean,integer) from public,anon,authenticated;
grant execute on function public.reserve_packs(uuid,text,text,integer) to service_role;
grant execute on function public.update_booking(uuid,text) to service_role;
grant execute on function public.save_shop_settings(integer,text,text,boolean,integer) to service_role;
