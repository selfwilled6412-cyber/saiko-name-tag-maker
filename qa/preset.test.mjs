import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const dataScript=fs.readFileSync(new URL("../preset-game-data.js",import.meta.url),"utf8");
const stageScript=fs.readFileSync(new URL("../preset-stage.js",import.meta.url),"utf8");
const html=fs.readFileSync(new URL("../preset-preview.html",import.meta.url),"utf8");
const css=fs.readFileSync(new URL("../preset-stage.css",import.meta.url),"utf8");

const markup={innerHTML:"",className:"",textContent:""};
const handlers={};
const db=new Map();
const utterances=[];
const recognized=[];

class Utterance{constructor(text){this.text=text;this.onend=null;this.onerror=null}}
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
const elements={
 adminTeams:{value:"3"},adminStaff:{value:"スタッフ"},adminVoice:{value:"Microsoft Nanami"},adminCommand:{value:""},
 adminGame:{value:"sync"},adminPattern:{value:"1"},adminMode:{value:"team"},adminQuestion:{value:"0"}
};
const teamNames=[{value:"赤チーム"},{value:"青チーム"},{value:"黄チーム"}];
const document={
 hidden:false,
 getElementById(id){return id==="stage"?markup:(elements[id]||null)},
 querySelectorAll(selector){return selector==="[data-team-name]"?teamNames:[]},
 addEventListener(type,callback){(handlers[type]??=[]).push(callback)}
};
const context={
 window,document,localStorage:{getItem(key){return db.get(key)||null},setItem(key,value){db.set(key,value)}},
 console,Math,Date,JSON,
 setTimeout(fn,ms){return setTimeout(fn,Math.min(ms,2))},clearTimeout,
 setInterval(){return 0},clearInterval(){}
};

vm.runInNewContext(dataScript,context,{timeout:2500});
vm.runInNewContext(stageScript,context,{timeout:2500});

const wait=(ms=45)=>new Promise(resolve=>setTimeout(resolve,ms));
const snapshot=()=>JSON.parse(JSON.stringify(window.__SAIKO_PRESET_TEST__.state()));
function dispatch(type,event){for(const handler of handlers[type]||[])handler(event)}
function click(action,extra={}){dispatch("click",{target:{closest(){return{dataset:{action,...extra}}}}})}
async function voice(text){
 const recognizer=recognized.at(-1);
 assert.ok(recognizer?.onresult,`recognizer missing for ${text}`);
 recognizer.onresult({results:[Object.assign([{transcript:text,confidence:.95}],{isFinal:true})]});
 await wait();
}

test("プリセットデータは7ゲーム、3パターン、各10問で合計210問",()=>{
 const games=window.SAIKO_PRESET_GAMES;
 assert.equal(games.length,7);
 assert.equal(games.flatMap(game=>Object.values(game.patterns).flat()).length,210);
 for(const game of games)for(const pattern of [1,2,3])assert.equal(game.patterns[pattern].length,10,`${game.name} pattern ${pattern}`);
 const court=games.find(game=>game.id==="court");
 assert.ok(Object.values(court.patterns).flat().every(item=>item.prompt&&item.evidence));
 const challenge=games.find(game=>game.id==="challenge");
 assert.ok(Object.values(challenge.patterns).flat().every(item=>item.individual&&item.team));
});

test("確認版はAI生成APIを呼ばず、通常画面はアバターだけ",()=>{
 assert.doesNotMatch(stageScript,/fetch\s*\(/);
 assert.doesNotMatch(stageScript,/api\/partner/);
 assert.match(html,/preset-game-data\.js/);
 assert.match(html,/preset-stage\.js/);
 assert.match(css,/\.secret-card/);
 assert.match(markup.innerHTML,/coach-avatar\.png/);
 assert.doesNotMatch(markup.innerHTML,/管理・復旧/);
});

test("ゲーム、パターン、1問目、次のお題を音声で進める",async()=>{
 click("activate");await wait();
 await voice("ぴったりシンクロ、パターン2、スタート");
 assert.equal(snapshot().gameId,"sync");
 assert.equal(snapshot().pattern,2);
 assert.equal(snapshot().phase,"awaiting_first");
 await voice("一問目スタート");
 assert.equal(snapshot().questionIndex,0);
 assert.match(utterances.join(""),/おにぎり/);
 await voice("次のお題お願いします");
 assert.equal(snapshot().questionIndex,1);
 assert.match(utterances.join(""),/思いきり笑える映画/);
 await voice("5問目から再開");
 assert.equal(snapshot().questionIndex,4);
});

test("もしも裁判は追加証拠を固定データから読む",async()=>{
 await voice("もしも裁判、パターン1、スタート");
 await voice("一問目スタート");
 assert.equal(snapshot().gameId,"court");
 assert.equal(snapshot().evidenceShown,false);
 await voice("新しい証拠お願いします");
 assert.equal(snapshot().evidenceShown,true);
 assert.match(utterances.join(""),/本日中にご自由にどうぞ/);
});

test("ぴったりチャレンジは個人戦とチーム戦を開始時に区別",async()=>{
 await voice("ぴったりチャレンジ、パターン1、スタート");
 assert.match(utterances.join(""),/個人戦かチーム戦/);
 await voice("ぴったりチャレンジ、チーム戦、パターン3、スタート");
 assert.equal(snapshot().gameId,"challenge");
 assert.equal(snapshot().mode,"team");
 assert.equal(snapshot().pattern,3);
 await voice("一問目スタート");
 assert.match(utterances.join(""),/二人とも12秒/);
});

test("ジェスチャーのお題は回答者への案内後に秘密で開示",async()=>{
 await voice("ジェスチャー対決、パターン1、スタート");
 await voice("一問目スタート");
 assert.equal(snapshot().phase,"mime_wait_secret");
 const before=utterances.join("");
 assert.doesNotMatch(before.slice(before.lastIndexOf("1チーム目")),/ゴリラ/);
 await voice("お題をお願いします");
 assert.equal(snapshot().phase,"mime_wait_start");
 assert.match(utterances.join(""),/ゴリラ/);
 await voice("ゲームスタート");
 assert.equal(snapshot().phase,"live");
});

test("長押しの管理画面に文字入力、手動進行、秘密表示がある",async()=>{
 dispatch("pointerdown",{target:{closest(){return null}},clientX:10,clientY:10});
 await wait(10);
 assert.match(markup.innerHTML,/管理・復旧/);
 assert.match(markup.innerHTML,/adminCommand/);
 assert.match(markup.innerHTML,/この問題から再開/);
 assert.match(markup.innerHTML,/秘密のお題を表示/);
 click("closeAdmin");
 assert.doesNotMatch(markup.innerHTML,/管理・復旧/);
});
