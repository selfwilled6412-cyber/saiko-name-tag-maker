import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'ゲームのJavaScriptが存在する');
const store=new Map();
const handlers={};
const root={innerHTML:''};
const digits={textContent:'',classList:{toggle(){}}};
const timerButton={textContent:''};
const document={
 getElementById(id){return id==='root'?root:id==='timerDigits'?digits:null},
 querySelector(sel){return sel==='[data-action="timer"]'?timerButton:null},
 addEventListener(name,fn){handlers[name]=fn},
 body:{appendChild(){}},
};
const window={scrollY:0,scrollTo(){},matchMedia(){return {matches:true}}};
const localStorage={
 getItem(key){return store.get(key)||null},
 setItem(key,value){store.set(key,value)}
};
const sandbox={document,window,localStorage,Date,Math,JSON,console,
 setInterval(){return 1},clearInterval(){},setTimeout(){return 1},clearTimeout(){},
 alert(msg){throw Error('Unexpected alert: '+msg)},
 confirm(){return true}
};
vm.runInNewContext(script,sandbox,{timeout:2000,filename:'game.js'});
const state=()=>JSON.parse(store.get('saiko-world-cup-v2')||'{}');
const click=(action,data={})=>handlers.click({target:{closest(){return {tagName:'BUTTON',dataset:{action,...data}}}}});

test('起動時に7競技とチームランキングが表示される',()=>{
 assert.match(root.innerHTML,/サイ校・おバカ世界選手権/);
 assert.match(root.innerHTML,/世界ランキング/);
 assert.match(root.innerHTML,/緊急速報/);
});
test('緊急速報が開閉できる',()=>{
 click('breaking');
 assert.match(root.innerHTML,/SAIKO BREAKING NEWS/);
 click('breakingClose');
 assert.doesNotMatch(root.innerHTML,/breaking-layer/);
});
test('タイマーのスタートと一時停止が表示される',()=>{
 click('timer');
 assert.match(timerButton.textContent,/一時停止/);
 click('timer');
 assert.match(timerButton.textContent,/スタート/);
});
test('6件の裁判の得点を登録でき、変更時も自動更新される',()=>{
 click('goto',{stage:'7'});
 for(let k=0;k<6;k++)click('verdict',{case:String(k),winner:String(k%3)});
 click('confirmCourt');
 assert.deepEqual(Array.from(state().awards.court),[12,12,12]);
 click('verdict',{case:'0',winner:'1'});
 assert.deepEqual(Array.from(state().awards.court),[10,14,12]);
 click('verdictClear',{case:'0'});
 assert.equal(state().awards.court,undefined);
});
test('リセット確認で得点と進行を初期化できる',()=>{
 click('reset');
 assert.equal(state().stage,0);
 assert.deepEqual(Array.from(state().courtWinners),[null,null,null,null,null,null]);
 assert.deepEqual(Object.keys(state().awards),[]);
});
