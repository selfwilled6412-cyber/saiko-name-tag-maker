(function voiceOnlyHost(){
"use strict";

const games=[
 {id:"sync",name:"ぴったりシンクロ",rule:"同じチームの二人が、相談せずに二つの選択肢から一つを選びます。答えが同じなら成功です。"},
 {id:"pitch",name:"おすすめプレゼン",rule:"身近なものを、とっておきの商品として三十秒で紹介します。言葉の工夫を競います。"},
 {id:"mime",name:"ジェスチャー対決",rule:"言葉を使わず、お題の場面をジェスチャーで伝えます。絵で伝えても大丈夫です。"},
 {id:"court",name:"もしも裁判",rule:"検察チームと弁護チームが意見を出し、判定役が勝ちを決めます。途中で新しい証拠も出ます。"},
 {id:"press",name:"記者会見チャレンジ",rule:"思いがけない質問に、五秒以内で答えます。はい、いいえ、わかりません、は禁止です。"},
 {id:"choice",name:"どっちを選ぶ？",rule:"二つの選択肢から一つを選び、チームで理由も考えます。正解は一つではありません。"},
 {id:"challenge",name:"ぴったりチャレンジ",rule:"時間や回数を比べる、安全で気軽な記録対決です。"}
];

const examples={
 sync:[
  {prompt:"旅行に行くなら、海と山のどちら？",options:["海","山"]},
  {prompt:"朝に飲むなら、お茶とコーヒーのどちら？",options:["お茶","コーヒー"]},
  {prompt:"休日に出かけるなら、動物園と水族館のどちら？",options:["動物園","水族館"]}
 ],
 pitch:[
  {prompt:"目の前にある紙コップを、世界に一つの宝物として紹介してみよう。",criterion:"三十秒以内に、良いところを二つ言えたら成功です。"},
  {prompt:"いつもの鉛筆を、特別な一本として紹介してみよう。",criterion:"三十秒以内に、魅力を二つ伝えたら成功です。"},
  {prompt:"何も入っていない箱を、便利な新商品として紹介してみよう。",criterion:"三十秒以内に、使い道を二つ伝えたら成功です。"}
 ],
 mime:[
  {prompt:"猫が初めて洗濯機を見て、びっくりしている場面を伝えよう。",criterion:"相手が場面を当てられたら成功です。"},
  {prompt:"ペンギンが電車に乗ろうとして、切符を探している場面を伝えよう。",criterion:"相手が場面を当てられたら成功です。"},
  {prompt:"宇宙飛行士が、無重力でくしゃみをした場面を伝えよう。",criterion:"相手が場面を当てられたら成功です。"}
 ],
 court:[
  {prompt:"最後のプリンを食べた人は、有罪か？",evidence:"プリンには、どうぞ食べてください、とメモがありました。"},
  {prompt:"みんなの唐揚げに無断でレモンをかけたら、有罪か？",evidence:"本人は、全員に確認したつもりだったようです。"},
  {prompt:"休憩室の時計を五分進めた人は、有罪か？",evidence:"遅刻を減らしたくて、みんなを思ってしたことでした。"}
 ],
 press:[
  {prompt:"会社の会議を全部カラオケにしたのは、なぜですか？"},
  {prompt:"新しい制服をパジャマにした理由を教えてください。"},
  {prompt:"社内のあいさつを全部、動物の鳴き声にしたのはなぜですか？"}
 ],
 choice:[
  {prompt:"一日だけ使えるなら、どちらの能力がいい？",options:["空を飛べる","動物と話せる"]},
  {prompt:"旅をするなら、どちらがいい？",options:["無人島","宇宙ステーション"]},
  {prompt:"一週間暮らすなら、どちらがいい？",options:["大きな船","大きな列車"]}
 ],
 challenge:[
  {prompt:"目を閉じて、ちょうど十秒だと思ったら手を上げてください。",criterion:"十秒との誤差が一番小さい人が勝ちです。"},
  {prompt:"座ったまま、十五秒をぴったり当ててください。",criterion:"時間のずれが一番少ない人が勝ちです。"},
  {prompt:"片手で十秒間に何回、指を開いて閉じられるか挑戦してください。",criterion:"正しくできた回数が一番多い人が勝ちです。"}
 ]
};

const root=document.getElementById("stage");
const saveKey="saiko-voice-host-v2";
const legacyKey="saiko-voice-host-v1";
const voiceKey="saiko-voice-choice-v1";
const empty=()=>({
 started:false,phase:"ready",gameIndex:0,questionNumber:0,
 names:["チーム1","チーム2","チーム3"],scores:[0,0,0],staff:"吉村",
 lastExample:"",question:null,recent:[],lastScore:null
});
let state=empty();
try{
 const saved=JSON.parse(localStorage.getItem(saveKey)||localStorage.getItem(legacyKey)||"null");
 if(saved?.started&&Array.isArray(saved.names)&&saved.names.length>=2&&saved.names.length<=10){
  state={...empty(),...saved};
  state.scores=state.names.map((_,i)=>Number(saved.scores?.[i])||0);
 }
}catch{}

let activated=false;
let speaking=false;
let working=false;
let listeningWanted=false;
let recognizerBusy=false;
let micDenied=false;
let recognition=null;
let recognitionEpoch=0;
let recognitionRetry=0;
let listenTimer=0;
let speechTimer=0;
let speechJob=0;
let lastSpeech="";
let lastHeardAt=0;
let showAdmin=false;
let pending=null;
let holdTimer=0;
let holdStart=null;
let selectedVoice="";
try{selectedVoice=String(localStorage.getItem(voiceKey)||"")}catch{}

const escapeHTML=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const norm=value=>String(value||"").normalize("NFKC").toLowerCase().replace(/[\s、。！？!?,.・「」『』（）()]/g,"");
const persist=()=>{try{localStorage.setItem(saveKey,JSON.stringify(state))}catch{}};
const currentGame=()=>games[state.gameIndex]||games[0];
const isMatch=(value,parts)=>parts.some(part=>value.includes(part));

function teamNameInputs(names=state.names){
 return names.map((name,index)=>`<label>${index+1}組目<input data-team-name="${index}" maxlength="14" value="${escapeHTML(name)}" placeholder="チーム${index+1}"></label>`).join("");
}

function adminMarkup(){
 if(!showAdmin)return "";
 const scoreRows=state.names.map((name,index)=>`<div class="score-row"><span>${escapeHTML(name)}　<strong>${state.scores[index]}点</strong></span><span><button data-action="score" data-team="${index}" data-points="1">+1</button><button data-action="score" data-team="${index}" data-points="3">+3</button><button data-action="score" data-team="${index}" data-points="5">+5</button></span></div>`).join("");
 const voices=japaneseVoices();
 const voiceOptions=voices.map(voice=>`<option value="${escapeHTML(voice.name)}"${voice.name===selectedVoice?" selected":""}>${escapeHTML(voice.name)}</option>`).join("");
 return `<div class="admin-backdrop"><section class="admin-panel" role="dialog" aria-modal="true" aria-label="管理と復旧">
  <h1>管理・復旧</h1>
  <p class="admin-state">${escapeHTML(currentGame().name)}／${escapeHTML(state.phase)}／マイク ${micDenied?"要確認":recognizerBusy?"聞き取り中":"待機"}</p>
  <form id="settingsForm" class="settings-form">
   <label>チーム数<select id="adminTeams">${Array.from({length:9},(_,i)=>i+2).map(count=>`<option value="${count}"${count===state.names.length?" selected":""}>${count}</option>`).join("")}</select></label>
   <label>スタッフの呼び名<input id="adminStaff" maxlength="14" value="${escapeHTML(state.staff)}"></label>
   <fieldset class="team-names"><legend>チーム名</legend><div id="teamNameFields" class="team-name-grid">${teamNameInputs()}</div><p>得点の音声指示にも使います。例：赤チームに5点</p></fieldset>
   <button type="submit">設定を保存</button>
  </form>
  <div class="voice-settings">
   <label>読み上げる声<select id="adminVoice"><option value="">自動（おすすめ）</option>${voiceOptions}</select></label>
   <button type="button" data-action="previewVoice">声を試す</button>
  </div>
  <form id="commandForm" class="command-form">
   <label>音声が通らない時の文字入力<input id="adminCommand" maxlength="80" autocomplete="off" enterkeyhint="send" placeholder="例：説明終わったよ"></label>
   <button type="submit">文字で実行</button>
  </form>
  <div class="admin-actions"><button data-action="resume">マイク再開</button><button data-action="repeat">もう一度読む</button><button data-action="nextQuestion">次のお題</button><button data-action="nextGame">次のゲーム</button></div>
  <div class="score-list">${scoreRows}</div>
  <div class="admin-actions"><button data-action="undoScore">直前の得点を戻す</button><button data-action="reset" class="danger">新しい大会</button><button data-action="closeAdmin" class="close">閉じる</button></div>
  <p class="admin-note">この画面は通常非表示です。閉じたあとは声だけで進行します。</p>
 </section></div>`;
}

function render(){
 root.className=`stage ${activated?"activated":"waiting"} ${speaking?"talking":recognizerBusy?"listening":working?"thinking":"idle"}`;
 root.innerHTML=`<div class="scene" aria-hidden="true"><div class="glow"></div><div class="voice-ring ring-one"></div><div class="voice-ring ring-two"></div></div>
  <div class="avatar-frame"><div class="avatar-sprite"><img class="avatar-image avatar-idle" src="/coach-avatar.png" alt="サイ校ゲームの男性スポーツコーチ姿のアバター"><img class="avatar-image avatar-mouth" src="/coach-avatar-speaking.png" alt="" aria-hidden="true"></div></div>
  ${!activated?'<button class="start-surface" data-action="activate" aria-label="画面を一度タップして音声ゲームを開始"></button>':""}
  <p class="sr-only" aria-live="assertive">${speaking?"アバターが話しています":recognizerBusy?"スタッフの声を聞いています":"音声待機中"}</p>
  ${adminMarkup()}`;
}

function clearListenTimer(){clearTimeout(listenTimer);listenTimer=0;}
function stopListening(){
 clearListenTimer();
 recognitionEpoch++;
 const old=recognition;
 recognition=null;
 recognizerBusy=false;
 if(old){try{old.onend=null;old.onerror=null;old.onresult=null;old.abort?.()}catch{try{old.stop?.()}catch{}}}
}

function cancelSpeech(){
 speechJob++;
 clearTimeout(speechTimer);
 speechTimer=0;
 try{window.speechSynthesis?.cancel?.()}catch{}
 speaking=false;
}

function voiceScore(voice){
 const name=String(voice?.name||"");
 let score=String(voice?.lang||"").toLowerCase()==="ja-jp"?100:50;
 if(/natural|enhanced|premium/i.test(name))score+=100;
 if(/online/i.test(name))score+=45;
 if(/keita|otoya|ichiro|daichi/i.test(name))score+=38;
 if(/nanami|kyoko|haruka/i.test(name))score+=24;
 if(/google/i.test(name))score+=18;
 if(voice?.localService===false)score+=8;
 return score;
}

function japaneseVoices(){
 const voices=window.speechSynthesis?.getVoices?.()||[];
 return voices.filter(voice=>String(voice.lang||"").toLowerCase().startsWith("ja")).sort((a,b)=>voiceScore(b)-voiceScore(a)||String(a.name).localeCompare(String(b.name),"ja"));
}

function chooseVoice(){
 const voices=japaneseVoices();
 return voices.find(voice=>voice.name===selectedVoice)||voices[0]||null;
}

function speechChunks(text){
 const clean=String(text||"").replace(/\s+/g," ").trim();
 if(!clean)return [];
 const sentences=clean.match(/[^。！？!?]+[。！？!?]?/g)||[clean];
 const chunks=[];
 let current="";
 for(const sentence of sentences){
  const part=sentence.trim();
  if(!part)continue;
  if(part.length>145){
   if(current){chunks.push(current);current=""}
   for(let i=0;i<part.length;i+=120)chunks.push(part.slice(i,i+120).trim());
   continue;
  }
  if(current&&current.length+part.length>145){chunks.push(current);current=part}
  else current+=part;
 }
 if(current)chunks.push(current);
 return chunks.filter(Boolean);
}

function say(text,{listenAfter=true}={}){
 const spoken=String(text||"").replace(/\s+/g," ").trim();
 if(!spoken)return Promise.resolve();
 lastSpeech=spoken;
 stopListening();
 cancelSpeech();
 speaking=true;
 render();
 const job=++speechJob;
 const chunks=speechChunks(spoken);
 return new Promise(resolve=>{
  const finish=()=>{
   if(job!==speechJob){resolve();return}
   clearTimeout(speechTimer);speechTimer=0;speaking=false;render();resolve();
   if(listenAfter)queueListen(900);
  };
  const play=index=>{
   if(job!==speechJob){resolve();return}
   if(index>=chunks.length){finish();return}
   if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){finish();return}
   const utterance=new window.SpeechSynthesisUtterance(chunks[index]);
   utterance.lang="ja-JP";utterance.rate=0.96;utterance.pitch=0.92;utterance.volume=1;
   const voice=chooseVoice();if(voice)utterance.voice=voice;
   let ended=false;
   const next=()=>{if(ended||job!==speechJob)return;ended=true;clearTimeout(speechTimer);play(index+1)};
   utterance.onend=next;utterance.onerror=next;
   speechTimer=setTimeout(next,Math.min(30000,7000+chunks[index].length*230));
   try{window.speechSynthesis.speak(utterance)}catch{next()}
  };
  setTimeout(()=>play(0),120);
 });
}

function queueListen(delay=700){
 clearListenTimer();
 if(!activated||!listeningWanted||speaking||working||showAdmin||micDenied)return;
 listenTimer=setTimeout(()=>{
  if(!activated||!listeningWanted||speaking||working||showAdmin||micDenied||recognizerBusy)return;
  startRecognition();
 },delay);
}

function bestTranscript(event){
 const results=event?.results;
 if(!results)return "";
 for(let i=results.length-1;i>=0;i--){
  if(results[i]?.isFinal===false)continue;
  const choices=Array.from(results[i]||[]).map(item=>({text:String(item?.transcript||"").trim(),confidence:Number(item?.confidence)||0})).filter(item=>item.text);
  choices.sort((a,b)=>b.confidence-a.confidence);
  if(choices[0]?.text)return choices[0].text;
 }
 return "";
}

function startRecognition(){
 const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SpeechRecognition){
  micDenied=true;listeningWanted=false;render();
  void say("このブラウザでは音声認識を使えません。画面を長押しすると、復旧メニューを開けます。",{listenAfter:false});
  return;
 }
 stopListening();
 const epoch=recognitionEpoch;
 try{
  const recognizer=new SpeechRecognition();
  recognition=recognizer;
  recognizer.lang="ja-JP";recognizer.continuous=false;recognizer.interimResults=false;recognizer.maxAlternatives=3;
  recognizer.onstart=()=>{if(epoch!==recognitionEpoch)return;recognizerBusy=true;recognitionRetry=0;render()};
  recognizer.onresult=event=>{
   if(epoch!==recognitionEpoch)return;
   const words=bestTranscript(event);
   recognizerBusy=false;recognition=null;lastHeardAt=Date.now();render();
   if(words)void interpret(words);
   else queueListen(650);
  };
  recognizer.onerror=event=>{
   if(epoch!==recognitionEpoch)return;
   const code=String(event?.error||"");
   recognizerBusy=false;recognition=null;render();
   if(["not-allowed","service-not-allowed","audio-capture"].includes(code)){
    micDenied=true;listeningWanted=false;
    void say("マイクを使えないみたいです。画面を長押しして、復旧メニューからマイクを再開してください。",{listenAfter:false});
    return;
   }
   recognitionRetry=Math.min(recognitionRetry+1,5);
   queueListen(code==="network"?Math.min(8000,800*Math.pow(2,recognitionRetry)):700);
  };
  recognizer.onend=()=>{
   if(epoch!==recognitionEpoch)return;
   recognizerBusy=false;recognition=null;render();
   if(!speaking&&!working)queueListen(700);
  };
  recognizer.start();
 }catch{
  recognizerBusy=false;recognition=null;recognitionRetry=Math.min(recognitionRetry+1,5);render();queueListen(Math.min(5000,500*recognitionRetry));
 }
}

