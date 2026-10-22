import {DatabaseSync} from 'node:sqlite';
import assert from 'node:assert/strict';
const db=new DatabaseSync(':memory:');
db.exec("CREATE TABLE settings(id INTEGER PRIMARY KEY,available INTEGER,open INTEGER); CREATE TABLE bookings(id TEXT PRIMARY KEY,quantity INTEGER,status TEXT); INSERT INTO settings VALUES(1,50,1)");
function book(id,q){db.exec('BEGIN');try{const r=db.prepare("INSERT INTO bookings SELECT ?,?,'reserved' FROM settings WHERE id=1 AND open=1 AND available>=?").run(id,q,q);db.prepare('UPDATE settings SET available=available-? WHERE id=1 AND changes()=1').run(q);db.exec('COMMIT');return r.changes}catch(e){db.exec('ROLLBACK');throw e}}
assert.equal(book('a',2),1);assert.equal(db.prepare('SELECT available FROM settings').get().available,48);assert.equal(book('b',49),0);assert.equal(db.prepare('SELECT available FROM settings').get().available,48);assert.equal(book('c',48),1);assert.equal(book('d',1),0);
function cancel(id){db.exec('BEGIN');db.prepare("UPDATE settings SET available=available+COALESCE((SELECT quantity FROM bookings WHERE id=? AND status='reserved'),0) WHERE id=1").run(id);db.prepare("UPDATE bookings SET status='cancelled' WHERE id=? AND status='reserved'").run(id);db.exec('COMMIT')}
cancel('a');cancel('a');assert.equal(db.prepare('SELECT available FROM settings').get().available,2);db.exec('UPDATE settings SET open=0');assert.equal(book('e',1),0);console.log('PASS: quantity deduction, oversell protection, sold-out, cancellation once, closed shop');
