export function normalizePhone(phone) {
 if(typeof phone!=='string') return '';
 let value=phone.replace(/[\s()-]/g,'');
 if(/^0[237]\d{8}$/.test(value)) value='+256'+value.slice(1);
 if(/^256[237]\d{8}$/.test(value)) value='+'+value;
 return /^\+256[237]\d{8}$/.test(value)?value:'';
}
export function bookingInput(body) {
 if(!body || typeof body!=='object') return null;
 const name=typeof body.name==='string'?body.name.trim():'';
 const phone=normalizePhone(body.phone);
 if(name.length<2||name.length>80||!phone||!Number.isInteger(body.quantity)||body.quantity<1||body.quantity>50
 ||typeof body.id!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id)) return null;
 return {id:body.id,name,phone,quantity:body.quantity};
}
export function allowedOrigin(request) {
 const origin=request.headers.get('origin');
 return !origin||origin===new URL(request.url).origin;
}
