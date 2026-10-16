(function client(){
"use strict";
const MODES=[
{id:"sync",name:"ぴったりシンクロ",icon:"🧠"},
{id:"pitch",name:"へんてこ通販",icon:"🛍️"},
{id:"mime",name:"無言の大事件",icon:"🎭"},
{id:"court",name:"どうでも裁判所",icon:"⚖️"},
{id:"press",name:"珍・記者会見",icon:"🎤"},
{id:"choice",name:"究極の二択",icon:"💭"},
{id:"challenge",name:"ぴったり記録",icon:"🏆"}
];
const KEY="saiko-grand-prix-v4",OLD_KEY="saiko-grand-prix-studio-v3",HISTORY_KEY="saiko-recent-v4";
const root=document.getElementById("root"),audience=document.getElementById("audience"),news=document.getElementById("news");
const enc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const modeName=id=>MODES.find(m=>m.id===id)?.name||"わくわく対決";
const choose=a=>a[Math.floor(Math.random()*a.length)];
const mascot=()=>'<div class="mascot-box" aria-hidden="true"><span class="sparkle one">✦</span><div class="mascot"><i class="ear left"></i><i class="ear right"></i><i class="eye left"></i><i class="eye right"></i><i class="blush left"></i><i class="blush right"></i><i class="nose"></i><span class="bow">♥</span></div><span class="sparkle two">✧</span></div>';
const sources={sync:[
["もし一日だけ超能力が使えるなら？","空を飛ぶ","動物と話せる"],
["もし会社の社長になるなら、どんな会社？","お菓子の会社","旅行の会社"],
["一週間、同じものしか食べられないなら？","カレー","おにぎり"],
["無人島に一つだけ持って行けるなら？","大きな毛布","丈夫な鍋"],
["会議でひとつだけ使っていい便利な道具は？","何でも消せる消しゴム","話を短くするベル"]],
pitch:[
["輪ゴムを世界一高級な商品として売り込んでください。","輪ゴム","伝説・安心・未来"],
["ただの紙コップを豪華な発明品として紹介してください。","紙コップ","奇跡・世界・限定"],
["一本の鉛筆を大富豪向けの商品として宣伝してください。","鉛筆","宝物・秘密・最高"],
["目覚まし時計を宇宙一のヒット商品として売ってください。","目覚まし時計","伝説・革命・毎日"]],
mime:[
["カッパが初めて電車に乗って、切符の買い方に困っています。"],
["宇宙人がカレーを食べて、あまりのおいしさに驚いています。"],
["ペンギンが社長になり、長い会議を終わらせようとしています。"],
["忍者がスーパーで買い物をして、レジ袋を忘れています。"]],
court:[
["みんなの唐揚げに、許可なくレモンをかけた。これは有罪？","実はレモンが苦手な人がいたことが判明！"],
["会議中にひとりだけお菓子を食べた。これは有罪？","そのお菓子は全員に配るために用意していた！"],
["エレベーターの『閉』ボタンを何度も押した。これは有罪？","ボタンを押す前からドアは閉まり始めていた！"],
["最後のプリンを食べてしまった。これは有罪？","プリンには『ご自由にどうぞ』というメモが付いていた！"]],
press:[
["会社の社訓が『毎朝おにぎり』なのは本当ですか？"],
["社長が昨日、会議室で一人カラオケをしていたという噂は本当ですか？"],
["会社の新しい制服がパジャマになった理由を説明してください。"],
["あなたの会社が月に旅行する計画について説明してください。"]],
choice:[
["一日だけ手に入れられるなら？","空を自由に飛べる能力","どんな動物とも話せる能力"],
["どちらかのお店を経営するなら？","一日中行列ができるパン屋","世界中から注文が来る雑貨屋"],
["旅行に出かけるならどっち？","今すぐ出発する予定なしの旅","計画が完璧な半年後の旅"],
["みんなで楽しむならどっち？","世界一大きなボードゲーム","世界一小さな映画館"]],
challenge:[
["目を閉じて、ちょうど15秒経ったと思ったら手を挙げてください。","実際の15秒との差が小さいチームが勝ち。"],
["30秒で『ありがとう』を何回、はっきり言えるか挑戦してください。","聞き取れた回数が多いチームが勝ち。"],
["10秒間で、笑顔を保ったまま何回うなずけるか挑戦してください。","スタッフが数えた回数が多いチームが勝ち。"]]
};
function initial(){return{started:false,names:["チーム・いちご","チーム・みかん","チーム・メロン"],scores:[0,0,0],ledger:[],mode:"sync",draft:null,published:null,chat:[{who:"ai",text:"こんにちは、もこだよ！ 今日はどんな勝負にしたい？ まずは一緒に相談しよう♪"}],history:[],round:0,courtRound:0,evidence:false,ruled:false,volume:false,source:""};}
let s;try{
 const cur=JSON.parse(localStorage.getItem(KEY)||"null");
 if(cur){s={...initial(),...cur};}
 else {
  s=initial();
  const old=JSON.parse(localStorage.getItem(OLD_KEY)||"null");
  if(old?.started&&Array.isArray(old.names)&&old.names.length>=2&&old.names.length<=10){
   s.started=true;s.names=old.names.map(x=>String(x).slice(0,22));
   s.scores=old.scores.map(x=>Number(x)||0);s.mode=old.mode||"sync";
   s.courtRound=Number(old.courtRound)||0;
   s.published=old.item?.prompt?{...old.item}:null;
   s.round=Number(old.round)||0;s.history=old.history||[];
   s.chat=Array.isArray(old.chat)?old.chat.slice(-12):s.chat;
   s.ledger=Array.isArray(old.ledger)?old.ledger:s.ledger;
  }
 }
 if(s.names.length<2||s.names.length>10||s.names.length!==s.scores.length)s=initial();
}catch{s=initial();}
let recent=[];try{recent=JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]");if(!Array.isArray(recent))recent=[];}catch{}
let waiting=false,projecting=false,newsShowing=false,newsText="",installEvent=null,timerSeconds=60,timerLeft=60,timerRunning=false,timerEnd=0,seq=0,speech=null;
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(s));localStorage.setItem(HISTORY_KEY,JSON.stringify(recent.slice(-50)));}catch{}};
const btn=(label,action,style="")=>'<button class="button '+style+'" data-action="'+action+'"'+(waiting&&["chat","draft"].includes(action)?" disabled":"")+'>'+label+'</button>';
const speak=text=>{if(!s.volume||!window.speechSynthesis)return;try{window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="ja-JP";u.rate=.95;window.speechSynthesis.speak(u);}catch{}};
const log=(who,text)=>{s.chat.push({who,text:String(text).slice(0,460)});s.chat=s.chat.slice(-24);};
function makeFallback(mode,msg=""){
 const pick=()=>choose(sources[mode]||sources.sync);
 let raw;for(let attempt=0;attempt<30;attempt++){raw=pick();if(!recent.includes(raw[0]))break;}
 let prompt=raw[0],opts=[],evidence="",criterion="";
 if(mode==="sync"){opts=[raw[1],raw[2]];criterion="二人の答えが一致したら成功！";}
 if(mode==="pitch"){prompt=raw[0]+" 必須ワード：「"+raw[2].split("・").join("」「")+"」。";criterion="指定ワードを各1回言えたら1点。30秒以内に終えたら追加1点。";}
 if(mode==="mime")criterion="60秒以内に場面を正しく当てられたら成功。";
 if(mode==="court"){evidence=raw[1];criterion="検察側と弁護側の主張を聞き、裁判官役が判定。";}
 if(mode==="press")criterion="5秒以内に「はい」「いいえ」「わかりません」を使わず答えられたら成功。";
 if(mode==="choice"){opts=[raw[1],raw[2]];criterion="30秒以内に選んだ理由を伝えて、チームで競う。";}
 if(mode==="challenge")criterion=raw[1];
 if(/簡単|やさしく|短く/.test(msg)&&mode==="mime")prompt="猫が大きなくしゃみをして、びっくりしています。";
 return{mode,title:modeName(mode),prompt,options:opts,evidence,criterion};
}
function sanitizeDraft(d){
 const mode=MODES.some(x=>x.id===d?.mode)?d.mode:s.mode;
 return{mode,title:String(d?.title||modeName(mode)).slice(0,48),prompt:String(d?.prompt||"").slice(0,240),options:Array.isArray(d?.options)?d.options.slice(0,2).map(x=>String(x).slice(0,100)):[],evidence:String(d?.evidence||"").slice(0,150),criterion:String(d?.criterion||"").slice(0,160)};
}
async function converse(kind,message){
 if(waiting||!s.started)return;
 const msg=String(message||"").trim().slice(0,300);
 if(kind==="chat"&&!msg)return;
 const oldChat=s.chat.slice(-8);
 if(msg)log("host",msg);
 waiting=true;save();render();
 let result=null,error=false;
 try{
  const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),14000);
  try{
   const response=await fetch("/api/partner",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({kind,mode:s.mode,teamCount:s.names.length,message:msg,history:oldChat,draft:s.draft,recent:recent.slice(-5)}),signal:abort.signal});
   if(response.ok)result=await response.json();else error=true;
  }finally{clearTimeout(timer);}
 }catch{error=true;}
 waiting=false;
 if(result?.kind==="chat"&&result.reply){log("ai",result.reply);s.source="workers-ai";}
 else if(result?.kind==="draft"&&result.draft?.prompt){
  s.draft=sanitizeDraft(result.draft);s.source="workers-ai";
  log("ai",result.reply||"こんなお題を考えたよ！ 気になるところは直そう♪");
 }else if(kind==="draft"){
  s.draft=makeFallback(s.mode,msg);s.source="rules";
  log("ai","今はAIにつながらないので、ルールに沿ってお題案を用意したよ。言い回しを変えるなら、接続が戻ってから相談してね。");
 }else{log("ai","いまAIと通信できないみたい。少し後でまた話しかけてね。お題案だけなら右のボタンから作れるよ。");s.source="offline";}
 save();render();const area=document.getElementById("chatlog");if(area)area.scrollTop=area.scrollHeight;
 if(result?.reply&&s.volume)speak(result.reply);
}
function publish(){
 if(!s.draft?.prompt||!s.started)return;
 s.published={...s.draft};s.mode=s.published.mode;
 s.round++;s.history=[{...s.published,round:s.round},...s.history].slice(0,30);
 recent.push(s.published.prompt);recent=recent.slice(-50);
 s.draft=null;s.evidence=false;s.ruled=false;save();render();
}
function roles(){
 const r=s.ruled?Math.max(0,s.courtRound-1):s.courtRound,n=s.names.length;
 return[r%n,(r+1)%n,n>2?(r+2)%n:-1];
}
function verdict(which){
 if(!s.published||s.published.mode!=="court"||s.ruled)return;
 const [a,b,j]=roles(),winning=which==="pro"?a:b,losing=which==="pro"?b:a;
 const changes=[{i:winning,delta:3},{i:losing,delta:1}];if(j>=0)changes.push({i:j,delta:2});
 changes.forEach(x=>s.scores[x.i]+=x.delta);s.ledger.push({changes,title:"裁判 第"+(s.courtRound+1)+"回",court:true});
 s.courtRound++;s.ruled=true;save();render();
}
function addScore(i,pt){
 if(!Number.isInteger(i)||i<0||i>=s.scores.length||![1,3,5].includes(pt))return;
 s.scores[i]+=pt;s.ledger.push({changes:[{i,delta:pt}],title:s.published?.title||"通常競技",court:false});save();render();
}
function undo(){
 const x=s.ledger.pop();if(!x)return;
 x.changes.forEach(c=>{s.scores[c.i]=Math.max(0,s.scores[c.i]-c.delta)});
 if(x.court){s.courtRound=Math.max(0,s.courtRound-1);s.ruled=false;}
 save();render();
}
function reset(){
 if(!window.confirm("新しい大会を始めますか？\n現在の得点と出題履歴は消えます。"))return;
 const names=s.names.slice(),volume=s.volume;s=initial();s.names=names;s.scores=names.map(()=>0);s.volume=volume;
 recent=[];seq++;waiting=false;projecting=false;newsShowing=false;timerRunning=false;timerLeft=timerSeconds;save();render();
}
function count(n){if(s.started)return;n=Math.max(2,Math.min(10,Number(n)||3));s.names=Array.from({length:n},(_,i)=>s.names[i]||"チーム"+(i+1));s.scores=Array(n).fill(0);save();render();}
function begin(){if(s.started)return;s.started=true;s.scores=s.names.map(()=>0);s.ledger=[];s.courtRound=0;s.chat=initial().chat;s.published=null;s.draft=null;s.round=0;save();render();}
function modeSelect(id){if(waiting||!MODES.some(x=>x.id===id))return;s.mode=id;s.draft=null;log("ai","次は「"+modeName(id)+"」だね。どんな雰囲気のお題にする？ 気軽に相談してね♪");save();render();}
const options=q=>q?.options?.length===2?'<div class="prompt-opts">'+q.options.map((o,i)=>'<div class="prompt-opt"><b>'+("AB"[i])+'</b>'+enc(o)+'</div>').join("")+'</div>':"";
const draftPanel=()=>'<section class="panel lavender-panel"><div class="panel-head"><h2>✨ 相談中のお題案</h2><span class="status-tag orange">まだ非公開</span></div>'+
 (s.draft?'<div class="section-tag">'+enc(modeName(s.draft.mode))+'</div><div class="prompt-title">'+enc(s.draft.title)+'</div><div class="prompt-body">'+enc(s.draft.prompt)+'</div>'+options(s.draft)+(s.draft.criterion?'<p class="criterion">判定：'+enc(s.draft.criterion)+'</p>':"")+'<div class="actions" style="margin-top:12px">'+btn("📣 このお題で出題！","publish","primary big")+'</div>':
 '<div class="empty-state"><div class="symbol">💡</div><h3>どんなお題にしよう？</h3><p>「相談する」で内容を話し合ってから、「お題案を作る」を押してね。</p></div>')+'</section>';
