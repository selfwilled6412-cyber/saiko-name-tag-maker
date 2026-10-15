(function voiceHost(){
"use strict";
const games=[
{id:"sync",name:"ぴったりシンクロ",rule:"同じチームの二人が、相談せずに二択から一つを選ぶゲームです。答えが同じなら成功！"},
{id:"pitch",name:"おすすめプレゼン",rule:"身近なものを、とっておきの商品として三十秒で紹介します。言葉の工夫を競います。"},
{id:"mime",name:"ジェスチャー対決",rule:"言葉を使わずに、お題の場面をジェスチャーで伝えます。絵で伝えても大丈夫です。"},
{id:"court",name:"もしも裁判",rule:"検察チームと弁護チームが意見を出して、判定役が勝ちを決めます。途中で新しい証拠も出ます。"},
{id:"press",name:"記者会見チャレンジ",rule:"思いがけない質問に、五秒以内で答えるゲームです。はい、いいえ、わかりません、は禁止です。"},
{id:"choice",name:"どっちを選ぶ？",rule:"どちらを選ぶか、チームで理由も考えるゲームです。正解は一つではありません。"},
{id:"challenge",name:"ぴったりチャレンジ",rule:"時間や回数を比べる、気軽にできる記録対決です。"}];
const examples={
sync:[{prompt:"旅行に行くなら、海と山のどちら？",options:["海","山"]},{prompt:"朝に飲むなら、お茶とコーヒーのどちら？",options:["お茶","コーヒー"]}],
pitch:[{prompt:"目の前にある紙コップを、世界に一つの宝物として紹介してみよう！",criterion:"三十秒以内に、良いところを二つ言えたら成功！"},{prompt:"いつもの鉛筆を、百万円の商品だと思って紹介しよう！",criterion:"三十秒以内に、魅力を二つ伝えたら成功！"}],
mime:[{prompt:"猫が初めて洗濯機を見て、びっくりしている場面を伝えよう。",criterion:"相手が場面を当てられたら成功！"},{prompt:"ペンギンが電車に乗ろうとして、切符を探している場面を伝えよう。"}],
court:[{prompt:"最後のプリンを食べた人は、有罪か？",evidence:"実は、プリンには「どうぞ食べてください」とメモがあった！"},{prompt:"みんなの唐揚げに無断でレモンをかけたら、有罪か？",evidence:"その人は、みんなにレモンが好きか聞いたつもりだった！"}],
press:[{prompt:"社長が会社の会議を全部カラオケにしたのはなぜですか？"},{prompt:"新しい制服がパジャマになった理由を教えてください。"}],
choice:[{prompt:"一日だけ使えるなら、どちらの能力がいい？",options:["空を飛べる","動物と話せる"]},{prompt:"旅をするならどっち？",options:["無人島","宇宙ステーション"]}],
challenge:[{prompt:"目を閉じて、ちょうど十秒だと思ったら手を上げてね。",criterion:"十秒との誤差が一番小さかった人が勝ち！"},{prompt:"座ったまま、十五秒をぴったり当ててみよう。",criterion:"時間のずれが少ないほど高得点。"}]
};
const root=document.getElementById("stage");
const saveKey="saiko-voice-host-v1";
const escapeHTML=t=>String(t??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm=x=>String(x||"").normalize("NFKC").replace(/\s/g,"").toLowerCase();
const empty=()=>({started:false,phase:"ready",gameIndex:0,questionNumber:0,names:["チーム1","チーム2","チーム3"],scores:[0,0,0],staff:"吉村",lastExample:"",question:null,lastAnswer:"",recent:[],courtRound:0});
let state=empty();
try{const s=JSON.parse(localStorage.getItem(saveKey)||"null");if(s?.started&&Array.isArray(s.names)&&s.names.length>=2&&s.names.length<=10)state={...empty(),...s};}catch{}
let avatarText="こんにちは！今日は、みんなで楽しいゲームに挑戦しよう♪";
let statusText="🌷 準備中",lastSpeech=avatarText;
let activated=false,speaking=false,working=false,recognition=null,listeningWanted=false,micDenied=false,recognizerBusy=false,requestVersion=0,voiceTurn=0,speakTimer=null;
let showSetup=!state.started,showType="",textPanel=false;
const persist=()=>{try{localStorage.setItem(saveKey,JSON.stringify(state))}catch{}};
const avatarSVG=`<svg class="avatar" viewBox="0 0 300 340" role="img" aria-label="ゲーム案内役のうさぎアバター、もこ">
<ellipse cx="150" cy="314" rx="90" ry="18" fill="#e6d2dc" opacity=".6"/>
<path d="M94 133 Q39 85 65 25 Q100 -5 121 88" fill="#fff" stroke="#dfb1c4" stroke-width="7"/>
<path d="M206 133 Q261 85 235 25 Q200 -5 179 88" fill="#fff" stroke="#dfb1c4" stroke-width="7"/>
<path d="M84 80 Q74 41 85 25 Q101 37 107 91" fill="#ffd1e2"/>
<path d="M216 80 Q226 41 215 25 Q199 37 193 91" fill="#ffd1e2"/>
<ellipse cx="150" cy="210" rx="112" ry="116" fill="#fffafc" stroke="#e9c0d3" stroke-width="7"/>
<ellipse class="eye" cx="103" cy="188" rx="10" ry="17" fill="#5d4c6a"/>
<ellipse class="eye" cx="197" cy="188" rx="10" ry="17" fill="#5d4c6a"/>
<ellipse cx="79" cy="213" rx="20" ry="10" fill="#ffb4c9"/>
<ellipse cx="221" cy="213" rx="20" ry="10" fill="#ffb4c9"/>
<path d="M144 226 Q150 222 156 226 Q151 234 149 234Z" fill="#e28aa5"/>
<path class="mouth" d="M138 240 Q150 254 162 240" stroke="#a9718e" stroke-width="5" fill="none" stroke-linecap="round"/>
<circle cx="238" cy="111" r="23" fill="#fc9fba"/><path d="M226 109 L237 118 251 98" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M127 308 Q100 287 114 283 Q126 282 150 302 Q174 282 186 283 Q200 287 173 308 Q192 330 174 330 L150 315 126 330 Q108 330 127 308Z" fill="#9f85d9"/>
</svg>`;
function badge(){return `${state.questionNumber?"第"+(state.gameIndex+1)+"ゲーム・"+state.questionNumber+"問目":"第"+(state.gameIndex+1)+"ゲーム"}　${games[state.gameIndex].name}`;}
function overlay(){
 if(showSetup)return `<section class="overlay" role="dialog" aria-modal="true"><div class="panel"><h2>🌸 ゲームを始めよう！</h2><p>はじめにマイクの使用を許可してね。開始後は、アバターに声をかけるだけで進められます。</p><div class="form-grid"><label class="field">チーム数（2〜10）<select id="teams">${Array.from({length:9},(_,i)=>i+2).map(n=>`<option value="${n}"${n===state.names.length?" selected":""}>${n}チーム</option>`).join("")}</select></label><label class="field">スタッフの呼び名<input id="staffName" maxlength="15" value="${escapeHTML(state.staff)}" placeholder="スタッフ"></label></div><p>対応環境：マイク付きのChrome・Edgeなど。音声が使えない端末では文字入力でも進められます。音声案内は端末から聞こえる音量にしてください。</p><div class="actions"><button class="primary" data-action="begin">🎙️ ゲームを始める</button><button data-action="dismiss">あとで</button></div></div></section>`;
 if(showType==="scores")return `<div class="overlay" role="dialog" aria-modal="true"><section class="panel"><h2>🏆 現在の得点</h2>${state.names.map((n,i)=>`<p><strong>${escapeHTML(n)}</strong>　${state.scores[i]}点</p>`).join("")}<p>声で「チーム1に5点」「次のお題」「次のゲーム」と話しかけられます。</p><div class="actions"><button data-action="close">閉じる</button><button data-action="newGame">新しい大会にする</button></div></section></div>`;
 if(showType==="help")return `<div class="overlay" role="dialog" aria-modal="true"><section class="panel"><h2>🎙️ 声で進める操作</h2><p>「説明終わった」→本番のお題へ</p><p>「次のお題」→同じゲームの新しい問題</p><p>「次のゲーム」→次の競技の例題から</p><p>「もう一度」→同じ案内を読む</p><p>「チーム1に5点」→得点加算</p><p>「順位を教えて」→現在の得点を読み上げ</p><p>「もっと簡単に」→新しいお題案を生成</p><p>音声認識が使えない場合は「文字で話す」を利用してね。</p><div class="actions"><button data-action="close">閉じる</button><button data-action="newGame">新しい大会にする</button></div></section></div>`;
 return "";
}
function render(){
 root.className="stage "+(state.started?"started ":"")+(speaking?"talking ":"")+(recognizerBusy?"listening":"sleeping");
 root.innerHTML=`<div class="stars"><span class="star">✦</span><span class="star">✧</span><span class="star">★</span><span class="star">✦</span></div>
 <button class="tiny-menu" data-action="help" aria-label="設定と音声コマンド">⚙️</button>
 <div class="brand"><small>SAIKO HAPPY GAME SHOW</small>サイ校 わくわくゲームショー</div>
 <div class="speaker">
 ${state.started?`<div class="game-info">${escapeHTML(badge())}</div>`:""}
 <div class="character-area">${avatarSVG}<div class="status ${speaking?"talking":recognizerBusy?"listening":""}">${escapeHTML(statusText)}</div></div>
 <div class="speech"><p>${escapeHTML(avatarText)}</p></div></div>
 <div class="foot">
 ${!state.started?`<button class="primary" data-action="openSetup">はじめる</button>`:`<button class="mint" data-action="listen">${micDenied?"マイクを再確認":activated?"🎙️ 聞き取りを再開":"🎙️ 声で始める"}</button><button data-action="text">文字で話す</button><button data-action="scores">🏆 得点</button>`}
 </div><p class="hint">${state.started?"「説明終わった」「次のお題」など、アバターに話しかけてね。":"マイクの利用は最初の一度だけ確認します。"}</p>
 ${overlay()}${textPanel?`<form class="input-fallback" id="textForm"><input id="textLine" placeholder="スタッフの返事を入力" maxlength="230" aria-label="文字で返事"><button type="submit">伝える</button><button type="button" data-action="text">閉じる</button></form>`:""}`;
}
function status(text){statusText=text;render()}
function stopListening(){
 try{if(recognition){recognition.onend=null;recognition.stop();}}catch{}
 recognition=null;recognizerBusy=false;
}
function speechVoice(){
 const all=window.speechSynthesis?.getVoices?.()||[];
 return all.find(v=>v.lang==="ja-JP"&&v.name.toLowerCase().includes("google"))||all.find(v=>v.lang.startsWith("ja"))||null;
}
function say(text,{after=true}={}){
 const spoken=String(text).replace(/\s+/g," ").trim();
 if(!spoken)return;
 lastSpeech=spoken;avatarText=spoken;speaking=true;statusText="🐰 もこがお話し中";stopListening();render();
 const done=()=>{if(!speaking)return;speaking=false;statusText="🎙️ スタッフの声を待っているよ";render();if(after)queueListen()};
 try{
  if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){done();return}
  window.speechSynthesis.cancel();
  const utter=new window.SpeechSynthesisUtterance(spoken);
  utter.lang="ja-JP";utter.rate=0.91;utter.pitch=1.15;utter.volume=1;
  const v=speechVoice();if(v)utter.voice=v;
  utter.onend=done;utter.onerror=done;
  clearTimeout(speakTimer);speakTimer=setTimeout(done,Math.min(80000,9000+spoken.length*310));
  window.speechSynthesis.speak(utter);
 }catch{done();}
}
function queueListen(){
 if(!activated||!listeningWanted||speaking||working||showSetup||micDenied)return;
 setTimeout(()=>{if(!activated||!listeningWanted||speaking||working||recognizerBusy||micDenied)return;listen()},380);
}
function listen(){
 const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Speech){micDenied=true;statusText="文字入力モードを使ってね";render();return}
 stopListening();
 try{
  const rec=new Speech();recognition=rec;rec.lang="ja-JP";rec.continuous=false;rec.interimResults=false;rec.maxAlternatives=1;
  rec.onresult=e=>{const words=String(e.results?.[0]?.[0]?.transcript||"").trim();recognizerBusy=false;recognition=null;if(words)void interpret(words);};
  rec.onerror=e=>{recognizerBusy=false;if(["not-allowed","service-not-allowed","audio-capture"].includes(e.error)){micDenied=true;activated=false;listeningWanted=false;statusText="マイクを使えないので文字入力を使ってね";render()}};
  rec.onend=()=>{recognizerBusy=false;recognition=null;if(!working&&!speaking)queueListen();};
  rec.start();recognizerBusy=true;statusText="🎙️ 聞いているよ";render();
 }catch{recognizerBusy=false;statusText="マイクを準備できませんでした";render()}
}
const isMatch=(s,parts)=>parts.some(x=>s.includes(x));
function rank(){const rows=state.scores.map((v,i)=>({i,v})).sort((a,b)=>b.v-a.v);return rows.map((x,i)=>`${i+1}位、${state.names[x.i]}、${x.v}点`).join("。")}
function addPoints(message){
 const line=norm(message);
 const points=line.match(/([135])点/);if(!points)return false;
 const n=Number(points[1]);let index=-1;
 const number=line.match(/(?:チーム|team)([1-9]|10)/);
 if(number)index=Number(number[1])-1;
 if(index<0)for(let i=0;i<state.names.length;i++)if(line.includes(norm(state.names[i])))index=i;
 const al=line.match(/(?:^|チーム)([a-j])(?:に|へ|が)/);if(index<0&&al)index=al[1].charCodeAt(0)-97;
 if(index<0||index>=state.names.length)return false;
 state.scores[index]+=n;persist();say(`${state.names[index]}に${n}点を加えました！今は${state.scores[index]}点だよ。`);return true;
}
function fallback(mode,exclude=""){
 const list=examples[mode]||examples.sync;
 const item=list.find(x=>x.prompt!==exclude)||list[0];
 return{mode,title:games.find(g=>g.id===mode).name,prompt:item.prompt,options:item.options||[],evidence:item.evidence||"",criterion:item.criterion||""};
}
async function produce(mode,message,old){
 let draft=null;
 try{
  const ac=new AbortController();const timeout=setTimeout(()=>ac.abort(),15000);
  try{
   const r=await fetch("/api/partner",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({kind:"draft",mode,teamCount:state.names.length,message,draft:old||null,recent:state.recent.slice(-6)}),signal:ac.signal});
   if(r.ok){const data=await r.json();if(data.draft?.prompt)draft=data.draft;}
  }finally{clearTimeout(timeout)}
 }catch{}
 const normalized=draft?{...draft,mode}:fallback(mode,old?.prompt);
 if(normalized.prompt===state.lastExample&&mode===games[state.gameIndex].id)return fallback(mode,state.lastExample);
 return normalized;
}
function verbalQuestion(q){let t=q.prompt;
 if(Array.isArray(q.options)&&q.options.length===2)t+=` 選択肢は、A、${q.options[0]}。B、${q.options[1]}。`;
 return t;
}
async function showExample(extra=""){
 working=true;status("🐰 例題を考えているよ");
 const game=games[state.gameIndex];const q=await produce(game.id,`ゲームの例題を1件。${extra} ${game.rule} 本番用と内容が重複しないようにして。`,null);
 state.lastExample=q.prompt;state.question=null;state.phase="example";working=false;persist();
 say(`第${state.gameIndex+1}ゲームは、${game.name}！${game.rule} まずは例題だよ。${verbalQuestion(q)} ${state.staff||"スタッフ"}さん、みんなに分かるように、一度実践してみてね。説明が終わったら、「説明終わったよ」と教えてね。`);
}
async function showQuestion(extra=""){
 working=true;status("🌼 本番のお題を考えているよ");
 const game=games[state.gameIndex];const q=await produce(game.id,`さっきの例題と別の、新しい本番用のお題を作成して。${extra} 例題:${state.lastExample}`,state.question);
 state.question=q;state.questionNumber++;state.phase="live";state.recent.push(q.prompt);state.recent=state.recent.slice(-20);
 working=false;persist();say(`ありがとう！それではみなさん、スタートです！第${state.gameIndex+1}ゲーム、${state.questionNumber}問目のお題は……${verbalQuestion(q)} さあ、挑戦してみよう！`);
}
async function nextGame(){
 state.gameIndex=(state.gameIndex+1)%games.length;state.questionNumber=0;state.phase="transition";persist();await showExample();
}
async function chatReply(message){
 working=true;status("💭 もこが考えているよ");
 let response="";
 try{
 const abort=new AbortController(),tid=setTimeout(()=>abort.abort(),13000);
 try{
 const r=await fetch("/api/partner",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({kind:"chat",mode:games[state.gameIndex].id,teamCount:state.names.length,message,history:[],recent:state.recent.slice(-4)}),signal:abort.signal});
 if(r.ok){const data=await r.json();response=data.reply||"";}
 }finally{clearTimeout(tid)}
 }catch{}
 working=false;
 say(response||"相談してくれてありがとう！ 「次のお題」「次のゲーム」「もっと簡単に」などと声をかけてね。");
}
async function interpret(raw){
 const msg=norm(raw);
 if(!msg)return;
 if(!state.started)return;
 if(working||speaking)return;
 statusText="✨ 聞き取れたよ：「"+raw.slice(0,36)+"」";render();
 if(isMatch(msg,["もう一度","繰り返して","聞こえなかった","もういっかい"])){say(lastSpeech);return}
 if(isMatch(msg,["順位","何点","得点教えて"])){say("ただいまの得点は、"+rank()+"です！");return}
 if(isMatch(msg,["例題を変えて","別の例題"])){await showExample("別の例題にして");return}
 if(isMatch(msg,["説明終わ","練習終わ","準備できた","実践終わ","説明できた","みんな分かった"])){await showQuestion();return}
 if(isMatch(msg,["次のゲーム","次の種目","種目変更"])){await nextGame();return}
 if(isMatch(msg,["次のお題","次の問題","もう一問","新しい問題"])){await showQuestion();return}
 if(isMatch(msg,["もっと簡単","やさしく","もっと難しく","難しく","もっと面白く","違うお題","別のお題"])){
  if(state.phase==="example")await showExample(raw);
  else await showQuestion(raw);
  return;
 }
 if(isMatch(msg,["新証拠","証拠を"])){if(state.question?.evidence)say("新しい証拠が出たよ！"+state.question.evidence);else say("今のお題には、追加の証拠はないよ。");return}
 if(addPoints(raw))return;
 if(state.phase==="example"&&isMatch(msg,["オッケー","OK","はい、できた","終わったよ"])){await showQuestion();return}
 await chatReply(raw);
}
async function begin(){
 if(state.started){showSetup=false;activated=true;listeningWanted=true;micDenied=false;render();say(`おかえりなさい！第${state.gameIndex+1}ゲームだよ。${state.phase==="example"?"説明が終わったら、説明終わったと教えてね。":"次のお題、と声をかけてね。"}`);return}
 const teamSelect=document.getElementById("teams");const staffInput=document.getElementById("staffName");
 const count=Math.max(2,Math.min(10,Number(teamSelect?.value||3)));
 state.names=Array.from({length:count},(_,i)=>"チーム"+(i+1));state.scores=Array(count).fill(0);
 state.staff=String(staffInput?.value||"スタッフ").trim().slice(0,14)||"スタッフ";
 state.started=true;state.phase="intro";state.gameIndex=0;state.questionNumber=0;state.recent=[];state.question=null;
 activated=true;listeningWanted=true;micDenied=false;showSetup=false;persist();render();
 await showExample();
}
function handle(action){
 switch(action){
 case "openSetup":showSetup=true;render();break;
 case "begin":void begin();break;
 case "dismiss":showSetup=false;render();break;
 case "scores":showType="scores";render();break;
 case "help":showType="help";render();break;
 case "close":showType="";render();break;
 case "text":textPanel=!textPanel;render();break;
 case "listen":activated=true;listeningWanted=true;micDenied=false;try{window.speechSynthesis?.cancel?.();}catch{}speaking=false;render();queueListen();break;
 case "newGame":if(window.confirm("現在の得点を消して、新しい大会を始めますか？")){const staff=state.staff;state=empty();state.staff=staff;activated=false;listeningWanted=false;stopListening();showType="";showSetup=true;persist();render()}break;
 }}
document.addEventListener("click",e=>{const b=e.target?.closest?.("[data-action]");if(b)handle(b.dataset.action)});
document.addEventListener("submit",e=>{if(e.target?.id==="textForm"){e.preventDefault();const t=document.getElementById("textLine")?.value||"";textPanel=false;render();void interpret(t)}});
if(state.started){avatarText=`おかえりなさい！「声で始める」を押したら、またお話しできるよ。`;statusText="🎙️ マイクを待っています";}
render();
})();