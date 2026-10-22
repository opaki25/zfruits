import {database,sessionClient,SetupError} from '@/lib/supabase/server';
import {allowedOrigin} from '@/lib/validation.mjs';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}});
export async function POST(request:Request){
 if(!allowedOrigin(request))return json({error:'Invalid origin.'},403);
 try{
 const body=await request.json() as {email?:unknown,password?:unknown};
 if(typeof body?.email!=='string'||typeof body.password!=='string'||body.email.length>254||!body.password||body.password.length>1024)return json({error:'Enter your team email and password.'},400);
 const email=body.email.trim().toLowerCase();
 const {data:member,error:lookupError}=await database().from('shop_team').select('email').eq('email',email).maybeSingle();
 if(lookupError)throw lookupError;
 if(!member)return json({error:'Unable to sign in. Check your team email and password.'},401);
 const auth=await sessionClient();
 const {data,error}=await auth.auth.signInWithPassword({email,password:body.password});
 if(error||!data.user?.email_confirmed_at){await auth.auth.signOut();return json({error:'Unable to sign in. Check your team email and password.'},401)}
 return json({ok:true});
 }catch(error){return json({error:error instanceof SetupError?'Team sign-in is not configured yet. Please contact the shop owner.':'Unable to sign in right now. Please try again.'},503)}
}