const chatPanel=()=>'<section class="panel pink-panel"><div class="chat-heading"><div class="assistant-avatar" aria-hidden="true">🐰</div><div><h2 style="margin:0">もことお題相談</h2><p>司会スタッフだけの作戦会議♪</p></div></div><div id="chatlog" class="chatlog" aria-live="polite">'+s.chat.map(m=>'<div class="bubble '+(m.who==="host"?"host":"ai")+'">'+enc(m.text)+'</div>').join("")+'</div><div class="quick-row">'+["もっと笑える感じ！","簡単で参加しやすく","日常ネタにしたい","新証拠で逆転する裁判"].map((m,i)=>'<button class="chip" data-quick="'+i+'">'+enc(m)+'</button>').join("")+'</div><textarea class="chat-input" id="chatInput" maxlength="300" aria-label="AIへの相談内容" placeholder="例：宇宙ネタより、普段の生活で起こりそうな面白い裁判にして"></textarea><div class="actions" style="margin-top:9px">'+btn("🎙️ 話す","mic","tiny")+btn("💬 相談する","chat","violet")+btn(waiting?"考え中…":s.draft?"🪄 この案を直す":"✨ お題案を作る","draft","mint")+'</div><div class="source">'+(waiting?"🐰 もこが考え中…":s.source==="workers-ai"?"🐰 AIと会話中":s.source==="rules"?"🌼 AI不調のため、組み合わせ式の案を表示中":"相談中のお題は、出題を決めるまで観客には見せません。")+'</div></section>';
function publishedPanel(){
 let html='<section class="panel mint-panel"><div class="panel-head"><h2>🎉 いまの出題</h2><span class="status-tag green">観客に公開中</span></div>';
 if(!s.published)return html+'<div class="empty-state"><div class="symbol">🎈</div><h3>まだ出題していないよ</h3><p>スタッフが案を確定すると、ここに表示されます。</p></div></section>';
 const q=s.published;
 html+='<div class="section-tag">第'+s.round+'問 · '+enc(modeName(q.mode))+'</div><div class="prompt-title">'+enc(q.title)+'</div><div class="prompt-body">'+enc(q.prompt)+'</div>'+options(q);
 if(q.criterion)html+='<p class="criterion">判定：'+enc(q.criterion)+'</p>';
 if(q.mode==="court"){
  const [a,b,j]=roles();
  html+='<div class="court-roles"><div class="court-role"><small>⚔️ 検察</small><strong>'+enc(s.names[a])+'</strong></div><div class="court-role"><small>🛡️ 弁護</small><strong>'+enc(s.names[b])+'</strong></div><div class="court-role"><small>⚖️ 判定</small><strong>'+enc(j<0?"司会スタッフ":s.names[j])+'</strong></div></div>';
  html+='<div class="actions">'+btn(s.evidence?"証拠を隠す":"⚡ 新証拠を発表","evidence","violet")+'</div>';
  if(s.evidence)html+='<div class="evidence">📣 新証拠！<div>'+enc(q.evidence||"意外な事実が明らかになった！")+'</div></div>';
  if(!s.ruled)html+='<div class="actions" style="margin-top:10px">'+btn("検察の勝ち","pro","mint")+btn("弁護の勝ち","def","primary")+'</div>';
  else html+='<div class="guide-label">判決確定！ 次の事件に進めます。</div>';
 }
 return html+'</section>';
}
function scorePanel(){
 const max=Math.max(...s.scores),ranks=s.scores.map((v,i)=>({v,i})).sort((a,b)=>b.v-a.v||a.i-b.i);
 return '<section class="panel"><div class="panel-head"><h2>🏆 チーム対抗・得点</h2><span class="status-tag">'+s.names.length+'チーム</span></div><div class="score-grid">'+s.scores.map((v,i)=>'<div class="team-card '+(max>0&&v===max?"leader":"")+'"><input maxlength="22" data-name="'+i+'" aria-label="チーム名'+(i+1)+'" value="'+enc(s.names[i])+'"><strong>'+v+'</strong><small>POINTS</small>'+(s.published?.mode!=="court"?'<div class="add-row">'+[5,3,1].map(n=>'<button data-score="'+i+'" data-pt="'+n+'">+'+n+'</button>').join("")+'</div>':"")+'</div>').join("")+'</div><div class="actions" style="margin-top:13px">'+btn("↶ 最後の採点を戻す","undo","tiny")+'</div><div class="divider"></div><h2>🌟 いまの順位</h2><div class="ranks">'+ranks.map((r,k)=>'<div class="rank-row"><span>'+(["🥇","🥈","🥉"][k]||(k+1)+"位")+' '+enc(s.names[r.i])+'</span><strong>'+r.v+' pt</strong></div>').join("")+'</div></section>';
}
function timerPanel(){
 return '<section class="panel"><div class="panel-head"><h2>⏳ 対戦タイマー</h2><span class="status-tag">わくわくタイム</span></div><div class="timer-digits" id="timerDigits">01:00</div><div class="actions">'+btn("▶ スタート","timer","mint")+btn("↺ 戻す","timerReset")+'</div><div class="small-actions">'+[15,30,60,90,120].map(v=>'<button class="button tiny" data-seconds="'+v+'">'+v+'秒</button>').join("")+'</div></section>';
}
function renderAudience(){
 if(!projecting){audience.classList.remove("on");audience.innerHTML="";return;}
 const q=s.published;audience.classList.add("on");
 audience.innerHTML=btn("スタッフ画面へ戻る","project","tiny close")+'<div class="aud-label">🌸 サイ校ゲーム 🌸</div>'+
 (q?'<h2>'+enc(q.title)+'</h2><div class="aud-question">'+enc(q.prompt)+'</div>'+options(q)+(q.mode==="court"&&s.evidence?'<div class="evidence"><strong>⚡ 新証拠！</strong><div>'+enc(q.evidence)+'</div></div>':""):'<h2>もうすぐ始まるよ！</h2><div class="aud-question">わくわくして待っててね♪</div>')+
 '<div class="aud-score">'+s.names.map((n,i)=>'<span>'+enc(n)+'：'+s.scores[i]+'pt</span>').join("")+'</div>';
}
function renderNews(){news.classList.toggle("on",newsShowing);news.innerHTML=newsShowing?'<div class="news-card"><h2>📣 サイ校 緊急ニュース！</h2><p>'+enc(newsText)+'</p>'+btn("ニュースを閉じる","news","primary")+'</div>':"";}
function setupScreen(){
 return '<div class="app setup"><div class="panel pink-panel">'+mascot()+'<div class="section-tag">WELCOME TO SAIKO!</div><h1>🌸 サイ校ゲームへようこそ！</h1><p class="note">まずはチーム数を決めよう！ 今日も笑って、真剣勝負♪</p><label for="teamCount">何チームで遊ぶ？</label><select id="teamCount" aria-label="参加チーム数">'+Array.from({length:9},(_,i)=>i+2).map(n=>'<option value="'+n+'" '+(n===s.names.length?"selected":"")+'>'+n+'チーム</option>').join("")+'</select><div class="setup-names">'+s.names.map((n,i)=>'<div><label for="team'+i+'">チーム '+(i+1)+'</label><input id="team'+i+'" maxlength="22" data-name="'+i+'" value="'+enc(n)+'"></div>').join("")+'</div>'+btn("🎉 このチームでゲーム開始！","begin","primary big")+'</div></div>';
}
function render(){
 if(!s.started){root.innerHTML=setupScreen();renderAudience();renderNews();return;}
 root.innerHTML='<div class="app"><header class="head"><div class="brand"><div class="logo">🌸</div><div><small>SAIKO HAPPY GAME SHOW</small><strong>サイ校ゲーム</strong></div></div><div class="header-actions">'+btn("📺 観客画面","project","mint tiny")+btn("⚙️","settings","tiny")+'</div></header><div class="hero"><div><span class="float-tag">🌷 きょうも笑顔で、真剣勝負！</span><h1>どんなお題に<em>しようかな？</em></h1><p>人間のスタッフが司会役。AIと相談して、今日だけのお題を作ろう。</p></div>'+mascot()+'</div><div class="layout"><div class="left-stack"><section class="panel"><div class="panel-head"><h2>🎮 きょうのゲーム</h2><span class="status-tag">7種類</span></div><div class="modegrid">'+MODES.map(m=>'<button class="mode-btn '+(s.mode===m.id?"active":"")+'" data-mode="'+m.id+'"><span class="emoji">'+m.icon+'</span>'+m.name+'</button>').join("")+'</div></section>'+publishedPanel()+scorePanel()+'</div><div class="right-stack">'+chatPanel()+draftPanel()+timerPanel()+'<section class="panel"><div class="panel-head"><h2>🎊 お楽しみボタン</h2></div><div class="actions">'+btn("📣 緊急ニュース","news","violet")+btn(s.volume?"🔊 音声ON":"🔇 音声OFF","volume")+btn("📲 ホーム画面に追加","install","tiny")+'</div><div class="divider"></div><div class="actions">'+btn("🆕 新しい大会","reset","danger tiny")+'</div><p class="note">チーム名・得点・相談履歴は、このブラウザに保存されます。個人情報はAIに入力しないでください。</p></section></div></div><div class="footer">サイ校プロジェクト岩国 · 企画はスタッフ × AI · 出題するのはスタッフの判断で</div></div>';
 renderAudience();renderNews();tick();
}
function tick(){if(timerRunning){timerLeft=Math.max(0,Math.ceil((timerEnd-Date.now())/1000));if(timerLeft===0){timerRunning=false;}}
 const el=document.getElementById("timerDigits");if(el){el.textContent=String(Math.floor(timerLeft/60)).padStart(2,"0")+":"+String(timerLeft%60).padStart(2,"0");el.classList.toggle("urgent",timerLeft<=10);}
}
function setTimer(n){timerSeconds=n;timerLeft=n;timerRunning=false;tick();}
function handle(action){
 switch(action){
 case "begin":begin();break;case "project":projecting=!projecting;renderAudience();break;
 case "chat":{const input=document.getElementById("chatInput");converse("chat",input?.value||"");break;}
 case "draft":{const input=document.getElementById("chatInput");converse("draft",input?.value||"");break;}
 case "publish":publish();break;
 case "mic":microphone();break;
 case "evidence":s.evidence=!s.evidence;save();render();break;
 case "pro":verdict("pro");break;case "def":verdict("def");break;
 case "undo":undo();break;case "reset":reset();break;
 case "timer":if(timerRunning){timerLeft=Math.ceil((timerEnd-Date.now())/1000);timerRunning=false;}else{if(timerLeft===0)timerLeft=timerSeconds;timerRunning=true;timerEnd=Date.now()+timerLeft*1000;}tick();break;
 case "timerReset":setTimer(timerSeconds);break;
 case "settings":document.querySelector(".right-stack .panel:last-child")?.scrollIntoView({behavior:"smooth"});break;
 case "news":newsShowing=!newsShowing;if(newsShowing)newsText=choose(["まさかの大接戦！ 優勝の行方はまだ分かりません！","世界大会なのに、審査員は全員サイ校のスタッフでした！","本日の優勝賞金は、大きな拍手と名誉です！","この勝負、世界中のカッパも注目しているそうです！"]);renderNews();break;
 case "volume":s.volume=!s.volume;save();render();break;
 case "install":install();break;
 }}
