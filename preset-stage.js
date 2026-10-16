(function presetVoiceHost(){
"use strict";

const games=Array.isArray(window.SAIKO_PRESET_GAMES)?window.SAIKO_PRESET_GAMES:[];
const root=document.getElementById("stage");
if(!root||games.length!==7){if(root)root.textContent="ゲームデータを読み込めませんでした。";return}

const meta={
 sync:{aliases:["ぴったりシンクロ","シンクロ"],defaultMode:"team",explain:"ぴったりシンクロは、二人一組のチーム戦です。二人で相談せず、二つの選択肢から一つを選びます。私が、せーの、と言ったら二人同時に答えてください。答えが同じならシンクロ成功です。"},
 pitch:{aliases:["おすすめプレゼン","お勧めプレゼン","プレゼン"],defaultMode:"individual",explain:"おすすめプレゼンは個人戦です。身近な物を、とびきり魅力的な商品として一分間で紹介してください。判定は、魅力、分かりやすさ、発想や工夫の三項目です。それぞれ二点、合計六点満点です。"},
 mime:{aliases:["ジェスチャー対決","ジェスチャー"],defaultMode:"team",explain:"ジェスチャー対決は、二人一組のチーム戦です。一人がお題を言葉や声を使わずに表現し、もう一人が答えます。一チームにつき二問で、一問ごとに役割を交代します。三問目からは次のチームです。お題は演じる人だけに秘密で伝えます。"},
 court:{aliases:["もしも裁判","もしもさいばん","裁判"],defaultMode:"individual",explain:"もしも裁判は個人戦です。挑戦者は、有罪か無罪かを選び、理由を説明してください。最初の意見のあと、スタッフが、新しい証拠お願いします、と言うと、追加の証拠を発表します。証拠を聞いたあと、最終判決と理由を発表してください。"},
 press:{aliases:["記者会見チャレンジ","記者会見"],defaultMode:"individual",explain:"記者会見チャレンジは個人戦です。一人につき一問、思いがけない質問に答えてください。質問を聞いたら五秒以内に話し始めます。はい、いいえ、分かりません、だけで終わらせず、その場で理由や物語を作ってください。二問目は二人目が挑戦します。"},
 choice:{aliases:["どっちを選ぶ","どちらを選ぶ"],defaultMode:"team",explain:"どっちを選ぶ、は二人一組のチーム戦です。二つの選択肢から、チームで一つを選んでください。相談して決めたら、選んだ答えと理由を発表します。正解はありません。なるほどと思わせる理由や、楽しい使い方を考えましょう。"},
 challenge:{aliases:["ぴったりチャレンジ"],defaultMode:"individual",explain:"ぴったりチャレンジは、時間や長さなどを、自分の感覚で目標に近づけるゲームです。目標との差がいちばん小さい人、またはチームが勝ちです。スタッフが安全を確認し、必要な計測を行ってください。"}
};

const saveKey="saiko-preset-preview-v1";
const voiceKey="saiko-voice-choice-v1";
const empty=()=>({
 started:false,gameId:"",pattern:1,mode:"team",questionIndex:-1,phase:"idle",evidenceShown:false,
 names:["チーム1","チーム2","チーム3"],scores:[0,0,0],staff:"スタッフ",lastScore:null
});
let state=empty();
try{
 const saved=JSON.parse(localStorage.getItem(saveKey)||"null");
 if(saved&&Array.isArray(saved.names)&&saved.names.length>=2&&saved.names.length<=10){
  state={...empty(),...saved};
  state.scores=state.names.map((_,index)=>Number(saved.scores?.[index])||0);
 }
}catch{}

let activated=false;
let speaking=false;
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
let lastHeard="";
let showAdmin=false;
let showSecret=false;
let pending=null;
let holdTimer=0;
let holdStart=null;
let selectedVoice="";
try{selectedVoice=String(localStorage.getItem(voiceKey)||"")}catch{}

const escapeHTML=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const norm=value=>String(value||"").normalize("NFKC").toLowerCase().replace(/[\s、。！？!?,.・「」『』（）()]/g,"");
const isMatch=(value,parts)=>parts.some(part=>value.includes(norm(part)));
const persist=()=>{try{localStorage.setItem(saveKey,JSON.stringify(state))}catch{}};
const currentGame=()=>games.find(game=>game.id===state.gameId)||null;
const currentItems=()=>currentGame()?.patterns?.[String(state.pattern)]||currentGame()?.patterns?.[state.pattern]||[];
const currentItem=()=>currentItems()[state.questionIndex]||null;

function teamNameInputs(names=state.names){
 return names.map((name,index)=>`<label>${index+1}組目<input data-team-name="${index}" maxlength="14" value="${escapeHTML(name)}" placeholder="チーム${index+1}"></label>`).join("");
}

function adminMarkup(){
 if(!showAdmin)return "";
 const game=currentGame();
 const gameOptions=games.map(item=>`<option value="${item.id}"${item.id===(game?.id||"sync")?" selected":""}>${escapeHTML(item.name)}</option>`).join("");
 const patternOptions=[1,2,3].map(value=>`<option value="${value}"${value===state.pattern?" selected":""}>パターン${value}</option>`).join("");
 const voiceOptions=japaneseVoices().map(voice=>`<option value="${escapeHTML(voice.name)}"${voice.name===selectedVoice?" selected":""}>${escapeHTML(voice.name)}</option>`).join("");
 const scoreRows=state.names.map((name,index)=>`<div class="score-row"><span>${escapeHTML(name)}　<strong>${state.scores[index]}点</strong></span><span><button data-action="score" data-team="${index}" data-points="1">+1</button><button data-action="score" data-team="${index}" data-points="3">+3</button><button data-action="score" data-team="${index}" data-points="5">+5</button></span></div>`).join("");
 const secret=state.gameId==="mime"&&currentItem()?`<div class="secret-card"><strong>演じる人だけ見てください</strong>${showSecret?`<p>${escapeHTML(currentItem().prompt)}</p>`:"<p>お題は隠れています</p>"}<div class="admin-actions"><button data-action="toggleSecret">${showSecret?"お題を隠す":"秘密のお題を表示"}</button><button data-action="speakSecret">回答者が離れたので読み上げる</button></div><p class="secret-warning">回答者に画面や音声が届かないことを確認してください。</p></div>`:"";
 const status=game?`${game.name}／パターン${state.pattern}／${state.questionIndex>=0?`${state.questionIndex+1}問目`:"説明待ち"}／${state.phase}`:"ゲーム未選択";
 return `<div class="admin-backdrop"><section class="admin-panel preset-panel" role="dialog" aria-modal="true" aria-label="プリセット版の管理と復旧">
  <h1>管理・復旧</h1>
  <p class="admin-state">${escapeHTML(status)}／マイク ${micDenied?"要確認":recognizerBusy?"聞き取り中":"待機"}</p>
  <div class="progress-card">聞き取った言葉：${escapeHTML(lastHeard||"まだありません")}<br>通常画面に文字は表示されません。</div>
  <h2>ゲームを選んで開始</h2>
  <div class="preset-grid">
   <label>ゲーム<select id="adminGame">${gameOptions}</select></label>
   <label>パターン<select id="adminPattern">${patternOptions}</select></label>
   <label>形式<select id="adminMode"><option value="individual"${state.mode==="individual"?" selected":""}>個人戦</option><option value="team"${state.mode==="team"?" selected":""}>チーム戦</option></select></label>
   <button data-action="startSelected">説明から開始</button>
  </div>
  <div class="admin-actions"><button data-action="firstQuestion">1問目</button><button data-action="previousQuestion">前のお題</button><button data-action="nextQuestion">次のお題</button><button data-action="repeat">もう一度読む</button><button data-action="evidence">新しい証拠</button></div>
  <div class="jump-row"><label>問題番号<select id="adminQuestion">${Array.from({length:10},(_,index)=>`<option value="${index}"${index===state.questionIndex?" selected":""}>${index+1}問目</option>`).join("")}</select></label><button data-action="jumpQuestion">この問題から再開</button><button data-action="endGame">ゲーム終了</button></div>
  ${secret}
  <form id="commandForm" class="command-form"><label>音声が通らない時の文字入力<input id="adminCommand" maxlength="100" autocomplete="off" enterkeyhint="send" placeholder="例：次のお題お願いします"></label><button type="submit">文字で実行</button></form>
  <h2>声とマイク</h2>
  <div class="voice-settings"><label>読み上げる声<select id="adminVoice"><option value="">自動（おすすめ）</option>${voiceOptions}</select></label><button type="button" data-action="previewVoice">声を試す</button></div>
  <div class="admin-actions"><button data-action="resume">マイク再開</button></div>
  <h2>チーム名と得点</h2>
  <form id="settingsForm" class="settings-form"><label>チーム数<select id="adminTeams">${Array.from({length:9},(_,index)=>index+2).map(count=>`<option value="${count}"${count===state.names.length?" selected":""}>${count}</option>`).join("")}</select></label><label>スタッフの呼び名<input id="adminStaff" maxlength="14" value="${escapeHTML(state.staff)}"></label><fieldset class="team-names"><legend>チーム名</legend><div id="teamNameFields" class="team-name-grid">${teamNameInputs()}</div></fieldset><button type="submit">設定を保存</button></form>
  <div class="score-list">${scoreRows}</div>
  <div class="admin-actions"><button data-action="undoScore">直前の得点を戻す</button><button data-action="reset" class="danger">確認版を初期化</button><button data-action="closeAdmin" class="close">閉じる</button></div>
  <div class="preset-help"><code>長押し</code>でこの画面を開閉できます。音声開始例：<code>ぴったりシンクロ、パターン1、スタート</code></div>
 </section></div>`;
}

function render(){
 root.className=`stage ${activated?"activated":"waiting"} ${speaking?"talking":recognizerBusy?"listening":"idle"}`;
 root.innerHTML=`<div class="scene" aria-hidden="true"><div class="glow"></div><div class="voice-ring ring-one"></div><div class="voice-ring ring-two"></div></div><div class="avatar-frame"><div class="avatar-sprite"><img class="avatar-image avatar-idle" src="/coach-avatar.png" alt="サイ校ゲームの男性スポーツコーチ姿のアバター"><img class="avatar-image avatar-mouth" src="/coach-avatar-speaking.png" alt="" aria-hidden="true"></div></div>${!activated?'<button class="start-surface" data-action="activate" aria-label="画面を一度タップして音声ゲームを開始"></button>':""}<p class="sr-only" aria-live="assertive">${speaking?"アバターが話しています":recognizerBusy?"スタッフの声を聞いています":"音声待機中"}</p>${adminMarkup()}`;
}

function clearListenTimer(){clearTimeout(listenTimer);listenTimer=0}
function stopListening(){
 clearListenTimer();recognitionEpoch++;
 const old=recognition;recognition=null;recognizerBusy=false;
 if(old){try{old.onend=null;old.onerror=null;old.onresult=null;old.abort?.()}catch{try{old.stop?.()}catch{}}}
}
function cancelSpeech(){speechJob++;clearTimeout(speechTimer);speechTimer=0;try{window.speechSynthesis?.cancel?.()}catch{}speaking=false}

function voiceScore(voice){
 const name=String(voice?.name||"");let score=String(voice?.lang||"").toLowerCase()==="ja-jp"?100:50;
 if(/natural|enhanced|premium/i.test(name))score+=100;if(/online/i.test(name))score+=45;if(/keita|otoya|ichiro|daichi/i.test(name))score+=38;if(/nanami|kyoko|haruka/i.test(name))score+=24;if(/google/i.test(name))score+=18;if(voice?.localService===false)score+=8;return score;
}
function japaneseVoices(){return (window.speechSynthesis?.getVoices?.()||[]).filter(voice=>String(voice.lang||"").toLowerCase().startsWith("ja")).sort((a,b)=>voiceScore(b)-voiceScore(a)||String(a.name).localeCompare(String(b.name),"ja"))}
function chooseVoice(){const voices=japaneseVoices();return voices.find(voice=>voice.name===selectedVoice)||voices[0]||null}
function speechChunks(text){
 const clean=String(text||"").replace(/\s+/g," ").trim();if(!clean)return [];
 const sentences=clean.match(/[^。！？!?]+[。！？!?]?/g)||[clean];const chunks=[];let current="";
 for(const sentence of sentences){const part=sentence.trim();if(!part)continue;if(part.length>145){if(current){chunks.push(current);current=""}for(let index=0;index<part.length;index+=120)chunks.push(part.slice(index,index+120).trim());continue}if(current&&current.length+part.length>145){chunks.push(current);current=part}else current+=part}
 if(current)chunks.push(current);return chunks.filter(Boolean);
}
function say(text,{listenAfter=true}={}){
 const spoken=String(text||"").replace(/\s+/g," ").trim();if(!spoken)return Promise.resolve();
 lastSpeech=spoken;stopListening();cancelSpeech();speaking=true;render();const job=++speechJob;const chunks=speechChunks(spoken);
 return new Promise(resolve=>{
  const finish=()=>{if(job!==speechJob){resolve();return}clearTimeout(speechTimer);speechTimer=0;speaking=false;render();resolve();if(listenAfter)queueListen(900)};
  const play=index=>{if(job!==speechJob){resolve();return}if(index>=chunks.length){finish();return}if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){finish();return}const utterance=new window.SpeechSynthesisUtterance(chunks[index]);utterance.lang="ja-JP";utterance.rate=.96;utterance.pitch=.92;utterance.volume=1;const voice=chooseVoice();if(voice)utterance.voice=voice;let ended=false;const next=()=>{if(ended||job!==speechJob)return;ended=true;clearTimeout(speechTimer);play(index+1)};utterance.onend=next;utterance.onerror=next;speechTimer=setTimeout(next,Math.min(30000,7000+chunks[index].length*230));try{window.speechSynthesis.speak(utterance)}catch{next()}};
  setTimeout(()=>play(0),120);
 });
}

function queueListen(delay=700){clearListenTimer();if(!activated||!listeningWanted||speaking||showAdmin||micDenied)return;listenTimer=setTimeout(()=>{if(!activated||!listeningWanted||speaking||showAdmin||micDenied||recognizerBusy)return;startRecognition()},delay)}
function bestTranscript(event){
 const results=event?.results;if(!results)return "";
 for(let index=results.length-1;index>=0;index--){if(results[index]?.isFinal===false)continue;const choices=Array.from(results[index]||[]).map(item=>({text:String(item?.transcript||"").trim(),confidence:Number(item?.confidence)||0})).filter(item=>item.text).sort((a,b)=>b.confidence-a.confidence);if(choices[0]?.text)return choices[0].text}
 return "";
}
function startRecognition(){
 const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SpeechRecognition){micDenied=true;listeningWanted=false;render();void say("このブラウザでは音声認識を使えません。画面を長押しすると、文字入力で操作できます。",{listenAfter:false});return}
 stopListening();const epoch=recognitionEpoch;
 try{
  const recognizer=new SpeechRecognition();recognition=recognizer;recognizer.lang="ja-JP";recognizer.continuous=false;recognizer.interimResults=false;recognizer.maxAlternatives=3;
  recognizer.onstart=()=>{if(epoch!==recognitionEpoch)return;recognizerBusy=true;recognitionRetry=0;render()};
  recognizer.onresult=event=>{if(epoch!==recognitionEpoch)return;const words=bestTranscript(event);recognizerBusy=false;recognition=null;if(words){lastHeard=words;render();void interpret(words)}else queueListen(650)};
  recognizer.onerror=event=>{if(epoch!==recognitionEpoch)return;const code=String(event?.error||"");recognizerBusy=false;recognition=null;render();if(["not-allowed","service-not-allowed","audio-capture"].includes(code)){micDenied=true;listeningWanted=false;void say("マイクを使えないみたいです。画面を長押しして、文字入力またはマイク再開を使ってください。",{listenAfter:false});return}recognitionRetry=Math.min(recognitionRetry+1,5);queueListen(code==="network"?Math.min(8000,800*Math.pow(2,recognitionRetry)):700)};
  recognizer.onend=()=>{if(epoch!==recognitionEpoch)return;recognizerBusy=false;recognition=null;render();if(!speaking)queueListen(700)};
  recognizer.start();
 }catch{recognizerBusy=false;recognition=null;recognitionRetry=Math.min(recognitionRetry+1,5);render();queueListen(Math.min(5000,500*recognitionRetry))}
}

