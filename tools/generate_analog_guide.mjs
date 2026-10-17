import fs from "node:fs";
import vm from "node:vm";

const root=new URL("../",import.meta.url);
const source=fs.readFileSync(new URL("preset-game-data.js",root),"utf8");
const sandbox={window:{}};
vm.runInNewContext(source,sandbox,{timeout:2500});
const games=sandbox.window.SAIKO_PRESET_GAMES;

const escape=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const guides={
 sync:{format:"二人一組・チーム戦",summary:"二人で相談せず、二つの選択肢から一つを選びます。スタッフの『せーの』で同時に答え、同じ答えならシンクロ成功です。",steps:["二人を前に案内し、相談しないよう伝える","お題を読み、最後に『せーの』と合図する","二人が同時に答える","同じ答えなら成功として記録する"],score:"得点を付ける場合の例：シンクロ成功1回につき1点。"},
 pitch:{format:"個人戦・一人1分",summary:"身近な物を特別な商品として紹介します。お題に指定語がある場合は、その言葉を必ず使います。",steps:["挑戦者へお題と指定語を読む","1分タイマーを開始する","終了後、魅力・分かりやすさ・発想や工夫を判定する"],score:"判定：魅力・分かりやすさ・発想や工夫を各0〜2点、合計6点。"},
 mime:{format:"二人一組・チーム戦",summary:"一人が言葉や声を使わずに演じ、もう一人が答えます。一チーム2問で、1問ごとに役割を交代します。",steps:["答える人に後ろを向くか耳をふさいでもらう","演じる人だけに秘密のお題を見せる","答える人を戻し、スタッフがスタートを合図する","正解または時間終了で止め、次の役割へ交代する"],score:"得点を付ける場合の例：制限時間内の正解1問につき1点。制限時間は会場で決めます。"},
 court:{format:"個人戦",summary:"お題について有罪か無罪かを選び、理由を説明します。その後に追加の証拠を読み、最終判決と理由を発表します。",steps:["裁判のお題を読む","挑戦者が最初の判決と理由を発表する","スタッフが追加の証拠を読む","挑戦者が最終判決と理由を発表する"],score:"正解はありません。得点を付ける場合は、理由の分かりやすさや発想を拍手・投票などで判定します。"},
 press:{format:"個人戦・一人1問",summary:"挑戦者は架空の立場で記者からの質問に答えます。質問後5秒以内に話し始め、理由や物語を作ります。",steps:["挑戦者を一人決める","役割と質問を読む","5秒以内に回答を始めてもらう","次のお題は次の人へ交代する"],score:"得点を付ける場合は、発想・説得力・会場の盛り上がりをスタッフまたは拍手で判定します。"},
 choice:{format:"二人一組・チーム戦",summary:"二つの選択肢からチームで一つを選び、選んだ答えと理由を発表します。正解はありません。",steps:["二人へお題を読む","短く相談して一つを選んでもらう","選んだ答えと理由を発表してもらう"],score:"得点を付ける場合は、理由の面白さ・納得感・チームワークを拍手などで判定します。"},
 challenge:{format:"個人戦または二人一組のチーム戦",summary:"時間や長さなどを、自分の感覚で目標に近づけます。スタッフが安全確認と計測を行います。",steps:["個人戦かチーム戦を決める","該当するお題だけを読む","スタッフがスタートを合図して計測する","目標との差を記録する"],score:"目標との差が最も小さい人またはチームが勝ちです。お題に同点時の条件があれば、それに従います。"}
};

function itemMarkup(game,index,item){
 const number=index+1;
 if(game.id==="court")return `<li class="question"><h4>第${number}問</h4><p>${escape(item.prompt)}</p><div class="evidence"><strong>追加の証拠</strong><p>${escape(item.evidence)}</p></div></li>`;
 if(game.id==="challenge")return `<li class="question"><h4>第${number}問</h4><div class="mode individual"><strong>個人戦</strong><p>${escape(item.individual)}</p></div><div class="mode team"><strong>チーム戦</strong><p>${escape(item.team)}</p></div></li>`;
 if(game.id==="mime"){const team=Math.floor(index/2)+1,turn=index%2+1;return `<li class="question secret"><h4>第${number}問｜${team}チーム目・${turn}問目</h4><strong>演じる人だけに見せるお題</strong><p>${escape(item.prompt)}</p></li>`}
 const person=game.id==="press"?`｜${number}人目`:"";
 return `<li class="question"><h4>第${number}問${person}</h4><p>${escape(item.prompt)}</p></li>`;
}

