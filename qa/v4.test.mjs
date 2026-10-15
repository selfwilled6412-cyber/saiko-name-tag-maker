import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const js=fs.readFileSync(new URL('../game-v4.js',import.meta.url),'utf8');
const elements=Object.fromEntries(['root','audience','news'].map(id=>[id,{innerHTML:'',classList:{add(){},remove(){},toggle(){}},scrollTop:0,scrollHeight:800}]));
const handlers={},store=new Map();
const document={getElementById(id){return elements[id]||null},addEventListener(type,fn){handlers[type]=fn},querySelector(){return null}};
const window={addEventListener(){},confirm(){return true},speechSynthesis:null};
let response=async()=>({ok:false});
const mock={window,document,localStorage:{getItem(k){return store.get(k)||null},setItem(k,v){store.set(k,v)}},
 Date,Math,JSON,alert(msg){throw Error(msg)},AbortController,fetch:async()=>response(),setInterval(){return 0},clearInterval(){},setTimeout,clearTimeout};
vm.runInNewContext(js,mock,{timeout:2000});
const state=()=>JSON.parse(store.get('saiko-grand-prix-v4'));
const click=(data)=>handlers.click({target:{closest(){return {dataset:data,disabled:false}}}});
const go=(action)=>click({action});
const wait=()=>new Promise(r=>setTimeout(r,20));
test('ゲーム開始前はチーム数を2〜10チームから選べる',()=>{
 assert.match(elements.root.innerHTML,/何チームで遊ぶ/);
 assert.match(elements.root.innerHTML,/10チーム/);
 assert.equal(state().started,false);
});
test('3チームで開始後に司会のAI相談画面が出る',()=>{
 go('begin');
 assert.equal(state().started,true);
 assert.match(elements.root.innerHTML,/もことお題相談/);
 assert.match(elements.root.innerHTML,/相談中のお題案/);
 assert.match(elements.root.innerHTML,/いまの出題/);
 assert.doesNotMatch(elements.audience.innerHTML,/スタッフとの相談/);
});
test('相談だけでは勝手にお題を生成・公開しない',async()=>{
 response=async()=>({ok:true,json:async()=>({kind:'chat',provider:'workers-ai',reply:'日常あるあるの裁判が良さそうだね。どんなトーンにする？'})});
 // Input is simulated through controlled DOM stub.
 elements.chatInput={value:'日常の話題にしたい'};
 go('chat');await wait();
 assert.equal(state().draft,null);
 assert.equal(state().published,null);
 assert.match(elements.root.innerHTML,/日常あるあるの裁判/);
});
test('お題を生成しても観客には見えず、スタッフが確定後に公開する',async()=>{
 response=async()=>({ok:true,json:async()=>({kind:'draft',provider:'workers-ai',reply:'こんな案はどう？',draft:{mode:'sync',title:'おそろい選手権',prompt:'一日だけ変身するならどっち？',options:['犬','猫'],evidence:'',criterion:'一致したら成功'}})});
 elements.chatInput={value:'ペットのお題にして'};
 go('draft');await wait();
 assert.match(state().draft.prompt,/変身するなら/);
 assert.equal(state().published,null);
 go('project');
 assert.doesNotMatch(elements.audience.innerHTML,/変身するなら/);
 go('project');
 go('publish');
 assert.equal(state().draft,null);
 assert.match(state().published.prompt,/変身するなら/);
 go('project');
 assert.match(elements.audience.innerHTML,/変身するなら/);
 assert.doesNotMatch(elements.audience.innerHTML,/ペットのお題にして|もことお題相談/);
 go('project');
});
test('次の案の相談中も前のお題は観客画面に残る',async()=>{
 response=async()=>({ok:true,json:async()=>({kind:'draft',provider:'workers-ai',reply:'修正したよ',draft:{mode:'sync',title:'新しい案',prompt:'今度は何色にする？',options:['赤','青'],criterion:'一致で成功'}})});
 go('draft');await wait();
 assert.match(state().published.prompt,/変身するなら/);
 assert.match(state().draft.prompt,/何色/);
 go('project');
 assert.match(elements.audience.innerHTML,/変身するなら/);
 assert.doesNotMatch(elements.audience.innerHTML,/何色/);
 go('project');
});
test('10チーム設定の全員表示、裁判得点と取り消し',async()=>{
 go('reset');
 handlers.change({target:{id:'teamCount',value:'10',dataset:{}}});
 assert.equal(state().names.length,10);
 go('begin');
 assert.equal(state().scores.length,10);
 click({mode:'court'});
 response=async()=>({ok:true,json:async()=>({kind:'draft',provider:'workers-ai',reply:'新事件！',draft:{mode:'court',title:'おやつ事件',prompt:'最後のプリンを食べたら有罪か？',evidence:'実は自由に食べていいプリンだった！',options:[],criterion:'判定役が決める'}})});
 go('draft');await wait();go('publish');
 go('pro');
 assert.deepEqual(Array.from(state().scores.slice(0,3)),[3,1,2]);
 assert.equal(state().scores.length,10);
 go('undo');assert.ok(state().scores.every(x=>x===0));
});
test('2チームの裁判ではスタッフが判定役',async()=>{
 go('reset');
 handlers.change({target:{id:'teamCount',value:'2',dataset:{}}});
 go('begin');
 click({mode:'court'});
 go('draft');await wait();go('publish');
 assert.match(elements.root.innerHTML,/司会スタッフ/);
 go('def');
 assert.deepEqual(Array.from(state().scores),[1,3]);
});
test('配色はダークな操作盤からパステル系のデザインへ',()=>{
 const css=fs.readFileSync(new URL('../game-v4.css',import.meta.url),'utf8');
 assert.match(css,/#fff9f1/);
 assert.match(css,/\.mascot/);
 assert.match(css,/\.chatlog/);
});