function parseJapaneseNumber(value){
 const input=norm(value);const arabic=input.match(/\d{1,3}/);if(arabic)return Number(arabic[0]);const digits={零:0,〇:0,一:1,二:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9};if(input==="十")return 10;const ten=input.indexOf("十");if(ten>=0){const left=ten===0?1:(digits[input[ten-1]]??0);const right=ten===input.length-1?0:(digits[input[ten+1]]??0);return left*10+right}for(const [key,number] of Object.entries(digits))if(input.includes(key))return number;return NaN;
}
function parsePattern(message){
 const line=norm(message);const variants={1:["パターン1","パターン一","パターンワン"],2:["パターン2","パターン二","パターンツー"],3:["パターン3","パターン三","パターンスリー"]};
 for(const [number,parts] of Object.entries(variants))if(parts.some(part=>line.includes(norm(part))))return Number(number);return null;
}
function parseStartCommand(raw){
 const line=norm(raw);if(!isMatch(line,["スタート","開始","始めて","はじめて"]))return null;
 const candidates=games.map(game=>({game,alias:(meta[game.id]?.aliases||[]).find(alias=>line.includes(norm(alias)))||""})).filter(item=>item.alias).sort((a,b)=>b.alias.length-a.alias.length);
 if(!candidates.length)return null;const game=candidates[0].game;const pattern=parsePattern(raw);if(!pattern)return {game,missing:"pattern"};
 let mode=meta[game.id].defaultMode;if(game.id==="challenge"){if(line.includes(norm("個人戦")))mode="individual";else if(line.includes(norm("チーム戦")))mode="team";else return {game,pattern,missing:"mode"}}
 return {game,pattern,mode};
}
function parseScore(message){
 const line=norm(message);if(!line.includes("点"))return null;let teamIndex=-1;const direct=line.match(/(?:チーム|team)(10|[1-9]|[一二三四五六七八九十])/i);if(direct)teamIndex=parseJapaneseNumber(direct[1])-1;if(teamIndex<0){for(let index=0;index<state.names.length;index++)if(line.includes(norm(state.names[index]))){teamIndex=index;break}}const pointMatch=line.match(/(?:に|へ|が)?(\d{1,2}|[一二三四五六七八九十]{1,3})点/);if(!pointMatch)return null;const points=parseJapaneseNumber(pointMatch[1]);if(teamIndex<0||teamIndex>=state.names.length||!Number.isInteger(points)||points<1||points>99)return null;return {teamIndex,points};
}
function rankedText(){const rows=state.scores.map((score,index)=>({score,index})).sort((a,b)=>b.score-a.score||a.index-b.index);let previous=null,rank=0;return rows.map((row,index)=>{if(row.score!==previous){rank=index+1;previous=row.score}return `${rank}位、${state.names[row.index]}、${row.score}点`}).join("。")+"。"}

