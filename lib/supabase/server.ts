import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export class SetupError extends Error {}
export function configuration() {
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key) throw new SetupError('Supabase is not configured.');
 return {url,key};
}
export function publicDatabase() {
 const {url,key}=configuration();
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export function database() {
 const {url}=configuration();
 const key=process.env.SUPABASE_SECRET_KEY;
 if(!key) throw new SetupError('The server database key is not configured.');
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function sessionClient() {
 const {url,key}=configuration();
 const store=await cookies();
 // Used only in Route Handlers, where refreshed cookies can always be written.
 return createServerClient(url,key,{cookieOptions:{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production"},cookies:{
  getAll:()=>store.getAll(),
  setAll:(values)=>{values.forEach(({name,value,options})=>store.set(name,value,options));}
 }});
}
export async function teamUser() {
 const auth=await sessionClient();
 const {data:{user},error}=await auth.auth.getUser();
 if(error||!user?.email||!user.email_confirmed_at) return null;
 const {data,error:dbError}=await database().from('shop_team').select('email').eq('email',user.email.toLowerCase()).maybeSingle();
 if(dbError) throw new Error('Could not verify team access.');
 return data?user:null;
}
