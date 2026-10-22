import {sessionClient} from '@/lib/supabase/server';
import {allowedOrigin} from '@/lib/validation.mjs';
export async function POST(request:Request){
 if(!allowedOrigin(request))return Response.json({error:'Invalid origin.'},{status:403});
 try{const auth=await sessionClient();const {error}=await auth.auth.signOut();if(error)throw error;return Response.json({ok:true},{headers:{'Cache-Control':'private, no-store'}})}catch{return Response.json({error:'Unable to sign out. Please try again.'},{status:503,headers:{'Cache-Control':'private, no-store'}})}
}