function explanation(game,mode){
 let text=meta[game.id].explain;
 if(game.id==="challenge")text=`ぴったりチャレンジ、${mode==="team"?"チーム戦":"個人戦"}です。${text}`;
 return text;
}
async function startGame(game,pattern,mode){
 state.started=true;state.gameId=game.id;state.pattern=pattern;state.mode=mode||meta[game.id].defaultMode;state.questionIndex=-1;state.phase="awaiting_first";state.evidenceShown=false;showSecret=false;persist();render();
 await say(`了解しました。${game.name}、パターン${pattern}を始めます。最初にルールを説明します。${explanation(game,state.mode)}以上で説明は終わりです。準備ができたら、一問目スタート、と言ってください。`);
}
function itemSpeech(item){
 if(state.gameId==="court")return `${item.prompt}まず、有罪か無罪かと、その理由を発表してください。意見を発表したあと、スタッフは、新しい証拠お願いします、と言ってください。`;
 if(state.gameId==="challenge")return state.mode==="team"?item.team:item.individual;
 return item.prompt;
}
function mimeTurnText(index){const team=Math.floor(index/2)+1;const within=index%2+1;return within===1?`${team}チーム目の一問目です。`:`${team}チーム目の二問目です。演じる人と答える人を交代してください。`}
async function announceQuestion(index){
 const game=currentGame();const items=currentItems();if(!game){await say("先に、ゲーム名とパターンを指定してスタートしてください。");return}if(index<0||index>=items.length){await finishGame();return}
 state.questionIndex=index;state.evidenceShown=false;showSecret=false;
 if(game.id==="mime"){
  state.phase="mime_wait_secret";persist();render();
  await say(`${mimeTurnText(index)}答える人は、耳をふさいで後ろを向くか、音が聞こえない場所へ移動してください。準備ができたら、お題をお願いします、と言ってください。`);return;
 }
 state.phase="live";persist();render();
 const person=game.id==="press"?`${index+1}人目の挑戦です。`:"";
 await say(`第${index+1}問です。${person}${itemSpeech(items[index])}それでは、スタート。`);
}
async function revealMimeByVoice(){
 const item=currentItem();if(state.gameId!=="mime"||!item){await say("現在は、ジェスチャーのお題待ちではありません。");return}
 state.phase="mime_wait_start";persist();render();
 await say(`${item.prompt}お題を確認しました。答える人が戻ったら、ゲームスタート、と言ってください。`);
}
async function startMimePlay(){if(state.gameId!=="mime"||state.questionIndex<0)return;state.phase="live";persist();render();await say("それでは、ジェスチャー、スタート。")}
async function showEvidence(){
 const item=currentItem();if(state.gameId!=="court"||!item?.evidence){await say("今のお題には、追加の証拠はありません。");return}
 state.evidenceShown=true;persist();render();await say(`新しい証拠です。${item.evidence}以上が新しい証拠です。判決を変えてもかまいません。最終判決と、その理由をお願いします。`);
}
async function finishGame(){
 const game=currentGame();if(!game)return;state.phase="complete";persist();render();
 await say(`これで第十問まで終了です。お疲れさまでした。${game.name}、パターン${state.pattern}は終了です。次に遊ぶときは、ゲーム名、パターン、スタート、と言ってください。`);
}
async function endGame(){const game=currentGame();state.phase="idle";state.gameId="";state.questionIndex=-1;state.evidenceShown=false;persist();render();await say(`${game?.name||"ゲーム"}を終了しました。次に遊ぶときは、ゲーム名、パターン、スタート、と言ってください。`)}

