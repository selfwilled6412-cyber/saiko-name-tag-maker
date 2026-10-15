import test from 'node:test';import assert from 'node:assert/strict';
import {onRequestPost} from '../functions/api/director.js';
function req(obj,origin='https://saiko-world-grand-prix.pages.dev'){return new Request(origin+'/api/director',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(obj)});}
test('Workers AIが未設定でも有料APIを呼ばず503でフォールバック可能',async()=>{
 const r=await onRequestPost({request:req({mode:'court',message:'変な裁判にして'}),env:{}});
 assert.equal(r.status,503);assert.equal((await r.json()).error,'AI_UNBOUND');
});
test('AIレスポンスはサーバーで安全に形を整える',async()=>{
 const env={AI:{run:async()=>({response:JSON.stringify({reply:'はい！',mode:'court',title:'新事件',prompt:'納豆を宇宙に持ち込むのは有罪か？',options:[],evidence:'証人カッパ',criterion:'裁判官が決める'})})}};
 const r=await onRequestPost({request:req({mode:'court',message:'次の事件'}),env});
 assert.equal(r.status,200);assert.equal((await r.json()).item.mode,'court');
});
test('未定義のモードとクロスオリジン要求は拒否',async()=>{
 assert.equal((await onRequestPost({request:req({mode:'strange'}),env:{}})).status,400);
 const request=new Request('https://saiko-world-grand-prix.pages.dev/api/director',{method:'POST',headers:{Origin:'https://example.org','Content-Type':'application/json'},body:'{}'});
 assert.equal((await onRequestPost({request,env:{}})).status,403);
});