function parseJapaneseNumber(value){
 const input=norm(value);
 const arabic=input.match(/\d{1,3}/);if(arabic)return Number(arabic[0]);
 const digits={零:0,〇:0,一:1,二:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9};
 if(input==="十")return 10;
 const ten=input.indexOf("十");
 if(ten>=0){const left=ten===0?1:(digits[input[ten-1]]??0);const right=ten===input.length-1?0:(digits[input[ten+1]]??0);return left*10+right}
 for(const [key,valueNumber] of Object.entries(digits))if(input.includes(key))return valueNumber;
 return NaN;
}

function parseTeamCount(message){
 const text=norm(message).replace(/チーム|組/g,"");
 const count=parseJapaneseNumber(text);
 return Number.isInteger(count)&&count>=2&&count<=10?count:null;
}

function parseScore(message){
 const line=norm(message);
 if(!line.includes("点"))return null;
 let teamIndex=-1;
 const direct=line.match(/(?:チーム|team)(10|[1-9]|[一二三四五六七八九十])/i);
 if(direct)teamIndex=parseJapaneseNumber(direct[1])-1;
 if(teamIndex<0){
  for(let i=0;i<state.names.length;i++)if(line.includes(norm(state.names[i]))){teamIndex=i;break}
 }
 const pointMatch=line.match(/(?:に|へ|が)?(\d{1,2}|[一二三四五六七八九十]{1,3})点/);
 if(!pointMatch)return null;
 const points=parseJapaneseNumber(pointMatch[1]);
 if(teamIndex<0||teamIndex>=state.names.length||!Number.isInteger(points)||points<1||points>99)return null;
 return {teamIndex,points};
}