async function handlePending(message){
 if(!pending)return false;const value=norm(message);const yes=isMatch(value,["はい","いいよ","オッケー","ok","お願いします","その通り"]);const no=isMatch(value,["違う","いいえ","やめて","取消","取り消し","キャンセル"]);if(Date.now()-pending.createdAt>20000){pending=null;await say("確認の時間が過ぎたので、操作を取り消しました。");return true}if(!yes&&!no){await say("はい、または、違う、と答えてください。");return true}const command=pending;pending=null;if(no){await say("分かりました。取り消しました。");return true}if(command.type==="score"){state.scores[command.teamIndex]+=command.points;state.lastScore={teamIndex:command.teamIndex,points:command.points};persist();render();await say(`${state.names[command.teamIndex]}に${command.points}点を加えました。合計${state.scores[command.teamIndex]}点です。`);return true}return false;
}
async function interpret(raw){
 const message=norm(raw);if(!message||speaking)return false;if(await handlePending(raw))return true;
 const start=parseStartCommand(raw);
 if(start){if(start.missing==="pattern"){await say(`${start.game.name}ですね。パターン1、パターン2、パターン3のどれかを付けて、もう一度言ってください。`);return true}if(start.missing==="mode"){await say("ぴったりチャレンジは、個人戦かチーム戦も付けて、もう一度言ってください。");return true}await startGame(start.game,start.pattern,start.mode);return true}
 if(isMatch(message,["もう一度","もういちど","繰り返して","聞こえなかった","もういっかい"])){await say(lastSpeech||"まだ読み上げた内容はありません。");return true}
 if(isMatch(message,["順位","何点","得点教えて","点数教えて"])){await say("ただいまの得点は、"+rankedText());return true}
 if(isMatch(message,["今は何問目","何問目","現在の問題"])){await say(state.questionIndex>=0?`今は、${currentGame()?.name}、パターン${state.pattern}の第${state.questionIndex+1}問です。`:"現在、お題は始まっていません。");return true}
 if(isMatch(message,["このゲームを終了","ゲーム終了","ゲームを終わる"])){await endGame();return true}
 if(isMatch(message,["最初からやり直し","説明からやり直し"])){const game=currentGame();if(game)await startGame(game,state.pattern,state.mode);else await say("現在、選ばれているゲームはありません。");return true}
 if(isMatch(message,["前のお題","前の問題","一つ戻って"])){if(state.questionIndex>0)await announceQuestion(state.questionIndex-1);else await say("これより前のお題はありません。");return true}
 const jump=message.match(/(10|[1-9]|[一二三四五六七八九十])問目(?:から)?(?:スタート|開始|再開)/);if(jump){const number=parseJapaneseNumber(jump[1]);if(number>=1&&number<=10)await announceQuestion(number-1);return true}
 if(isMatch(message,["新しい証拠","新証拠","証拠をお願いします","証拠お願い"])){await showEvidence();return true}
 if(state.gameId==="mime"&&isMatch(message,["お題をお願いします","お題お願い","秘密のお題"])){await revealMimeByVoice();return true}
 if(state.gameId==="mime"&&isMatch(message,["ゲームスタート","ジェスチャースタート","回答スタート"])){await startMimePlay();return true}
 if(isMatch(message,["一問目スタート","1問目スタート","一問目開始","最初のお題"])){await announceQuestion(0);return true}
 if(isMatch(message,["次のお題お願いします","次のお題","次の問題","次お願いします"])){if(!currentGame()){await say("先に、ゲーム名とパターンを指定してスタートしてください。");return true}if(state.questionIndex<0){await say("最初は、一問目スタート、と言ってください。");return true}if(state.questionIndex>=9)await finishGame();else await announceQuestion(state.questionIndex+1);return true}
 if(isMatch(message,["得点を戻して","点を戻して","今の得点を取り消","加点を取り消"])){undoScore(true);return true}
 const score=parseScore(raw);if(score){pending={type:"score",...score,createdAt:Date.now()};await say(`${state.names[score.teamIndex]}に${score.points}点でいいですか。はい、または、違う、と答えてください。`);return true}
 if(isMatch(message,["使い方","何て言えば","助けて","ヘルプ"])){await say(currentGame()?`現在は、${currentGame().name}、パターン${state.pattern}です。一問目スタート、次のお題お願いします、もう一度、前のお題、今は何問目、このゲームを終了、が使えます。`:"ゲーム名、パターン1、スタート、のように言ってください。");return true}
 queueListen(500);return false;
}

