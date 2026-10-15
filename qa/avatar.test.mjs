import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const script=fs.readFileSync(new URL('../avatar-stage.js',import.meta.url),'utf8');
const markup={innerHTML:"",className:""};
const handlers={};const db=new Map();const utterances=[],recognized=[];
class U{constructor(t){this.text=t;this.onend=null;this.onerror=null;}}
class Rec{
 constructor(){recognized.push(this);this.onresult=null;this.onend=null;this.onerror=null;}
 start(){this.active=true}
 stop(){this.active=false;}
}
const window={SpeechSynthesisUtterance:U,SpeechRecognition:Rec,
 speechSynthesis:{getVoices(){return[{name:'Google 日本語',lang:'ja-JP'}]},cancel(){},speak(u){utterances.push(u.text);setTimeout(()=>u.onend?.(),1)}} ,
 confirm(){return true}};
const select={value:'5'},staff={value:'吉村'};
const document={getElementById(id){if(id==='stage')return markup;if(id==='teams')return select;if(id==='staffName')return staff;return null},addEventListener(k,cb){handlers[k]=cb}};
let counter=0;
const fallback=async(request)=>{
 if(!request.url?.includes('/api/partner')&&!String(request).includes('/api/partner'))throw Error('unexpected URL');
 const body=JSON.parse(request.body);
 const mode=body.mode;
 counter++;
 return {ok:true,json:async()=>({kind:"draft",draft:{
 mode,title:"テスト "+counter,prompt:(body.message.includes("例題")?"例題":"本番")+" "+counter+" は何でしょう？",
 options:mode==="sync"||mode==="choice"?["海","山"]:[],
 evidence:"新しい証拠が見つかった！",criterion:"正しく答えたチームが勝ち"}})};
};
const c={window,document,localStorage:{getItem(k){return db.get(k)||null},setItem(k,v){db.set(k,v)}},fetch:fallback,
 console,Math,Date,JSON,AbortController,setTimeout(fn,ms){return setTimeout(fn,ms===380?1:ms)},clearTimeout,setInterval(){return 0},clearInterval(){}};
vm.runInNewContext(script,c,{timeout:2500});
const state=()=>JSON.parse(db.get('saiko-voice-host-v1'));
function click(action){handlers.click({target:{closest(){return{dataset:{action}}}}});}
const wait=()=>new Promise(r=>setTimeout(r,35));
const voice=async(text)=>{const r=recognized[recognized.length-1];assert.ok(r?.onresult);r.onresult({results:[[{transcript:text}]]});await wait();};
test('開始前はアバターとチーム数、マイク許可案内だけ',()=>{
 assert.match(markup.innerHTML,/わくわくゲームショー/);
 assert.match(markup.innerHTML,/チーム数/);
 assert.doesNotMatch(markup.innerHTML,/おバカ/);
});
test('一度の開始操作後、声で例題から本題へ進められる',async()=>{
 click('begin');await wait();
 assert.equal(state().names.length,5);
 assert.equal(state().staff,'吉村');
 assert.equal(state().phase,'example');
 assert.match(utterances.at(-1),/第1ゲーム/);
 assert.match(utterances.at(-1),/例題/);
 assert.match(utterances.at(-1),/吉村さん/);
 await voice('OK、説明終わったよ');
 assert.equal(state().phase,'live');
 assert.equal(state().questionNumber,1);
 assert.match(utterances.at(-1),/みなさん、スタート/);
});
test('次のお題と次のゲームを声で実行',async()=>{
 await voice('次のお題をお願いします');
 assert.equal(state().questionNumber,2);
 assert.equal(state().gameIndex,0);
 await voice('次のゲームに進んで');
 assert.equal(state().gameIndex,1);
 assert.equal(state().questionNumber,0);
 assert.equal(state().phase,'example');
});
test('スタッフが話すだけで得点を追加できる',async()=>{
 await voice('チーム1に5点');
 assert.equal(state().scores[0],5);
 assert.match(utterances.at(-1),/5点を加えました/);
 await voice('現在の順位は？');
 assert.match(utterances.at(-1),/チーム1、5点/);
});
test('説明が終わったまで本題を開始しない',async()=>{
 const previous=state().questionNumber;
 await voice('もう一度');
 assert.equal(state().questionNumber,previous);
 await voice('説明終わった');
 assert.equal(state().questionNumber,1);
 assert.equal(state().phase,'live');
});
test('アバターと字幕は常時表示され、チャット操作盤は表示しない',()=>{
 assert.match(markup.innerHTML,/role="img"/);
 assert.match(markup.innerHTML,/class="speech"/);
 assert.doesNotMatch(markup.innerHTML,/AIとチャット|チャット履歴|スタッフ用進行台本|おバカ/);
});