function rankedText(){
 const rows=state.scores.map((score,index)=>({score,index})).sort((a,b)=>b.score-a.score||a.index-b.index);
 let previous=null;let rank=0;
 return rows.map((row,index)=>{if(row.score!==previous){rank=index+1;previous=row.score}return `${rank}位、${state.names[row.index]}、${row.score}点`}).join("。")+"。";
}

function fallback(mode,exclude=""){
 const list=examples[mode]||examples.sync;
 const blocked=new Set([exclude,...state.recent.slice(-8)].filter(Boolean));
 const candidates=list.filter(item=>!blocked.has(item.prompt));
 const pool=candidates.length?candidates:list;
 const item=pool[Math.floor(Math.random()*pool.length)];
 return {mode,title:currentGame().name,prompt:item.prompt,options:item.options||[],evidence:item.evidence||"",criterion:item.criterion||""};
}

async function produce(mode,message,old){
 let draft=null;
 try{
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),15000);
  try{
   const response=await fetch("/api/partner",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({kind:"draft",mode,teamCount:state.names.length,message,draft:old||null,recent:state.recent.slice(-8)}),signal:controller.signal});
   if(response.ok){const data=await response.json();if(data.draft?.prompt)draft=data.draft}
  }finally{clearTimeout(timeout)}
 }catch{}
 const question=draft?{...draft,mode}:fallback(mode,old?.prompt||state.lastExample);
 if(question.prompt===state.lastExample)return fallback(mode,state.lastExample);
 return question;
}

