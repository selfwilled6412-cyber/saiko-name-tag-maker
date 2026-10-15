import test from 'node:test';import assert from 'node:assert/strict';
import {onRequestPost} from '../functions/api/partner.js';
const url='https://saiko-world-grand-prix.pages.dev/api/partner';
const request=(kind,message='もっとおもしろくして')=>new Request(url,{method:'POST',headers:{Origin:'https://saiko-world-grand-prix.pages.dev','Content-Type':'application/json'},body:JSON.stringify({mode:'court',kind,message,history:[{who:'host',text:'日常生活がいい'}],teamCount:6,draft:null})});
test('相談は自然な返事だけで、公開用のお題は作らない',async()=>{
 const env={AI:{run:async()=>({response:'日常の小さな出来事を大事件にしてみよう！'})}};
 const r=await onRequestPost({request:request('chat'),env});
 assert.equal(r.status,200);const j=await r.json();assert.equal(j.kind,'chat');assert.equal(j.draft,undefined);assert.match(j.reply,/大事件/);
});
test('お題案だけを生成し、スタッフの出題ボタンを必要とする',async()=>{
 const env={AI:{run:async()=>({response:JSON.stringify({reply:'この案はどう？',title:'冷蔵庫裁判',prompt:'最後のプリンを食べたら有罪か？',evidence:'実はみんなの分も買ってきていた！',options:[],criterion:'判定役が決める'})})}};
 const r=await onRequestPost({request:request('draft'),env});assert.equal(r.status,200);
 const j=await r.json();assert.equal(j.kind,'draft');assert.match(j.draft.prompt,/有罪/);assert.equal(j.published,undefined);
});
test('AI不調時は503で端末内の予備出題に切り替えられる',async()=>{
 const r=await onRequestPost({request:request('draft'),env:{}});assert.equal(r.status,503);assert.equal((await r.json()).error,'AI_UNBOUND');
});
test('空の裁判証拠、不正な種目、外部サイトからの投稿を拒否',async()=>{
 const bad={AI:{run:async()=>({response:JSON.stringify({title:'無効',prompt:'何かをしたら有罪か？',evidence:''})})}};
 assert.equal((await onRequestPost({request:request('draft'),env:bad})).status,503);
 const r=new Request(url,{method:'POST',headers:{Origin:'https://example.com','Content-Type':'application/json'},body:JSON.stringify({mode:'court',kind:'chat'})});
 assert.equal((await onRequestPost({request:r,env:bad})).status,403);
});