function gameMarkup(game,index){
 const guide=guides[game.id];
 const patterns=[1,2,3].map(pattern=>`<section class="pattern" id="${game.id}-${pattern}"><h3>${escape(game.name)}｜パターン${pattern}</h3><ol class="questions">${game.patterns[String(pattern)].map((item,itemIndex)=>itemMarkup(game,itemIndex,item)).join("")}</ol></section>`).join("");
 return `<section class="game-section" id="${game.id}"><header class="game-head"><span>${index+1}</span><div><h2>${escape(game.name)}</h2><p class="format">${escape(guide.format)}</p></div></header><div class="rule-grid"><article><h3>ルール</h3><p>${escape(guide.summary)}</p><p class="score">${escape(guide.score)}</p></article><article><h3>スタッフの進め方</h3><ol>${guide.steps.map(step=>`<li>${escape(step)}</li>`).join("")}</ol></article></div>${patterns}</section>`;
}

const nav=games.map((game,index)=>`<a href="#${game.id}">${index+1}. ${escape(game.name)}</a>`).join("");
const html=`<!doctype html>
<html lang="ja">
<head>
 <meta charset="utf-8">
 <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
 <meta name="robots" content="noindex,nofollow">
 <meta name="theme-color" content="#f2eadb">
 <title>完全アナログ版・全お題集｜サイ校ゲーム</title>
 <style>
  *{box-sizing:border-box}html{scroll-behavior:smooth;background:#eee8dc}body{margin:0;padding:15px;font-family:system-ui,"Yu Gothic UI","Hiragino Sans",Meiryo,sans-serif;color:#2f2a24;line-height:1.68}.toolbar{position:sticky;top:0;z-index:20;max-width:1160px;margin:0 auto 10px;padding:6px;display:flex;gap:8px;flex-wrap:wrap;border-radius:13px;background:#eee8dce8;backdrop-filter:blur(9px)}.btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;border:1px solid #a69373;border-radius:10px;padding:9px 14px;background:#fff;color:#5a482f;text-decoration:none;font:inherit;font-weight:900;cursor:pointer}.btn.primary{background:#6b5132;color:#fff}.book{max-width:1160px;margin:auto;background:#fffdf8;border:1px solid #d5c8ae;border-radius:20px;box-shadow:0 18px 55px #513e2220;overflow:hidden}.hero{padding:35px clamp(20px,5vw,56px);display:grid;grid-template-columns:1fr auto;gap:20px;align-items:center;background:linear-gradient(135deg,#f8edcf,#fffaf0 62%,#e6f2e6)}.hero h1{margin:0;font-size:clamp(31px,5vw,54px);line-height:1.1}.hero p{max-width:760px;margin:11px 0 0;font-weight:700}.hero img{width:150px;height:180px;object-fit:contain;object-position:top center}.badges{display:flex;gap:7px;flex-wrap:wrap;margin-top:14px}.badge{padding:5px 9px;border-radius:999px;background:#fff;color:#654e31;font-size:12px;font-weight:900}.content{padding:clamp(18px,4vw,44px)}.notice{padding:15px;border:2px solid #b75b3f;border-radius:13px;background:#fff2ec;color:#663120;font-weight:800}.prep,.rule-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.prep article,.rule-grid article{padding:14px;border:1px solid #ddd1bc;border-radius:13px;background:#fff}.prep h2,.rule-grid h3{margin:0 0 7px;color:#6b5132}.toc{margin:18px 0;padding:15px;border-radius:13px;background:#f5efe3}.toc h2{margin:0 0 8px}.toc nav{display:flex;gap:7px;flex-wrap:wrap}.toc a{padding:6px 9px;border-radius:8px;background:#fff;color:#604a30;font-weight:900;text-decoration:none}.game-section{scroll-margin-top:70px;margin-top:36px}.game-head{display:flex;gap:12px;align-items:center;border-bottom:3px solid #796044;padding-bottom:9px}.game-head>span{display:grid;place-items:center;width:44px;height:44px;border-radius:50%;background:#6b5132;color:#fff;font-size:21px;font-weight:950}.game-head h2{margin:0;font-size:28px}.format{margin:2px 0 0;color:#6a5a46;font-weight:900}.score{padding:8px 10px;border-radius:9px;background:#f4efe5;font-size:13px}.pattern{margin-top:22px}.pattern>h3{margin:0;padding:9px 12px;border-radius:10px;background:#6b5132;color:#fff}.questions{margin:0;padding:12px 0;list-style:none;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.question{padding:12px 13px;border:1px solid #dfd5c3;border-radius:12px;background:#fff;break-inside:avoid}.question h4{margin:0 0 5px;color:#6b5132}.question p{margin:4px 0}.question.secret{background:#eef5f9;border-color:#a9c6d6}.evidence{margin-top:9px;padding:9px;border-left:5px solid #b45b3e;border-radius:7px;background:#fff1eb}.mode{margin-top:7px;padding:8px;border-radius:8px}.mode.individual{background:#eef6fb}.mode.team{background:#eef8ef}.back{display:inline-block;margin-top:8px;color:#6b5132;font-weight:900}footer{padding:17px clamp(18px,4vw,44px);background:#f3ecdf;color:#6d604f;font-size:11px}@page{size:A4 portrait;margin:9mm}@media print{html,body{background:#fff}body{padding:0}.toolbar,.toc,.back{display:none}.book{max-width:none;border:0;border-radius:0;box-shadow:none}.hero{padding:15px 20px}.hero h1{font-size:31px}.hero p{font-size:10px}.hero img{width:90px;height:105px}.badge{font-size:8px}.content{padding:16px}.notice,.prep article,.rule-grid article{font-size:9px;padding:8px}.game-section{break-before:page;margin-top:0}.game-head h2{font-size:21px}.game-head>span{width:32px;height:32px;font-size:14px}.format{font-size:10px}.rule-grid{gap:6px}.rule-grid h3{font-size:13px}.score{font-size:8px}.pattern{break-before:page;margin-top:0}.pattern>h3{font-size:16px}.questions{gap:5px;padding:7px 0}.question{font-size:9px;padding:7px}.question h4{font-size:10px}.evidence,.mode{padding:5px;margin-top:5px}footer{display:none}}@media(max-width:760px){body{padding:8px}.btn{flex:1}.hero{grid-template-columns:1fr;padding:22px 17px}.hero img{display:none}.content{padding:15px 11px}.prep,.rule-grid,.questions{grid-template-columns:1fr}.game-head h2{font-size:23px}}
 </style>
</head>
<body id="top">
 <nav class="toolbar" aria-label="資料の操作"><a class="btn" href="/host-cue-sheet.html">声かけカンペ</a><a class="btn" href="/game-guide.html">利用者向け資料</a><button class="btn primary" type="button" onclick="print()">全お題を印刷する</button></nav>
 <main class="book">
  <header class="hero"><div><h1>完全アナログ版<br>全お題集</h1><p>アプリ・音声・インターネットが使えない時も、スタッフの読み上げだけで7ゲームを進行できます。事前に印刷しておけば完全オフラインで使用できます。</p><div class="badges"><span class="badge">全7ゲーム</span><span class="badge">各3パターン</span><span class="badge">各10問</span><span class="badge">全210問</span><span class="badge">裁判の証拠30件</span></div></div><img src="/coach-avatar.png" alt="男性スポーツコーチ姿のアバター"></header>
  <div class="content">
   <p class="notice">使い方：遊ぶゲームを一つ選び、パターン1〜3のどれか一セットを選びます。スタッフがルールと第1問から順に読み上げてください。全部行う必要はありません。時間に合わせて途中で終了できます。</p>
   <div class="prep"><article><h2>用意するもの</h2><ul><li>この全お題集の印刷物</li><li>筆記用具と得点表</li><li>1分を測れるタイマー</li><li>ぴったりチャレンジ用の時計・定規など</li></ul></article><article><h2>共通の声かけ</h2><ol><li>「これからルールを説明します」</li><li>ルールとお題をゆっくり読む</li><li>「準備はいいですか。それではスタート」</li><li>終了後に結果を記録し、次の問題へ進む</li></ol></article></div>
   <section class="toc"><h2>ゲームを選ぶ</h2><nav>${nav}</nav></section>
   ${games.map(gameMarkup).join("")}
   <a class="back" href="#top">ページの先頭へ戻る</a>
  </div>
  <footer>サイ校ゲーム｜完全アナログ版・全お題集｜preset-game-data.jsから自動生成｜更新：2026年10月17日</footer>
 </main>
</body>
</html>`;

fs.writeFileSync(new URL("analog-game-book.html",root),html,"utf8");
console.log(`generated analog-game-book.html: ${games.length} games, ${games.flatMap(game=>Object.values(game.patterns).flat()).length} questions`);