function verbalQuestion(question){
 let text=String(question.prompt||"");
 if(Array.isArray(question.options)&&question.options.length===2)text+=` 選択肢は、A、${question.options[0]}。B、${question.options[1]}。`;
 if(question.criterion&&!text.includes(question.criterion))text+=` 判定は、${question.criterion}`;
 return text;
}

async function showExample(extra=""){
 working=true;render();
 const game=currentGame();
 const question=await produce(game.id,`ゲームの例題を一件。${extra} ${game.rule} 本番用と内容を重複させない。`,null);
 state.lastExample=question.prompt;state.question=null;state.phase="example";working=false;persist();render();
 await say(`第${state.gameIndex+1}ゲームは、${game.name}です。${game.rule} まずは例題です。${verbalQuestion(question)} ${state.staff||"スタッフ"}さん、みんなに分かるように一度実演してください。終わったら、説明終わったよ、と教えてください。`);
}

async function showQuestion(extra=""){
 working=true;render();
 const game=currentGame();
 const question=await produce(game.id,`例題とは別の、新しい本番用のお題を作る。${extra} 例題:${state.lastExample}`,state.question);
 state.question=question;state.questionNumber++;state.phase="live";state.recent.push(question.prompt);state.recent=state.recent.slice(-24);working=false;persist();render();
 await say(`ありがとう。それでは、みなさんスタートです。第${state.gameIndex+1}ゲーム、${state.questionNumber}問目のお題は、${verbalQuestion(question)} さあ、挑戦してください。`);
}

