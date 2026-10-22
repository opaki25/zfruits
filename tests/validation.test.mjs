import test from 'node:test';
import assert from 'node:assert/strict';
import {bookingInput,normalizePhone,allowedOrigin} from '../lib/validation.mjs';
const valid={id:'11111111-1111-4111-8111-111111111111',name:' Amina ',phone:'0772 123 456',quantity:2};
test('normalizes Ugandan contact formats',()=>{
 for(const phone of ['0772 123 456','256772123456','+256 (772) 123-456'])assert.equal(normalizePhone(phone),'+256772123456');
 for(const phone of ['',null,'+15555555555','077212345','hello'])assert.equal(normalizePhone(phone),'');
});
test('accepts valid bookings and rejects malformed input',()=>{
 assert.deepEqual(bookingInput(valid),{...valid,name:'Amina',phone:'+256772123456'});
 for(const change of [{quantity:0},{quantity:51},{quantity:1.5},{quantity:'2'},{name:' '},{phone:'bad'},{id:'bad'}])assert.equal(bookingInput({...valid,...change}),null);
});
test('blocks cross-origin browser mutations',()=>{
 assert.equal(allowedOrigin(new Request('https://shop.example/api/shop',{headers:{origin:'https://evil.example'}})),false);
 assert.equal(allowedOrigin(new Request('https://shop.example/api/shop',{headers:{origin:'https://shop.example'}})),true);
});