function microphone(){
 const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Speech){alert("このブラウザでは音声入力が使えません。文字で話しかけてね。");return;}
 try{if(speech){speech.stop();speech=null;return;}const rec=new Speech();speech=rec;rec.lang="ja-JP";rec.interimResults=false;
 rec.onresult=e=>{const t=e.results?.[0]?.[0]?.transcript||"";const el=document.getElementById("chatInput");if(el)el.value=t;};
 rec.onend=()=>{speech=null;};rec.start();}catch{speech=null;alert("音声入力を開始できませんでした。");}
}
async function install(){if(installEvent){installEvent.prompt();await installEvent.userChoice;installEvent=null;}else alert("ブラウザのメニューから「ホーム画面に追加」または「アプリをインストール」を選んでください。");}
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installEvent=e;});
document.addEventListener("click",e=>{
 const b=e.target.closest("button");if(!b||b.disabled)return;
 if(b.dataset.mode){modeSelect(b.dataset.mode);return;}
 if(b.dataset.score!==undefined){addScore(Number(b.dataset.score),Number(b.dataset.pt));return;}
 if(b.dataset.seconds!==undefined){setTimer(Number(b.dataset.seconds));return;}
 if(b.dataset.quick!==undefined){const t=["もっと笑える感じにしたい！","初めての人も参加しやすい内容にしたい。","日常生活のあるあるネタにしたい。","証拠が出て逆転する、どうでもいい裁判にしたい。"][Number(b.dataset.quick)];const el=document.getElementById("chatInput");if(el){el.value=t;el.focus();}return;}
 if(b.dataset.action)handle(b.dataset.action);
});
document.addEventListener("change",e=>{
 if(e.target.id==="teamCount"){count(e.target.value);return;}
 if(e.target.dataset?.name!==undefined){const i=Number(e.target.dataset.name);if(i>=0&&i<s.names.length){s.names[i]=e.target.value.trim().slice(0,22)||"チーム"+(i+1);save();render();}}
});
document.addEventListener("keydown",e=>{if(e.target?.id==="chatInput"&&e.key==="Enter"&&(e.ctrlKey||e.metaKey)){e.preventDefault();handle("chat");}if(e.key==="Escape"&&projecting){projecting=false;renderAudience();}});
setInterval(tick,200);save();render();
})();