async function nextGame(){
 state.gameIndex=(state.gameIndex+1)%games.length;state.questionNumber=0;state.phase="transition";state.lastExample="";state.question=null;persist();
 await showExample();
}

async function chatReply(message){
 working=true;render();let reply="";
 try{
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),13000);
  try{
   const response=await fetch("/api/partner",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({kind:"chat",mode:currentGame().id,teamCount:state.names.length,message,history:[],recent:state.recent.slice(-5)}),signal:controller.signal});
   if(response.ok){const data=await response.json();reply=String(data.reply||"").trim()}
  }finally{clearTimeout(timeout)}
 }catch{}
 working=false;render();
 await say(reply||"うまく聞き取れなかったかもしれません。次のお題、次のゲーム、もう一度、のように短く話してください。");
}

async function handlePending(message){
 if(!pending)return false;
 const value=norm(message);
 const yes=isMatch(value,["はい","いいよ","オッケー","ok","お願いします","その通り"]);
 const no=isMatch(value,["違う","いいえ","やめて","取消","取り消し","キャンセル"]);
 if(Date.now()-pending.createdAt>20000){pending=null;await say("確認の時間が過ぎたので、操作を取り消しました。");return true}
 if(!yes&&!no){await say("はい、または、違う、と答えてください。");return true}
 const command=pending;pending=null;
 if(no){await say("わかりました。取り消しました。");return true}
 if(command.type==="score"){
  state.scores[command.teamIndex]+=command.points;
  state.lastScore={teamIndex:command.teamIndex,points:command.points};persist();render();
  await say(`${state.names[command.teamIndex]}に${command.points}点を加えました。合計${state.scores[command.teamIndex]}点です。`);return true;
 }
 if(command.type==="reset"){
  const staff=state.staff;state=empty();state.staff=staff;state.started=true;state.phase="team_setup";persist();render();
  await say("新しい大会を始めます。チームはいくつですか。二から十の数字で教えてください。");return true;
 }
 return false;
}

