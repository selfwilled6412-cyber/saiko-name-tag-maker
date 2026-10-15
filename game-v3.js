(function client(){
"use strict";
const MODES=[
 {id:"sync",name:"脳みそシンクロ",icon:"🧠",rule:"チームの2人が相談せず選ぶ。選択がそろえば成功。"},
 {id:"pitch",name:"インチキ通販王",icon:"🛍️",rule:"架空の商品を30秒で売り込み、指定ワードの使用数で競う。"},
 {id:"mime",name:"ジェスチャー通訳",icon:"🎭",rule:"声を使わず、お題を身ぶりや絵で仲間に伝える。"},
 {id:"court",name:"どうでも裁判所",icon:"⚖️",rule:"検察と弁護が争い、裁判官チームが判決を出す。"},
 {id:"press",name:"謎の謝罪会見",icon:"🎤",rule:"5秒で返答。「はい」「いいえ」「わかりません」は禁止！"},
 {id:"choice",name:"究極の二択",icon:"🔀",rule:"正解のない二択。チームの理由を競う。"},
 {id:"challenge",name:"珍記録チャレンジ",icon:"🏅",rule:"声・手・想像力だけで世界一どうでもいい記録を狙う。"}
];
const KEY="saiko-grand-prix-studio-v3", HISTORY_KEY="saiko-grand-prix-recent-v3";
const root=document.getElementById("root"), audience=document.getElementById("audience"), news=document.getElementById("news");
const modeName=id=>MODES.find(x=>x.id===id)?.name||"おバカ競技";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const sample=a=>a[Math.floor(Math.random()*a.length)];
const pools={
 people:["カッパ社長","宇宙飛行士","寝坊した王様","有名になりたいタヌキ","未来の自分","ロボット新人","恐竜の部長","変装した忍者","おしゃべりな冷蔵庫","おにぎり博士","謎の校長","流れ星の営業マン","巨大なハムスター","時間旅行者","世界一慎重な海賊"],
 items:["輪ゴム","消しゴム","片方の靴下","空の紙コップ","冷えた枕","透明な傘","普通の石","折れた鉛筆","新品の段ボール","古いリモコン","タオル","あくび","どんぐり","しゃもじ","歯ブラシ","ぬいぐるみ"],
 places:["月面コンビニ","無人島","謎の会議室","宇宙ステーション","地下100階の喫茶店","恐竜専用の銭湯","未来の食堂","空飛ぶデパート","海底ホテル","朝6時の会議","学校の屋上","世界一静かなライブ会場"],
 moves:["ラップで自己紹介している","店員と値切り交渉している","地球の救世主として表彰される","踊りながら道に迷っている","ものすごく丁寧に謝っている","一人で記者会見している","なぜか校歌を歌っている","レジの前で大失敗している","巨大な秘密を発表している","王様に敬語の使い方を教えている"],
 twists:["突然、観客が全員ペンギンになった","なぜか予算が83円しかない","実はきのうからずっと夢の中だった","最後のひと言だけ必ず関西弁になる","審査員が未来からやってきた","ニュース速報で事情が逆転した","残り時間があと7秒になった","世界中がそれを中継している"],
 actions:["カレーに勝手に砂糖を入れる","最後の一口だけを残す","誰にも言わずにエアコンを1℃上げる","エレベーターの閉ボタンを7回押す","目玉焼きに意外な調味料をかける","会社の備品に勝手に名前をつける","全員の唐揚げにレモンをかける","会議中にお菓子の袋を開ける","靴下を左右違う柄にする","おにぎりの具を秘密にする","ご飯の前にデザートを食べる","朝のあいさつに効果音をつける"],
 evidence:["防犯カメラには、犯人より先にタヌキが映っていた！","目撃者は実はその行動を3回も真似していた！","被告本人は事件の瞬間、全く別のことを考えていた！","その日だけ特別ルールが貼ってあったことが判明！","新たな証人が『むしろ助かりました』と発言！","事件の原因は、誰かが作った謎の張り紙だった！","なんと被告の持ち物に同じ物があと12個あった！","判決直前、匿名の投書が届き全員が困惑！"],
 claims:["地球の未来を救う","寝坊をなかったことにする","全人類の会議を10秒で終わらせる","何もしなくても人気者になれる","世界のどこでもVIP待遇になる","宇宙人が欲しがる"],
 questions:["あなたが新社長だと名乗った理由は何ですか？","会社の利益がすべてどんぐりだったのはなぜですか？","広報資料に宇宙人の写真しかないのはなぜですか？","なぜ大事な会議を月面コンビニで開催したのですか？","大臣に紙コップを贈ったのはどういう意図ですか？","職場の合言葉が『おにぎり！』なのは事実ですか？"],
 virtues:["時間を3時間だけ止める","動物と1時間しゃべれる","空を30秒だけ飛べる","毎朝好きなBGMで目覚める","一日だけ世界一の料理人になる","透明人間に10分なる","いつでも快適な室温にできる"],
 costs:["靴下が一生片方だけになる","笑うたびに効果音が出る","毎日同じ昼食になる","くしゃみがニュース速報になる","名字が一日だけ『おにぎり』になる","すべての会話が敬語になる"]
};
function first(){return{names:["チーム・バナナ","チーム・パンダ","チーム・カッパ"],scores:[0,0,0],started:false,ledger:[],round:0,courtRound:0,mode:"sync",item:null,history:[],chat:[{who:"ai",text:"こんにちは！種目を選んで、スタッフから相談してね。「もっと難しく」「今度は裁判」でも大丈夫。毎回新しいお題を考えるよ！"}],volume:false,source:"",evidence:false,ruled:false};}
let s;try{const saved=JSON.parse(localStorage.getItem(KEY)||"null");s={...first(),...(saved||{})};if(saved&&!Object.prototype.hasOwnProperty.call(saved,"started"))s.started=true;if(!Array.isArray(s.names)||s.names.length<2||s.names.length>10||!Array.isArray(s.scores)||s.scores.length!==s.names.length)s=first();if(!Array.isArray(s.ledger))s.ledger=[];}catch{s=first();}
try{if(!s.item){const old=JSON.parse(localStorage.getItem("saiko-world-cup-v2")||"null");if(old?.names?.length===3)s.names=old.names.map(x=>String(x).slice(0,22));}}catch{}
let recent=[];try{recent=JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]");if(!Array.isArray(recent))recent=[];}catch{}
let busy=false,voiceRec=null,voiceActive=false,timerDuration=60,timerRemaining=60,timerRunning=false,timerDeadline=0,installEvent=null,projecting=false,newsVisible=false,newsText="",requestSeq=0;
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(s));localStorage.setItem(HISTORY_KEY,JSON.stringify(recent.slice(-80)));}catch{}};
const respond=(text,who="ai")=>{s.chat.push({who,text:String(text).slice(0,300)});s.chat=s.chat.slice(-16);};
const beeps=()=>{if(!s.volume)return;try{const cx=new(window.AudioContext||window.webkitAudioContext)();const o=cx.createOscillator(),g=cx.createGain();o.type="triangle";o.frequency.value=660;g.gain.value=.025;o.connect(g);g.connect(cx.destination);o.start();o.stop(cx.currentTime+.13);setTimeout(()=>cx.close(),400)}catch{}};
function detectMode(message,base){
 if(/裁判|有罪|無罪|弁護/.test(message))return "court";
 if(/通販|売り込|販売|CM|宣伝/.test(message))return "pitch";
 if(/ジェスチャー|動作|パントマイム|伝言/.test(message))return "mime";
 if(/謝罪|記者会見|記者/.test(message))return "press";
 if(/二択|選択|どっち/.test(message))return "choice";
 if(/記録|チャレンジ|タイム/.test(message))return "challenge";
 if(/シンクロ|一致|おそろい/.test(message))return "sync";
 return base;
}
function makeLocal(mode,message=""){
 const difficult=/難しく|難問|ややこし|鬼|カオス/.test(message),easy=/簡単|やさしく|短く|シンプル/.test(message);
 const person=sample(pools.people),item=sample(pools.items),place=sample(pools.places),action=sample(pools.moves);
 const twist=sample(pools.twists),object2=sample(pools.items),word=sample(pools.people);
 let out={mode,title:"",prompt:"",options:[],evidence:"",criterion:""};
 if(mode==="sync"){out.title="異世界シンクロ選択";out.prompt=person+"が"+place+"に到着！最初に必要なのはどっち？"+(difficult?" 理由も一言で！":"");out.options=[item,object2===item?sample(pools.virtues):object2];out.criterion="2人が同じ方を選んだら成功。";}
 if(mode==="pitch"){const words=[sample(pools.places).split("の")[0],sample(pools.items),sample(["奇跡","秘密","未来","無料","伝説"])];out.title="世界一怪しい通販番組";out.prompt=item+"を『"+sample(pools.claims)+"』夢の商品として30秒で売って！ 必須ワード：「"+words.join("」「")+"」"+(difficult?"。最後はダジャレで締めて！":"");out.criterion="必須ワード1つにつき1点、30秒以内なら追加1点。";}
 if(mode==="mime"){out.title="通じるわけないジェスチャー";out.prompt=person+"が"+place+"で"+action+"。言葉なしで伝えて！"+(difficult?" 最後に意味不明な決めポーズも！":"");out.criterion="60秒以内に、主役・場所・行動のうち伝わった要素の数で競う。";}
 if(mode==="court"){const violation=sample(pools.actions);out.title="事件："+sample(["史上最悪","全国騒然","前代未聞","宇宙規模","史上初","衝撃の"])+"事件";out.prompt="「"+violation+"」行為は有罪か？";out.evidence=sample(pools.evidence)+(difficult?" しかもそれを知るのは被告だけ！":"");out.criterion="検察と弁護が主張。裁判官チームが勝訴側を判決。";}
 if(mode==="press"){out.title="前代未聞の謝罪会見";out.prompt=sample(pools.questions)+(difficult?" ただし動物の鳴きまねを1回入れること。":"");out.criterion="5秒以内に返答し、禁止語「はい」「いいえ」「わかりません」を使わなければ成功。";}
 if(mode==="choice"){out.title="究極すぎる二択";out.prompt=person+"からの怪しい取引。選ぶならどっち？"+(difficult?" 理由に『地球』という言葉を入れて！":"");out.options=[sample(pools.virtues)+"ができるが、"+sample(pools.costs),sample(pools.claims)+"が、"+sample(pools.costs)];out.criterion="制限30秒で選択理由を述べ、チームごとに勝負。";}
 if(mode==="challenge"){const seconds=sample([7,11,13,17,23,29]);const what=sample(["目をつむって体内時計だけで","声に出さず心の中で","机を指でトントンしながら","手を頭の上に置いて","全員が静かになってから"]);out.title="誰得・体内時計の極み";out.prompt=what+seconds+"秒ぴったりを当てろ！"+(difficult?" 誤差1秒以内が世界記録！":"");out.criterion="ストップウォッチで計測し、指定秒数との誤差が最小のチームが勝ち。";}
 if(easy)out.prompt=out.prompt.replace(/ ただし.+/,"").slice(0,110);
 return out;
}
function offline(mode,message){
 let item;for(let i=0;i<30;i++){item=makeLocal(mode,message);if(!recent.includes(item.prompt))break;}
 return item;
}
function storeItem(item,provider){
 const mode=MODES.some(m=>m.id===item.mode)?item.mode:s.mode;
 const safe={mode,title:String(item.title||modeName(mode)).slice(0,48),prompt:String(item.prompt||"").slice(0,180),options:Array.isArray(item.options)?item.options.slice(0,2).map(x=>String(x).slice(0,90)):[],criterion:String(item.criterion||"").slice(0,140),evidence:String(item.evidence||"").slice(0,150)};
 if(!safe.prompt)return false;
 s.item=safe;s.mode=mode;s.source=provider;s.evidence=false;s.ruled=false;s.round++;s.history.unshift({...safe,round:s.round});s.history=s.history.slice(0,25);
 recent.push(safe.prompt);recent=recent.slice(-80);save();render();beeps();return true;
}
async function generate(message="次のお題を考えて"){
 if(busy)return;
 const seq=++requestSeq;
 s.mode=detectMode(message,s.mode);
 respond(message,"host");busy=true;save();render();
 let result=null,reply="",provider="rules";
 try{
  const ac=new AbortController(),to=setTimeout(()=>ac.abort(),10500);
  try{
   const res=await fetch("/api/director",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode:s.mode,message,recent:recent.slice(-5)}),signal:ac.signal});
   if(res.ok){const data=await res.json();if(data?.item?.prompt){result=data.item;provider="workers-ai";reply=String(data.reply||"新しいお題ができた！");}}
  }finally{clearTimeout(to)}
 }catch{}
 if(seq!==requestSeq)return;
 if(!result){result=offline(s.mode,message);reply="OK！今回はこのお題で勝負しよう！";provider="rules";}
 busy=false;respond(reply);
 if(!storeItem(result,provider)){result=offline(s.mode,message);storeItem(result,"rules");}
 const log=document.getElementById("chatlog");if(log)log.scrollTop=log.scrollHeight;
 if(s.volume&&window.speechSynthesis&&/音声|しゃべって|声で/.test(message)){window.speechSynthesis.cancel();let utterance=new SpeechSynthesisUtterance(reply);utterance.lang="ja-JP";window.speechSynthesis.speak(utterance);}
}
function score(i,pt,reason){if(!s.started||!Number.isInteger(i)||i<0||i>=s.names.length||![1,3,5].includes(pt))return;const name=s.names[i];s.scores[i]=Math.max(0,s.scores[i]+pt);s.ledger.push({changes:[{i,delta:pt}],title:reason||s.item?.title||"得点",at:Date.now()});s.ledger=s.ledger.slice(-120);save();render();beeps()}
function verdict(side){
 if(!s.started||!s.item||s.item.mode!=="court"||s.ruled)return;
 const [i,j,k]=roles(),w=side==="pro"?i:j,l=side==="pro"?j:i;
 const changes=[{i:w,delta:3},{i:l,delta:1}];
 if(k>=0)changes.push({i:k,delta:2});
 changes.forEach(v=>s.scores[v.i]+=v.delta);
 s.ledger.push({changes,title:"第"+(s.courtRound+1)+"回裁判",at:Date.now()});s.courtRound++;s.ruled=true;save();render();beeps();
}
function undo(){
 if(!s.ledger.length)return;
 const last=s.ledger.pop();for(const c of last.changes)s.scores[c.i]=Math.max(0,s.scores[c.i]-c.delta);
 if(last.title.startsWith("第")&&last.title.endsWith("回裁判")){s.courtRound=Math.max(0,s.courtRound-1);s.ruled=false;}
 save();render();
}
function reset(){
 if(!window.confirm("新しい大会を始める？\n得点と勝負履歴を消して、チーム数選択画面に戻ります。"))return;
 const names=s.names.slice();s=first();s.names=names;s.scores=Array(names.length).fill(0);recent=[];requestSeq++;busy=false;newsVisible=false;projecting=false;timerRunning=false;timerRemaining=timerDuration;save();render();
}
function setTeamCount(count){
 if(s.started)return;
 const size=Math.max(2,Math.min(10,Number(count)||3));
 s.names=Array.from({length:size},(_,i)=>s.names[i]||"チーム"+(i+1));
 s.scores=Array(size).fill(0);
 save();render();
}
function beginGame(){
 if(s.started)return;
 s.started=true;s.scores=Array(s.names.length).fill(0);
 s.ledger=[];s.courtRound=0;s.ruled=false;s.item=null;s.round=0;s.history=[];s.chat=first().chat;
 s.evidence=false;recent=[];save();render();generate("新しい大会の最初のお題を作って！");
}
function tick(){
 if(timerRunning){timerRemaining=Math.max(0,Math.ceil((timerDeadline-Date.now())/1000));if(!timerRemaining){timerRunning=false;beeps();} }
 const d=document.getElementById("timerDigits");if(d){d.textContent=String(Math.floor(timerRemaining/60)).padStart(2,"0")+":"+String(timerRemaining%60).padStart(2,"0");d.classList.toggle("urgent",timerRemaining<=10);}
 const b=document.getElementById("timerPlay");if(b)b.textContent=timerRunning?"⏸ 一時停止":"▶ スタート";
}
function setTimer(seconds){timerDuration=seconds;timerRemaining=seconds;timerRunning=false;render();}
function timerToggle(){if(timerRunning){timerRemaining=Math.max(0,Math.ceil((timerDeadline-Date.now())/1000));timerRunning=false;}else{if(timerRemaining<=0)timerRemaining=timerDuration;timerDeadline=Date.now()+timerRemaining*1000;timerRunning=true;}tick();}
const btn=(text,act,cls="")=>'<button class="button '+cls+'" data-action="'+act+'">'+text+"</button>";
function scoresMarkup(){return s.scores.map((p,i)=>'<div class="scorecard '+(p===Math.max(...s.scores)&&s.scores.some(v=>v>0)?"leader":"")+'"><input aria-label="チーム名'+(i+1)+'" maxlength="22" data-name="'+i+'" value="'+esc(s.names[i])+'"><strong>'+p+'</strong><small>POINTS</small>'+(s.item?.mode==="court"?"":'<div class="awardrow">'+[5,3,1].map(n=>'<button class="award" data-score="'+i+'" data-pt="'+n+'">+'+n+'</button>').join("")+'</div>')+'</div>').join("");}
function roles(){const n=s.names.length;const round=s.ruled?Math.max(0,s.courtRound-1):s.courtRound;return [round%n,(round+1)%n,n>2?(round+2)%n:-1];}
function setupMarkup(){return '<div class="app setup-page"><header class="top"><div class="brand"><div class="brandmark">祭</div><div><small>SAIKO / WORLD GRAND PRIX</small><strong>サイ校・おバカ世界選手権</strong></div></div></header><section class="panel setup-card"><span class="kicker">NEW GAME / TEAM SETUP</span><h1>何チームで勝負する？</h1><p class="fine">2〜10チームから選択。チーム名も自由に変更できます。</p><label for="teamCount" class="count-label">参加チーム数</label><select id="teamCount" aria-label="参加チーム数">'+Array.from({length:9},(_,i)=>i+2).map(n=>'<option value="'+n+'" '+(n===s.names.length?'selected':'')+'>'+n+'チーム</option>').join("")+'</select><div class="setup-names">'+s.names.map((n,i)=>'<label class="setup-name"><span>チーム '+(i+1)+'</span><input maxlength="22" data-name="'+i+'" aria-label="チーム'+(i+1)+'の名前" value="'+esc(n)+'"></label>').join("")+'</div>'+btn("🏁 このチーム数でゲーム開始","begin","primary setup-start")+'</section></div>';}
function promptMarkup(){
 const item=s.item;
 if(!item)return '<div class="gameframe"><span class="kicker">READY TO PLAY</span><div class="gametitle">今日は何で勝負する？</div><p>競技を選んだら「お題を生成」を押してね！</p></div>';
 let special="";
 if(item.mode==="court"){
  const [pro,def,judge]=roles();
  special='<div class="courtroles"><div class="courtrole"><small>⚔️ 検察</small><strong>'+esc(s.names[pro])+'</strong></div><div class="courtrole"><small>🛡️ 弁護</small><strong>'+esc(s.names[def])+'</strong></div><div class="courtrole"><small>⚖️ 判定役</small><strong>'+esc(judge<0?"司会スタッフ":s.names[judge])+'</strong></div></div>'+(s.names.length>3?'<div class="fine">その他のチームは陪審員として予想・投票に参加できます。</div>':"")<div class="actions">'+btn("⚡ 新証拠を発表","evidence","secondary")+'</div>'+(s.evidence?'<div class="evidence"><strong>🚨 新証拠！</strong><div>'+esc(item.evidence||"新たな目撃者が現れた！")+'</div></div>':"")+(s.ruled?'<div class="criterion">✅ 判決済み！次の事件を作ろう。</div>':'<div class="actions">'+btn("検察側の勝ち","verdictPro","primary")+btn("弁護側の勝ち","verdictDef","secondary")+'</div>');
 }
 return '<div class="gameframe"><span class="kicker">ROUND '+s.round+' / '+(s.source==="workers-ai"?"AI LIVE GENERATED":"FRESH GAME")+'</span><div class="gametitle">'+esc(item.title)+'</div><div class="gameprompt">'+esc(item.prompt)+'</div>'+(item.options?.length===2?'<div class="options">'+item.options.map((o,i)=>'<div class="option"><b>'+("AB"[i])+'</b>'+esc(o)+'</div>').join("")+'</div>':"")+(item.mode!=="court"&&item.criterion?'<div class="criterion">判定ルール：'+esc(item.criterion)+'</div>':"")+special+'</div>';
}
function staffChat(){return '<section class="panel chatpanel"><h2>🤖 ゲームAIと相談</h2><div class="chatlog" id="chatlog">'+s.chat.map(x=>'<div class="bubble '+(x.who==="host"?"host":"ai")+'">'+esc(x.text)+'</div>').join("")+'</div><div class="quickrow">'+["もっと難しく！","もっと笑えるの！","やさしめに","今度は裁判！"].map((x,i)=>'<button class="quick" data-quick="'+i+'">'+esc(x)+'</button>').join("")+'</div><textarea id="chatInput" class="chatinput" maxlength="250" aria-label="スタッフからゲームAIへのメッセージ" placeholder="例：次は3人が大笑いする二択にして！"></textarea><div class="chatbottom">'+btn("🎙️ 話しかける","mic","outline")+btn(busy?"生成中…":"✨ 相談してお題を作る","chatSend","primary")+'</div><div class="connection">'+(busy?"AIに相談しています…":s.source==="workers-ai"?"🟢 Cloudflare AIが生成":s.source==="rules"?"🟡 端末内のルール生成モード":"AIに相談すると、その場でお題を生成")+'</div></section>'}
function newsGenerator(){const headlines=["世界大会の審査員、あまりの熱戦にお茶をこぼす！","世界中のカッパがこの勝負を注視！","勝負はまだまだ大逆転の予感！","今大会の名誉は歴史に残る可能性あり！","現在の世界王者、緊急インタビューを拒否！","正体不明の国際連盟が追加で拍手を要求！"];return sample(headlines)+" "+sample(["ただし優勝賞金は拍手のみ。","関係者は真顔で対応。","現場はなぜか大盛り上がり。"]);}
function renderAudience(){
 if(!projecting){audience.classList.remove("on");audience.innerHTML="";return;}
 const q=s.item||{};audience.classList.add("on");
 audience.innerHTML='<button class="button close" data-action="project">✕ スタッフ画面に戻る</button><div class="label">SAIKO WORLD GRAND PRIX · '+esc(modeName(q.mode||s.mode))+'</div><h2>'+esc(q.title||"勝負開始！")+'</h2><div class="question">'+esc(q.prompt||"競技を選んでね！")+'</div>'+(q.options?.length===2?'<div class="options">'+q.options.map((v,i)=>'<div class="option"><b>'+("AB"[i])+'</b>'+esc(v)+'</div>').join("")+'</div>':"")+(s.item?.mode==="court"&&s.evidence?'<div class="evidence" style="font-size:clamp(18px,3.5vw,38px);margin-top:20px;max-width:950px;text-align:center"><strong>⚡ 新証拠！</strong><div>'+esc(s.item.evidence||'新たな証拠が見つかった！')+'</div></div>':"")+'<div class="scores">'+s.names.map((n,i)=>'<span>'+esc(n)+'：'+s.scores[i]+'pt</span>').join("")+'</div>';
}
function renderNews(){news.classList.toggle("on",newsVisible);news.innerHTML=newsVisible?'<div class="newscard"><h2>🚨 SAIKO BREAKING NEWS</h2><p>'+esc(newsText)+'</p>'+btn("ニュースを閉じる","news","primary")+'</div>':"";}
function render(){
 if(!s.started){root.innerHTML=setupMarkup();renderAudience();renderNews();return;}
 const sorted=s.scores.map((v,i)=>({v,i})).sort((a,b)=>b.v-a.v||a.i-b.i);
 const history=s.history.slice(0,4);
 root.innerHTML='<div class="app"><header class="top"><div class="brand"><div class="brandmark">祭</div><div><small>SAIKO / NEVER THE SAME GAME</small><strong>サイ校・おバカ世界選手権</strong></div></div><div class="topactions">'+btn("📺 観客画面","project","primary small")+btn("⋯","menu","small")+'</div></header><div class="headline"><div class="eyebrow">GAME SHOW / REAL-TIME CREATOR</div><h1>くだらない。でも、<span>本気。</span></h1><p>スタッフとゲームAIで、その瞬間だけの勝負を生み出そう。</p></div><div class="main"><div class="column"><section class="panel"><h2>🎮 競技を選ぶ</h2><div class="modegrid">'+MODES.map(x=>'<button class="modebtn '+(s.mode===x.id?"active":"")+'" data-mode="'+x.id+'"><span class="emoji">'+x.icon+'</span>'+x.name+'</button>').join("")+'</div></section><section class="panel"><div class="stagebar" style="justify-content:space-between;margin-bottom:14px"><div><div class="kicker">NOW PLAYING</div><h2 style="margin:6px 0 0">'+esc(modeName(s.mode))+'</h2></div>'+btn(busy?"生成中…":"⚡ 新しいお題！","newPrompt","primary")+'</div>'+promptMarkup()+'<div class="segment"></div><div class="actions">'+btn("📺 大画面に出す","project","secondary")+btn("🚨 緊急ニュース","news","outline")+'</div></section><section class="panel"><div class="stagebar" style="justify-content:space-between"><h2>🏆 チーム得点</h2><span class="kicker">LIVE RANKING</span></div><div class="scorecards">'+scoresMarkup()+'</div><div class="actions" style="margin-top:14px">'+btn("↶ 最後の採点を戻す","undo","small outline")+'</div></section></div><div class="column">'+staffChat()+'<section class="panel"><h2>⏱️ タイマー</h2><div class="timer" id="timerDigits">01:00</div><div class="actions">'+btn("▶ スタート","timer","primary")+btn("↻ 戻す","timerReset","outline")+'</div><div class="chips" style="margin-top:11px">'+[30,60,90,120].map(t=>'<button class="button small '+(timerDuration===t?"secondary":"outline")+'" data-time="'+t+'">'+t+'秒</button>').join("")+'</div></section><section class="panel"><div class="stagebar" style="justify-content:space-between"><h2>📊 現在の順位</h2><span class="kicker">'+s.ledger.length+' RESULTS</span></div><div class="history">'+sorted.map((x,i)=>'<div class="historyrow"><b>'+(["🥇","🥈","🥉"][i]||(i+1)+"位")+' '+esc(s.names[x.i])+'</b><b>'+x.v+' pt</b></div>').join("")+'</div>'+(history.length?'<div class="segment"></div><div class="kicker">最近のゲーム</div><div class="history">'+history.map(x=>'<div class="historyrow">'+esc(x.title)+' <small>#'+x.round+'</small></div>').join("")+'</div>':"")+'</section><section class="panel" id="optionsMenu"><h2>⚙️ 大会設定 · '+s.names.length+'チーム</h2><div class="actions">'+btn(s.volume?"🔊 音声ON":"🔇 音声OFF","volume","small")+btn("📲 ホーム画面に追加","install","small")+btn("🆕 新大会","reset","danger small")+'</div><div class="fine" style="margin-top:12px">得点と生成済みのお題は、この端末に自動保存。スタッフの入力内容はAI生成時にCloudflareへ送信されます。個人情報は入力しないでね。</div></section></div></div><div class="footer">© サイ校プロジェクト岩国 · お題は毎回生成 · 司会はスタッフ · 有料課金なしの構成</div></div>';
 tick();renderAudience();renderNews();
}
function sendChat(){const el=document.getElementById("chatInput");const text=el?.value?.trim();if(text)generate(text);}
function mic(){
 const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Speech){alert("このブラウザは音声入力に対応していません。文字入力を使ってください。");return;}
 if(voiceActive&&voiceRec){voiceRec.stop();return;}
 const rec=new Speech();voiceRec=rec;rec.lang="ja-JP";rec.interimResults=false;rec.maxAlternatives=1;voiceActive=true;
 rec.onresult=e=>{const txt=e.results?.[0]?.[0]?.transcript;if(txt){const inp=document.getElementById("chatInput");if(inp){inp.value=txt;sendChat();}}};
 rec.onerror=()=>{voiceActive=false;};
 rec.onend=()=>{voiceActive=false;};
 rec.start();
}
async function install(){
 if(installEvent){installEvent.prompt();await installEvent.userChoice;installEvent=null;return;}
 alert("スマホのブラウザメニューから「ホーム画面に追加」または「アプリをインストール」を選ぶと、アプリのように起動できます。");
}
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installEvent=e;});
function handleAction(a){
 switch(a){
  case "project":projecting=!projecting;renderAudience();break;
  case "newPrompt":generate("この競技で新しくて面白いお題を考えて！");break;
  case "chatSend":sendChat();break;
  case "mic":mic();break;
  case "evidence":s.evidence=!s.evidence;save();render();break;
  case "verdictPro":verdict("pro");break;case "verdictDef":verdict("def");break;
  case "undo":undo();break;
  case "news":newsVisible=!newsVisible;if(newsVisible)newsText=newsGenerator();renderNews();beeps();break;
  case "timer":timerToggle();break;
  case "timerReset":timerRunning=false;timerRemaining=timerDuration;tick();break;
  case "volume":s.volume=!s.volume;save();render();break;
  case "reset":reset();break;
  case "begin":beginGame();break;
  case "install":install();break;
  case "menu":document.getElementById("optionsMenu")?.scrollIntoView({behavior:"smooth"});break;
 }
}
document.addEventListener("click",event=>{
 const b=event.target.closest("button");if(!b)return;
 if(b.dataset.mode){if(busy)return;s.mode=b.dataset.mode;save();render();generate("新しい競技のお題を作って！");return;}
 if(b.dataset.score!==undefined){score(Number(b.dataset.score),Number(b.dataset.pt));return;}
 if(b.dataset.time!==undefined){setTimer(Number(b.dataset.time));return;}
 if(b.dataset.quick!==undefined){const q=["もっと難しくして！","さらに爆笑できる変な展開にして！","誰でも答えやすく、やさしくして！","次はどうでもよすぎる裁判にして！"][Number(b.dataset.quick)];generate(q);return;}
 if(b.dataset.action)handleAction(b.dataset.action);
});
document.addEventListener("change",event=>{if(event.target.id==="teamCount"){setTeamCount(event.target.value);return;}if(event.target.dataset.name===undefined)return;const i=Number(event.target.dataset.name);if(!Number.isInteger(i)||i<0||i>=s.names.length)return;s.names[i]=event.target.value.trim().slice(0,22)||"チーム"+(i+1);save();render()});
document.addEventListener("keydown",event=>{if(event.target.id==="chatInput"&&event.key==="Enter"&&(event.ctrlKey||event.metaKey)){event.preventDefault();sendChat();}if(event.key==="Escape"&&projecting){projecting=false;renderAudience();}});
setInterval(tick,150);
if(s.started&&!s.item){s.item=makeLocal(s.mode);s.source="rules";s.round=1;s.history=[{...s.item,round:1}];recent.push(s.item.prompt);save();}
render();
})();