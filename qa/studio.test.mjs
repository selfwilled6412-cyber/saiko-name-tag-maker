import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const src=fs.readFileSync(new URL('../game-v3.js',import.meta.url),'utf8');
const elements=Object.fromEntries(['root','audience','news'].map(k=>[k,{innerHTML:'',classList:{add(){},remove(){},toggle(){}}}]));
const handlers={};const store=new Map(),sounds=[];
const document={getElementById(id){return elements[id]||null},addEventListener(ev,cb){handlers[ev]=cb}};
const window={addEventListener(){},confirm(){return true},AudioContext:undefined,scrollY:0};
let apiResponse=()=>({ok:false});
const sandbox={document,window,localStorage:{getItem(k){return store.get(k)||null},setItem(k,v){store.set(k,v)}},
console,setTimeout,clearTimeout,setInterval(){return 0},clearInterval(){},Math,Date,JSON,crypto:{getRandomValues(x){x[0]=12;return x}},fetch:async()=>apiResponse(),
AbortController,alert(message){throw Error(message)}};
vm.runInNewContext(src,sandbox,{timeout:2000});
const state=()=>JSON.parse(store.get('saiko-grand-prix-studio-v3'));
function click(dataset){handlers.click({target:{closest(){return {dataset}}}});}
const settle=()=>new Promise(r=>setTimeout(r,12));
test('起動時に競技一覧、AIチャット、3チームの得点が見える',()=>{
 assert.match(elements.root.innerHTML,/どうでも裁判所/);
 assert.match(elements.root.innerHTML,/ゲームAIと相談/);
 assert.equal(state().names.length,3);
 assert.equal(state().scores.length,3);
});
test('無制限の新お題はルール生成モードでも作れる',async()=>{
 const prev=state().item.prompt;
 click({action:'newPrompt'});await settle();
 assert.notEqual(state().item.prompt,prev);
 assert.equal(state().source,'rules');
 assert.equal(state().history.length,2);
});
test('競技切り替えで新しい裁判と新証拠が出せる',async()=>{
 click({mode:'court'});await settle();
 assert.equal(state().item.mode,'court');
 assert.match(state().item.prompt,/有罪か/);
 click({action:'evidence'});
 assert.match(elements.root.innerHTML,/新証拠/);
});
test('裁判は検察/弁護/裁判官へ3,1,2点ずつ加算、元に戻せる',()=>{
 click({action:'verdictPro'});
 assert.deepEqual(Array.from(state().scores),[3,1,2]);
 assert.equal(state().courtRound,1);
 click({action:'undo'});
 assert.deepEqual(Array.from(state().scores),[0,0,0]);
 assert.equal(state().courtRound,0);
});
test('通常競技では+5, +3, +1を登録できる',()=>{
 click({score:'1',pt:'5'});
 assert.deepEqual(Array.from(state().scores),[0,5,0]);
 click({action:'undo'});
 assert.deepEqual(Array.from(state().scores),[0,0,0]);
});
test('サーバーAIが正常な返答ならそのお題を利用する',async()=>{
 apiResponse=()=>({ok:true,json:async()=>({provider:'workers-ai',reply:'スタッフさん、新事件です！',item:{mode:'court',title:'奇跡の裁判',prompt:'マグカップに敬語を使うのは有罪か？',options:[],evidence:'証人はカッパ！',criterion:'裁判官が決定'}})});
 click({action:'newPrompt'});await settle();
 assert.equal(state().source,'workers-ai');
 assert.match(state().item.prompt,/マグカップ/);
});
test('観客画面にはスタッフのチャットや準備物を表示しない',()=>{
 click({action:'project'});
 assert.match(elements.audience.innerHTML,/マグカップ/);
 assert.doesNotMatch(elements.audience.innerHTML,/ゲームAIと相談|準備物|進行台本/);
 click({action:'project'});
});
test('新大会で過去の得点と議事録がクリアされる',()=>{
 click({action:'reset'});
 assert.deepEqual(Array.from(state().scores),[0,0,0]);
 assert.deepEqual(Array.from(state().ledger),[]);
});