async function interpret(raw){
 const message=norm(raw);
 if(!message||working||speaking)return;
 if(await handlePending(raw))return;

 if(state.phase==="team_setup"){
  const count=parseTeamCount(raw);
  if(!count){await say("二から十までのチーム数を、三チーム、のように教えてください。");return}
  state.names=Array.from({length:count},(_,index)=>`チーム${index+1}`);state.scores=Array(count).fill(0);state.phase="intro";persist();render();
  await say(`${count}チームですね。それでは始めます。`,{listenAfter:false});
  await showExample();return;
 }

 if(isMatch(message,["もう一度","もういちど","繰り返して","聞こえなかった","もういっかい"])){await say(lastSpeech);return}
 if(isMatch(message,["順位","何点","得点教えて","点数教えて"])){await say("ただいまの得点は、"+rankedText());return}
 if(isMatch(message,["得点を戻して","点を戻して","今の得点を取り消","加点を取り消"])){undoScore(true);return}
 if(isMatch(message,["最初から","新しい大会","大会をやり直"])){pending={type:"reset",createdAt:Date.now()};await say("今の得点を消して、新しい大会にしていいですか。");return}
 if(state.phase==="example"&&isMatch(message,["説明終わ","練習終わ","準備できた","実演終わ","実践終わ","説明できた","みんな分かった","はいできた","終わったよ"])){await showQuestion();return}
 if(isMatch(message,["例題を変えて","別の例題"])){await showExample("別の例題にする。");return}
 if(isMatch(message,["次のゲーム","次の種目","種目変更"])){await nextGame();return}
 if(isMatch(message,["次のお題","次の問題","もう一問","新しい問題"])){await showQuestion();return}
 if(isMatch(message,["もっと簡単","やさしくして","もっと難しく","難しくして","もっと面白く","違うお題","別のお題"])){
  if(state.phase==="example")await showExample(raw);else await showQuestion(raw);return;
 }
 if(isMatch(message,["新しい証拠","新証拠","証拠を"])){await say(state.question?.evidence?"新しい証拠です。"+state.question.evidence:"今のお題には、追加の証拠はありません。");return}
 const score=parseScore(raw);
 if(score){pending={type:"score",...score,createdAt:Date.now()};await say(`${state.names[score.teamIndex]}に${score.points}点でいいですか。はい、または、違う、と答えてください。`);return}
 await chatReply(raw);
}