function undoScore(speakResult=false){const item=state.lastScore;if(!item||item.teamIndex<0||item.teamIndex>=state.scores.length){if(speakResult)void say("取り消せる得点はありません。");return}state.scores[item.teamIndex]=Math.max(0,state.scores[item.teamIndex]-item.points);state.lastScore=null;persist();render();if(speakResult)void say(`${state.names[item.teamIndex]}の直前の${item.points}点を取り消しました。`)}
async function requestMicrophone(){if(!window.navigator?.mediaDevices?.getUserMedia)return true;try{const stream=await window.navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});stream.getTracks?.().forEach(track=>track.stop());return true}catch{return false}}
async function activate(){
 if(activated)return;activated=true;listeningWanted=true;micDenied=false;render();const granted=await requestMicrophone();if(!granted){micDenied=true;listeningWanted=false;render();await say("マイクを使えません。ブラウザのマイクを許可してから、画面を長押しして復旧メニューを開いてください。",{listenAfter:false});return}
 const game=currentGame();if(state.started&&game){await say(`おかえりなさい。${game.name}、パターン${state.pattern}です。${state.questionIndex>=0?`今は第${state.questionIndex+1}問です。続けるときは、次のお題お願いします、と言ってください。`:"始めるときは、一問目スタート、と言ってください。"}`);return}
 state.started=true;state.phase="idle";persist();await say("こんにちは。サイ校ゲーム、プリセット確認版です。遊びたいゲーム名、パターン1、スタート、のように言ってください。例えば、ぴったりシンクロ、パターン1、スタート、です。");
}
function openAdmin(){if(showAdmin)return;listeningWanted=false;stopListening();cancelSpeech();showAdmin=true;render()}
function closeAdmin(){showAdmin=false;showSecret=false;listeningWanted=true;render();queueListen(500)}
function refreshTeamNameFields(){const container=document.getElementById("teamNameFields");if(!container)return;const count=Math.max(2,Math.min(10,Number(document.getElementById("adminTeams")?.value||state.names.length)));const current=Array.from(document.querySelectorAll?.("[data-team-name]")||[]).map(input=>String(input.value||""));const names=Array.from({length:count},(_,index)=>current[index]||state.names[index]||`チーム${index+1}`);container.innerHTML=teamNameInputs(names)}
function saveSettings(){
 const count=Math.max(2,Math.min(10,Number(document.getElementById("adminTeams")?.value||state.names.length)));const staff=String(document.getElementById("adminStaff")?.value||state.staff||"スタッフ").trim().slice(0,14)||"スタッフ";const inputs=Array.from(document.querySelectorAll?.("[data-team-name]")||[]);const requested=Array.from({length:count},(_,index)=>String(inputs[index]?.value||state.names[index]||`チーム${index+1}`).trim().slice(0,14));const used=new Set();const names=requested.map((value,index)=>{const base=value||`チーム${index+1}`;let candidate=base,suffix=2;while(used.has(norm(candidate))){const tail=String(suffix++);candidate=base.slice(0,Math.max(1,14-tail.length))+tail}used.add(norm(candidate));return candidate});const oldScores=state.scores.slice();state.names=names;state.scores=names.map((_,index)=>oldScores[index]||0);state.staff=staff;if(state.lastScore?.teamIndex>=count)state.lastScore=null;persist();render();
}
function saveVoiceChoice(){selectedVoice=String(document.getElementById("adminVoice")?.value||"");try{localStorage.setItem(voiceKey,selectedVoice)}catch{}}
async function runTypedCommand(){const command=String(document.getElementById("adminCommand")?.value||"").trim();if(!command)return;activated=true;showAdmin=false;showSecret=false;listeningWanted=!micDenied;render();const handled=await interpret(command);if(!handled)await say("その操作は分かりませんでした。ゲーム名とパターン、または、次のお題お願いします、のように入力してください。")}
function selectedGame(){return games.find(game=>game.id===document.getElementById("adminGame")?.value)||games[0]}
function handleAction(button){
 const action=button.dataset.action;
 if(action==="activate"){void activate();return}if(action==="closeAdmin"){closeAdmin();return}if(action==="previewVoice"){saveVoiceChoice();void say("こんにちは。サイ校ゲームを、いっしょに楽しみましょう。",{listenAfter:false});return}if(action==="resume"){micDenied=false;activated=true;showAdmin=false;showSecret=false;listeningWanted=true;render();queueListen(250);return}
 if(action==="startSelected"){const game=selectedGame();const pattern=Number(document.getElementById("adminPattern")?.value)||1;const mode=game.id==="challenge"?String(document.getElementById("adminMode")?.value||"individual"):meta[game.id].defaultMode;showAdmin=false;showSecret=false;activated=true;listeningWanted=true;render();void startGame(game,pattern,mode);return}
 if(action==="firstQuestion"){showAdmin=false;showSecret=false;listeningWanted=true;render();void announceQuestion(0);return}if(action==="previousQuestion"){const index=Math.max(0,state.questionIndex-1);showAdmin=false;showSecret=false;listeningWanted=true;render();void announceQuestion(index);return}if(action==="nextQuestion"){const index=state.questionIndex<0?0:state.questionIndex+1;showAdmin=false;showSecret=false;listeningWanted=true;render();if(index>9)void finishGame();else void announceQuestion(index);return}if(action==="jumpQuestion"){const index=Math.max(0,Math.min(9,Number(document.getElementById("adminQuestion")?.value)||0));showAdmin=false;showSecret=false;listeningWanted=true;render();void announceQuestion(index);return}
 if(action==="repeat"){showAdmin=false;showSecret=false;listeningWanted=true;render();void say(lastSpeech||"まだ読み上げた内容はありません。");return}if(action==="evidence"){showAdmin=false;showSecret=false;listeningWanted=true;render();void showEvidence();return}if(action==="speakSecret"){showAdmin=false;showSecret=false;listeningWanted=true;render();void revealMimeByVoice();return}if(action==="toggleSecret"){showSecret=!showSecret;render();return}if(action==="endGame"){showAdmin=false;showSecret=false;listeningWanted=true;render();void endGame();return}
 if(action==="undoScore"){undoScore(false);return}if(action==="score"){const teamIndex=Number(button.dataset.team),points=Number(button.dataset.points);if(Number.isInteger(teamIndex)&&state.scores[teamIndex]!=null&&[1,3,5].includes(points)){state.scores[teamIndex]+=points;state.lastScore={teamIndex,points};persist();render()}return}
 if(action==="reset"&&window.confirm("確認版の進行と得点を初期化しますか？")){state=empty();persist();showAdmin=false;showSecret=false;listeningWanted=true;render();void say("確認版を初期化しました。ゲーム名、パターン1、スタート、のように言ってください。");}
}

