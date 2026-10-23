import { database, publicDatabase, SetupError, teamUser } from '@/lib/supabase/server';
import { allowedOrigin, bookingInput } from '@/lib/validation.mjs';
export const dynamic='force-dynamic';
export const runtime='nodejs';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}});
const messages:Record<string,string>={
 invalid_sale:'Enter a valid sale date and a whole number of packs (1–10,000).',
 sale_conflict:'This sale was already recorded with different details. Refresh before trying again.',
 insufficient_stock:'Not enough available packs. Check your stock, or choose stock already adjusted for a past sale.',
 stock_limit:'Restoring this sale would exceed the stock limit. Correct the stock count first.',
 unavailable:'These packs are no longer available, or bookings are closed. Please refresh.',
 booking_conflict:'This booking has already changed. Please refresh before trying again.',
 stock_changed:'Stock changed while you were editing. Refresh, check the available packs, and save again.',
 invalid_booking:'Enter a valid name, Ugandan phone number, and 1–50 packs.',
 invalid_settings:'Enter valid stock and pickup details.',invalid_status:'Choose a valid booking status.',not_found:'Booking not found.'
};
function result(data:{error?:string}|null) {
 if(data?.error) return json({error:messages[data.error]||'The request could not be completed.'},data.error==='not_found'?404:data.error.startsWith('invalid')?400:409);
 return json(data);
}
function failed(error:unknown) {
 if(error instanceof SetupError) return json({error:'The shop is not ready for bookings yet. Please try again later.'},503);
 console.error('Shop request failed');
 return json({error:'Unable to complete the request. Please try again.'},503);
}
export async function GET(request:Request) {
 try {
 const params=new URL(request.url).searchParams;
 const isAdmin=params.has('admin')||params.has('report');
 if(isAdmin&&!await teamUser()) return json({error:'Please sign in with a shop team account.'},401);
 const db=isAdmin?database():publicDatabase();
 if(params.has('report')) {
 const day=params.get('report')||'';
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||isNaN(Date.parse(day))||new Date(day).toISOString().slice(0,10)!==day)return json({error:'Choose a valid date.'},400);
 const {data,error}=await db.rpc('daily_sales',{p_date:day});
 if(error)throw error;return json(data);
 }
 const {data:settings,error}=await db.from('shop_settings').select('*').eq('id',1).single();
 if(error) throw error;
 if(!isAdmin) return json(settings);
 const {data:bookings,error:bookingError}=await db.from('bookings').select('*').order('created',{ascending:false}).limit(1000);
 if(bookingError) throw bookingError;
 return json({settings,bookings});
 } catch(error) {return failed(error)}
}
export async function POST(request:Request) {
 if(!allowedOrigin(request)) return json({error:'Invalid origin.'},403);
 let body:Record<string,unknown>;
 try {const parsed=await request.json();if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw Error();body=parsed as Record<string,unknown>;} catch {return json({error:'Invalid request.'},400)}
 try {
 if(body.action) {
 const user=await teamUser();
 if(!user) return json({error:'Shop team access required.'},401);
 const db=database();
 if(body.action==='sale') {
 if(typeof body.id!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id)
 ||!Number.isInteger(body.quantity)||Number(body.quantity)<1||Number(body.quantity)>10000||typeof body.deduct!=='boolean'
 ||typeof body.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(body.date)||isNaN(Date.parse(body.date))||new Date(body.date).toISOString().slice(0,10)!==body.date)return json({error:messages.invalid_sale},400);
 const {data,error}=await db.rpc('record_shop_sale',{p_id:body.id,p_date:body.date,p_quantity:body.quantity,p_deduct:body.deduct,p_actor:user.email!.toLowerCase()});
 if(error)throw error;return result(data);
 }
 if(body.action==='void_sale'&&typeof body.id==='string'&&/^[0-9a-f-]{36}$/i.test(body.id)) {
 const {data,error}=await db.rpc('void_shop_sale',{p_id:body.id});if(error)throw error;return result(data);
 }
 if(body.action==='settings') {
 if(!Number.isInteger(body.available)||Number(body.available)<0||Number(body.available)>10000||!Number.isInteger(body.version)
 ||typeof body.location!=='string'||!body.location.trim()||body.location.length>160||typeof body.hours!=='string'||body.hours.length>160||typeof body.open!=='boolean') return json({error:messages.invalid_settings},400);
 const {data,error}=await db.rpc('save_shop_settings',{p_available:body.available,p_location:body.location.trim(),p_hours:body.hours,p_open:body.open,p_version:body.version});
 if(error) throw error;return result(data);
 }
 if((body.action==='collect'||body.action==='cancel')&&typeof body.id==='string'&&/^[0-9a-f-]{36}$/i.test(body.id)) {
 const {data,error}=await db.rpc('update_booking',{p_id:body.id,p_status:body.action==='collect'?'collected':'cancelled'});
 if(error) throw error;return result(data);
 }
 return json({error:'Unknown action.'},400);
 }
 const booking=bookingInput(body);
 if(!booking) return json({error:messages.invalid_booking},400);
 const {data,error}=await database().rpc('reserve_packs',{p_id:booking.id,p_name:booking.name,p_phone:booking.phone,p_quantity:booking.quantity});
 if(error) throw error;return result(data);
 }catch(error){return failed(error)}
}