function undoScore(speakResult=false){
 const item=state.lastScore;
 if(!item||item.teamIndex<0||item.teamIndex>=state.scores.length){if(speakResult)void say("取り消せる得点はありません。");return}
 state.scores[item.teamIndex]=Math.max(0,state.scores[item.teamIndex]-item.points);state.lastScore=null;persist();render();
 if(speakResult)void say(`${state.names[item.teamIndex]}の直前の${item.points}点を取り消しました。`);
}

async function requestMicrophone(){
 if(!window.navigator?.mediaDevices?.getUserMedia)return true;
 try{
  const stream=await window.navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
  stream.getTracks?.().forEach(track=>track.stop());return true;
 }catch{return false}
}

async function activate(){
 if(activated)return;
 activated=true;listeningWanted=true;micDenied=false;render();
 const granted=await requestMicrophone();
 if(!granted){micDenied=true;listeningWanted=false;render();await say("マイクを使えません。ブラウザのマイクを許可してから、画面を長押しして復旧メニューを開いてください。",{listenAfter:false});return}
 if(state.started){
  await say(`おかえりなさい。第${state.gameIndex+1}ゲーム、${currentGame().name}です。${state.phase==="example"?"説明が終わったら、説明終わったよ、と教えてください。":state.phase==="team_setup"?"チームはいくつですか。二から十の数字で教えてください。":"続けるときは、次のお題、と声をかけてください。"}`);
  return;
 }
 state.started=true;state.phase="team_setup";persist();render();
 await say("こんにちは。サイ校ゲームを始めます。チームはいくつですか。二から十の数字で教えてください。");
}

function openAdmin(){
 if(showAdmin)return;
 listeningWanted=false;stopListening();cancelSpeech();showAdmin=true;render();
}

function closeAdmin(){
 showAdmin=false;listeningWanted=true;render();queueListen(500);
}

function saveSettings(){
 const count=Math.max(2,Math.min(10,Number(document.getElementById("adminTeams")?.value||state.names.length)));
 const staff=String(document.getElementById("adminStaff")?.value||state.staff||"スタッフ").trim().slice(0,14)||"スタッフ";
 const inputs=Array.from(document.querySelectorAll?.("[data-team-name]")||[]);
 const requested=Array.from({length:count},(_,index)=>String(inputs[index]?.value||state.names[index]||`チーム${index+1}`).trim().slice(0,14));
 const used=new Set();
 const names=requested.map((value,index)=>{
  const base=value||`チーム${index+1}`;let candidate=base;let suffix=2;
  while(used.has(norm(candidate))){const tail=String(suffix++);candidate=base.slice(0,Math.max(1,14-tail.length))+tail}
  used.add(norm(candidate));return candidate;
 });
 const oldScores=state.scores.slice();state.names=names;state.scores=names.map((_,index)=>oldScores[index]||0);state.staff=staff;
 if(state.lastScore?.teamIndex>=count)state.lastScore=null;
 persist();render();
}

function refreshTeamNameFields(){
 const container=document.getElementById("teamNameFields");
 if(!container)return;
 const count=Math.max(2,Math.min(10,Number(document.getElementById("adminTeams")?.value||state.names.length)));
 const current=Array.from(document.querySelectorAll?.("[data-team-name]")||[]).map(input=>String(input.value||""));
 const names=Array.from({length:count},(_,index)=>current[index]||state.names[index]||`チーム${index+1}`);
 container.innerHTML=teamNameInputs(names);
}

