import { env } from 'cloudflare:workers';
const json = (v: unknown, status=200) => Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
const admin = (r:Request) => {const allowed=(env as unknown as Record<string,string>).ADMIN_EMAILS; const email=r.headers.get('oai-authenticated-user-email')?.toLowerCase(); return !!email && !!allowed && allowed.split(',').map(s=>s.trim().toLowerCase()).includes(email)};
export async function GET(r:Request) {
 const db=env.DB!; const s=await db.prepare('SELECT * FROM settings WHERE id=1').first() ?? {available:0,location:'Z-FRUITS shop, campus',hours:'Pick up after booking while stock is available.',open:1};
 if(new URL(r.url).searchParams.has('admin')) {if(!admin(r)) return json({error:'Sign in with the shop owner account. The owner email must be configured before opening the shop.'},403); return json({settings:s,bookings:(await db.prepare('SELECT * FROM bookings ORDER BY created DESC LIMIT 500').all()).results});}
 return json(s);
}
export async function POST(r:Request) {
 if(r.headers.get('origin') && r.headers.get('origin')!==new URL(r.url).origin) return json({error:'Invalid origin'},403);
 let b:any; try {b=await r.json()} catch {return json({error:'Invalid request'},400)}
 const db=env.DB!;
 if(b.action) {
 if(!admin(r)) return json({error:'Owner access required'},403);
 if(b.action==='settings') {
 if(!Number.isInteger(b.available)||b.available<0||b.available>10000||typeof b.location!=='string'||!b.location.trim()||b.location.length>160||typeof b.hours!=='string'||b.hours.length>160) return json({error:'Enter valid stock and pickup details.'},400);
 await db.prepare('INSERT INTO settings (id,available,location,hours,open) VALUES (1,?,?,?,?) ON CONFLICT(id) DO UPDATE SET available=excluded.available,location=excluded.location,hours=excluded.hours,open=excluded.open').bind(b.available,b.location.trim(),b.hours,b.open?1:0).run();
 } else if(b.action==='collect') {await db.prepare("UPDATE bookings SET status='collected' WHERE id=? AND status='reserved'").bind(b.id).run();}
 else if(b.action==='cancel') {await db.batch([db.prepare("UPDATE settings SET available=available+COALESCE((SELECT quantity FROM bookings WHERE id=? AND status='reserved'),0) WHERE id=1").bind(b.id),db.prepare("UPDATE bookings SET status='cancelled' WHERE id=? AND status='reserved'").bind(b.id)]);} else return json({error:'Unknown action'},400);
 return json({ok:true});
 }
 const name=typeof b.name==='string'?b.name.trim():''; const phone=typeof b.phone==='string'?b.phone.replace(/[\s()-]/g,''):'';
 if(name.length<2||name.length>80||! /^(?:0[237]\d{8}|\+?256[237]\d{8})$/.test(phone)||!Number.isInteger(b.quantity)||b.quantity<1||b.quantity>50||typeof b.id!=='string'||! /^[a-f0-9-]{36}$/.test(b.id)) return json({error:'Enter your name, a valid Ugandan phone number, and 1–50 packs.'},400);
 const existing=await db.prepare('SELECT id,quantity FROM bookings WHERE id=?').bind(b.id).first(); if(existing) return json(existing);
 // A conditional INSERT and stock update run in one serialized transaction.
 try {const results=await db.batch([db.prepare("INSERT INTO bookings (id,name,phone,quantity,status,created) SELECT ?,?,?,?,'reserved',? FROM settings WHERE id=1 AND open=1 AND available>=?").bind(b.id,name,phone,b.quantity,new Date().toISOString(),b.quantity),db.prepare('UPDATE settings SET available=available-? WHERE id=1 AND changes()=1').bind(b.quantity)]);
 if(!results[0].meta.changes) return json({error:'These packs are no longer available, or bookings are closed. Please refresh.'},409);
 return json({id:b.id,quantity:b.quantity});} catch {return json({error:'Booking could not be confirmed. Please retry.'},500)}
}

