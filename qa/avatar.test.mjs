import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const script=fs.readFileSync(new URL("../avatar-stage.js",import.meta.url),"utf8");
const markup={innerHTML:"",className:""};
const handlers={};
const db=new Map();
const utterances=[];
const recognized=[];

class Utterance{
 constructor(text){this.text=text;this.onend=null;this.onerror=null}
}

class Recognition{
 constructor(){recognized.push(this);this.onstart=null;this.onresult=null;this.onend=null;this.onerror=null}
 start(){this.active=true;this.onstart?.()}
 abort(){this.active=false}
 stop(){this.active=false}
}

const window={
 SpeechSynthesisUtterance:Utterance,
 SpeechRecognition:Recognition,
 speechSynthesis:{
  getVoices(){return[{name:"Microsoft Nanami",lang:"ja-JP"}]},
  cancel(){},
  speak(utterance){utterances.push(utterance.text);queueMicrotask(()=>utterance.onend?.())}
 },
 navigator:{mediaDevices:{getUserMedia:async()=>({getTracks(){return[{stop(){}}]}})}},
 confirm(){return true},
 addEventListener(){}
};

const adminTeams={value:"5"};
const adminStaff={value:"吉村"};
const adminVoice={value:"Microsoft Nanami"};
const adminCommand={value:""};
const document={
 hidden:false,
 getElementById(id){if(id==="stage")return markup;if(id==="adminTeams")return adminTeams;if(id==="adminStaff")return adminStaff;if(id==="adminVoice")return adminVoice;if(id==="adminCommand")return adminCommand;return null},
 addEventListener(type,callback){(handlers[type]??=[]).push(callback)}
};

let counter=0;
const fetch=async(request,options)=>{
 const url=String(request?.url||request);
 if(!url.includes("/api/partner"))throw Error("unexpected URL");
 const body=JSON.parse(options?.body||request.body);
 counter++;
 return {ok:true,json:async()=>body.kind==="chat"
  ?{kind:"chat",reply:"わかりました。声で続けましょう。"}
  :{kind:"draft",draft:{
   mode:body.mode,title:`テスト${counter}`,
   prompt:`${body.message.includes("例題")?"例題":"本番"}${counter}は何でしょう？`,
   options:["sync","choice"].includes(body.mode)?["海","山"]:[],
   evidence:"新しい証拠が見つかりました。",criterion:"正しくできたチームが勝ちです。"
  }}}
};

const context={
 window,document,localStorage:{getItem(key){return db.get(key)||null},setItem(key,value){db.set(key,value)}},fetch,
 console,Math,Date,JSON,AbortController,
 setTimeout(fn,ms){return setTimeout(fn,Math.min(ms,2))},clearTimeout,
 setInterval(){return 0},clearInterval(){}
};

vm.runInNewContext(script,context,{timeout:2500});

const state=()=>JSON.parse(db.get("saiko-voice-host-v2"));
const wait=(ms=45)=>new Promise(resolve=>setTimeout(resolve,ms));
function dispatch(type,event){for(const handler of handlers[type]||[])handler(event)}
function click(action,extra={}){dispatch("click",{target:{closest(){return{dataset:{action,...extra}}}}})}
async function voice(text){
 const recognizer=recognized.at(-1);
 assert.ok(recognizer?.onresult,`recognizer missing for: ${text}; utterances=${utterances.length}; class=${markup.className}`);
 recognizer.onresult({results:[Object.assign([{transcript:text,confidence:.92}],{isFinal:true})]});
 await wait();
}

test("通常画面はアバターだけで、文字・字幕・操作ボタンを見せない",()=>{
 assert.match(markup.innerHTML,/coach-avatar\.png/);
 assert.match(markup.innerHTML,/coach-avatar-speaking\.png/);
 assert.match(markup.innerHTML,/start-surface/);
 assert.doesNotMatch(markup.innerHTML,/class="speech"|class="brand"|game-info|tiny-menu|おバカ|字幕/);
 assert.doesNotMatch(markup.innerHTML,/管理・復旧/);
});

test("最初の一度の操作後、チーム数も声で設定して例題を始める",async()=>{
 click("activate");await wait();
 assert.equal(state().phase,"team_setup");
 assert.match(utterances.join(""),/チームはいくつ/);
 await voice("5チームです");
 assert.equal(state().names.length,5);
 assert.equal(state().phase,"example");
 assert.match(utterances.join(""),/第1ゲーム/);
 assert.match(utterances.join(""),/吉村さん/);
});

test("説明終了、次のお題、次ゲームを声だけで実行できる",async()=>{
 await voice("説明終わったよ");
 assert.equal(state().phase,"live");
 assert.equal(state().questionNumber,1);
 await voice("次のお題をお願いします");
 assert.equal(state().questionNumber,2);
 await voice("次のゲームに進んで");
 assert.equal(state().gameIndex,1);
 assert.equal(state().questionNumber,0);
 assert.equal(state().phase,"example");
});

test("得点は音声確認後だけ反映し、直前の加点を取り消せる",async()=>{
 await voice("チーム1に5点");
 assert.equal(state().scores[0],0);
 assert.match(utterances.join(""),/5点でいいですか/);
 await voice("はい、それでお願いします");
 assert.equal(state().scores[0],5);
 await voice("今の得点を取り消して");
 assert.equal(state().scores[0],0);
});

test("2〜10チーム、日本語の数字、順位読み上げに対応する",async()=>{
 await voice("新しい大会");
 await voice("はい");
 assert.equal(state().phase,"team_setup");
 await voice("十チーム");
 assert.equal(state().names.length,10);
 assert.equal(state().phase,"example");
 await voice("順位を教えて");
 assert.match(utterances.join(""),/ただいまの得点/);
});

test("長押し時だけ管理・復旧メニューを表示する",async()=>{
 assert.doesNotMatch(markup.innerHTML,/管理・復旧/);
 dispatch("pointerdown",{target:{closest(){return null}},clientX:20,clientY:20});
 await wait(10);
 assert.match(markup.innerHTML,/管理・復旧/);
 assert.match(markup.innerHTML,/マイク再開/);
 assert.match(markup.innerHTML,/adminCommand/);
 assert.match(markup.innerHTML,/adminVoice/);
 click("closeAdmin");
 assert.doesNotMatch(markup.innerHTML,/管理・復旧/);
});

test("隠し文字入力を音声と同じ命令として実行できる",async()=>{
 dispatch("pointerdown",{target:{closest(){return null}},clientX:20,clientY:20});
 await wait(10);
 adminCommand.value="説明終わったよ";
 dispatch("submit",{target:{id:"commandForm"},preventDefault(){}});
 await wait();
 assert.equal(state().phase,"live");
 assert.doesNotMatch(markup.innerHTML,/管理・復旧/);
});

test("隠し画面で日本語音声を選び、試聴できる",async()=>{
 dispatch("pointerdown",{target:{closest(){return null}},clientX:20,clientY:20});
 await wait(10);
 click("previewVoice");
 await wait();
 assert.equal(db.get("saiko-voice-choice-v1"),"Microsoft Nanami");
 assert.match(utterances.join(""),/いっしょに楽しみましょう/);
 click("closeAdmin");
});