function saveVoiceChoice(){
 selectedVoice=String(document.getElementById("adminVoice")?.value||"");
 try{localStorage.setItem(voiceKey,selectedVoice)}catch{}
}

async function runTypedCommand(){
 const command=String(document.getElementById("adminCommand")?.value||"").trim();
 if(!command)return;
 if(!state.started){state.started=true;state.phase="team_setup";persist()}
 activated=true;showAdmin=false;listeningWanted=!micDenied;render();
 await interpret(command);
}

function handleAction(button){
 const action=button.dataset.action;
 if(action==="activate"){void activate();return}
 if(action==="closeAdmin"){closeAdmin();return}
 if(action==="previewVoice"){
  saveVoiceChoice();
  void say("こんにちは。サイ校ゲームを、いっしょに楽しみましょう。",{listenAfter:false});return;
 }
 if(action==="resume"){micDenied=false;activated=true;showAdmin=false;listeningWanted=true;render();queueListen(250);return}
 if(action==="repeat"){showAdmin=false;listeningWanted=true;render();void say(lastSpeech||"音声ゲームを再開します。");return}
 if(action==="nextQuestion"){showAdmin=false;listeningWanted=true;render();void showQuestion();return}
 if(action==="nextGame"){showAdmin=false;listeningWanted=true;render();void nextGame();return}
 if(action==="undoScore"){undoScore(false);return}
 if(action==="score"){
  const teamIndex=Number(button.dataset.team),points=Number(button.dataset.points);
  if(Number.isInteger(teamIndex)&&state.scores[teamIndex]!=null&&[1,3,5].includes(points)){state.scores[teamIndex]+=points;state.lastScore={teamIndex,points};persist();render()}
  return;
 }
 if(action==="reset"){
  if(window.confirm("現在の得点を消して、新しい大会を始めますか？")){const staff=state.staff;state=empty();state.staff=staff;state.started=true;state.phase="team_setup";persist();showAdmin=false;listeningWanted=true;render();void say("新しい大会を始めます。チームはいくつですか。二から十の数字で教えてください。")}
 }
}

document.addEventListener("click",event=>{const button=event.target?.closest?.("[data-action]");if(button)handleAction(button)});
document.addEventListener("submit",event=>{
 if(event.target?.id==="settingsForm"){event.preventDefault();saveSettings();return}
 if(event.target?.id==="commandForm"){event.preventDefault();void runTypedCommand()}
});
document.addEventListener("change",event=>{
 if(event.target?.id==="adminVoice")saveVoiceChoice();
 if(event.target?.id==="adminTeams")refreshTeamNameFields();
});
document.addEventListener("pointerdown",event=>{
 if(event.target?.closest?.(".admin-panel"))return;
 holdStart={x:event.clientX,y:event.clientY};clearTimeout(holdTimer);
 holdTimer=setTimeout(()=>{holdTimer=0;openAdmin()},1400);
});
document.addEventListener("pointermove",event=>{
 if(!holdStart)return;
 if(Math.abs(event.clientX-holdStart.x)>12||Math.abs(event.clientY-holdStart.y)>12){clearTimeout(holdTimer);holdTimer=0;holdStart=null}
});
for(const type of ["pointerup","pointercancel","pointerleave"])document.addEventListener(type,()=>{clearTimeout(holdTimer);holdTimer=0;holdStart=null});
document.addEventListener("keydown",event=>{if(event.shiftKey&&event.key==="Escape"){event.preventDefault();showAdmin?closeAdmin():openAdmin()}});
document.addEventListener("visibilitychange",()=>{if(document.hidden){stopListening()}else if(activated&&!showAdmin){listeningWanted=true;queueListen(900)}});
window.addEventListener?.("beforeunload",()=>{stopListening();cancelSpeech()});
if(window.speechSynthesis)window.speechSynthesis.onvoiceschanged=()=>{if(showAdmin&&!speaking)render()};

render();
})();
