-- Run in the Supabase SQL Editor. Fixtures are rolled back, including on error.
begin;
set local role service_role;
do $$
declare result jsonb; booking_id uuid := gen_random_uuid();
begin
 update public.shop_settings set available=2,open=true,version=0 where id=1;
 result := public.reserve_packs(booking_id,'Test Student','+256700000001',2);
 assert result->>'status'='reserved','Reservation failed';
 assert (select available=0 from public.shop_settings where id=1),'Stock not deducted';
 result := public.reserve_packs(booking_id,'Test Student','+256700000001',2);
 assert result->>'status'='reserved','Retry failed';
 assert (select available=0 from public.shop_settings where id=1),'Retry deducted stock';
 result := public.reserve_packs(gen_random_uuid(),'Test Student','+256700000001',1);
 assert result->>'error'='unavailable','Overselling allowed';
 result := public.save_shop_settings(50,'Campus','',true,0);
 assert result->>'error'='stock_changed','Stale overwrite allowed';
 perform public.update_booking(booking_id,'cancelled');
 perform public.update_booking(booking_id,'cancelled');
 assert (select available=2 from public.shop_settings where id=1),'Cancellation did not restore exactly once';
 result := public.reserve_packs(booking_id,'Test Student','+256700000001',2);
 assert result->>'error'='booking_conflict','Cancelled booking reused';
 result := public.reserve_packs(gen_random_uuid(),'Test Student','+256700000001',1);
 perform public.update_booking((result->>'id')::uuid,'collected');
 assert (select available=1 from public.shop_settings where id=1),'Collection changed stock';
end $$;
reset role;
do $$ begin
 assert not has_table_privilege('anon','public.bookings','SELECT'),'Public contacts exposed';
 assert not has_table_privilege('authenticated','public.bookings','SELECT'),'Authenticated contacts exposed';
 assert not has_function_privilege('anon','public.reserve_packs(uuid,text,text,integer)','EXECUTE'),'Public RPC exposed';
end $$;
rollback;