document.addEventListener("click",event=>{const button=event.target?.closest?.("[data-action]");if(button)handleAction(button)});
document.addEventListener("submit",event=>{if(event.target?.id==="settingsForm"){event.preventDefault();saveSettings();return}if(event.target?.id==="commandForm"){event.preventDefault();void runTypedCommand()}});
document.addEventListener("change",event=>{if(event.target?.id==="adminVoice")saveVoiceChoice();if(event.target?.id==="adminTeams")refreshTeamNameFields()});
document.addEventListener("pointerdown",event=>{if(event.target?.closest?.(".admin-panel"))return;holdStart={x:event.clientX,y:event.clientY};clearTimeout(holdTimer);holdTimer=setTimeout(()=>{holdTimer=0;openAdmin()},1400)});
document.addEventListener("pointermove",event=>{if(!holdStart)return;if(Math.abs(event.clientX-holdStart.x)>12||Math.abs(event.clientY-holdStart.y)>12){clearTimeout(holdTimer);holdTimer=0;holdStart=null}});
for(const type of ["pointerup","pointercancel","pointerleave"])document.addEventListener(type,()=>{clearTimeout(holdTimer);holdTimer=0;holdStart=null});
document.addEventListener("keydown",event=>{if(event.shiftKey&&event.key==="Escape"){event.preventDefault();showAdmin?closeAdmin():openAdmin()}});
document.addEventListener("visibilitychange",()=>{if(document.hidden)stopListening();else if(activated&&!showAdmin){listeningWanted=true;queueListen(900)}});
window.addEventListener?.("beforeunload",()=>{stopListening();cancelSpeech()});
if(window.speechSynthesis)window.speechSynthesis.onvoiceschanged=()=>{if(showAdmin&&!speaking)render()};
window.__SAIKO_PRESET_TEST__={state:()=>state,parseStartCommand,interpret,announceQuestion,startGame};
render();
})();
