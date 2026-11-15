import test from 'node:test';
import assert from 'node:assert/strict';
import {WIND_RING,wheelContent} from '../../module/paranoth-wheel.mjs';
test('Paranoth eight native lores have distinct stable keys, sectors and canonical symbols',()=>{
 assert.deepEqual(WIND_RING.map(r=>r.key),['life','heavens','shadow','death','fire','beasts','light','metal']);
 assert.equal(new Set(WIND_RING.map(r=>r.symbol)).size,8);
 for(let i=0;i<8;i++)assert.equal(WIND_RING[i].angle,22.5+i*45);
});
test('Wheel radio values retain lore identity; other traditions remain outside eight sectors',()=>{
 const rows=WIND_RING.map(w=>({key:w.key,id:w.key,name:'Школа <'+w.key+'>',loreName:w.key,windName:w.symbol}));rows.push({key:'necromancy',id:'necromancy',loreName:'Некромантия'});
 const html=wheelContent(rows);assert.equal((html.match(/class="paranoth-wind"/g)||[]).length,8);
 assert.equal((html.match(/type="radio" name="wind"/g)||[]).length,9);
 assert.match(html,/&lt;life&gt;/);assert.ok(html.indexOf('value="necromancy"')>html.indexOf('Другие магические традиции'));
 assert.doesNotMatch(html,/ checked/);assert.match(html,/aria-live="polite"/);
});
