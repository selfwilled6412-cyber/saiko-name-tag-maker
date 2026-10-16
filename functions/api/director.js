// Cloudflare Pages Function: server-side AI game co-pilot. No API keys are exposed to visitors.
const MODES={
 sync:"ぴったりシンクロ",pitch:"おすすめプレゼン",mime:"ジェスチャー対決",
 court:"もしも裁判",press:"記者会見チャレンジ",choice:"どっちを選ぶ？",
 challenge:"ぴったりチャレンジ"
};
const SYSTEM=`あなたは就労継続支援B型施設の大人向けチーム対抗ゲームアプリ「サイ校ゲーム」の音声アバター司会。スタッフの声を聞き、その場で新しいお題を考えて会話だけで進行する。
最重要: 固定のお題の暗唱は禁止。毎回異なる意外な組み合わせと展開で爆笑できる、短く具体的な日本語のお題を考える。子供扱いしない。危険行為、性的内容、差別、実在人物への中傷、政治宗教の強要、私生活の暴露は禁止。体力・知識・話す速さで不当に不利にならず、誰でも参加しやすいもの。特別な購入物を必要としない。スタッフが望めば難易度、トーン、種目を変更してよい。
厳密にJSONオブジェクトだけ返す。形:
{"reply":"スタッフへの短い自然な返事（35字以内）","mode":"sync|pitch|mime|court|press|choice|challenge","title":"短いお題名（22字以内）","prompt":"観客に見せる1〜2文の新しい課題（130字以内）","options":["選択肢A","選択肢B"],"evidence":"裁判で後から初公開するユーモラスで状況を変える証拠（90字以内）","criterion":"勝敗を明確に決める一文（70字以内）"}
mode別ルール：
sync: 2人が相談せず同じ答えを選ぶ二択。optionsは必ず異なる2つ、promptは問いかけ。
pitch: 日常的な物を驚きの商品として30秒で売り込む。採点は指定ワード3つの使用回数+制限時間で客観的に。必要物は架空でもよい。
mime: 奇妙な場面をジェスチャーか絵で伝える。promptは見てすぐ演じられる1場面。
court: 必ず架空のくだらない生活マナーを裁く。promptは「〜は有罪か？」。evidenceは後出しで笑える新証拠。勝敗は検察と弁護どちらが説得力あるか裁判官チームが判定。
press: スタッフが異常な記者質問をし、各チームは5秒以内で返答。「はい」「いいえ」「わかりません」禁止。
choice: 正解のない2択でチームの理由を競う。optionsは必ず異なる2つ。
challenge: 何も買わず手と声と想像力だけで完結する、明快に測れる変なチャレンジ。危険な動作なし。測定方法をcriterionに明記。
返事の中に説明書、準備物一覧、進行台本、スタッフ向け手順は入れない。
`;
const json=(data,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
export async function onRequestPost({request,env}){
 const origin=request.headers.get("Origin");
 if(origin&&origin!==new URL(request.url).origin)return json({error:"origin"},403);
 if(Number(request.headers.get("Content-Length")||0)>7000)return json({error:"too_large"},413);
 let input;
 try{input=await request.json()}catch{return json({error:"bad_json"},400)}
 const mode=String(input?.mode||"sync").slice(0,30);
 const message=String(input?.message||"次のお題を作って").slice(0,250);
 const recent=Array.isArray(input?.recent)?input.recent.slice(-5).map(v=>String(v).slice(0,95)):[];
 if(!MODES[mode])return json({error:"bad_mode"},400);
 if(!env.AI)return json({error:"AI_UNBOUND",hint:"Workers AI binding is not enabled"},503);
 const lines=`現在の競技: ${MODES[mode]} (${mode})\nスタッフの要望: ${message}\n直近のお題（重複を避ける）: ${recent.join(" / ")||"なし"}\n新しいお題1件を生成。スタッフの要望に応じてmodeを変更してもよい。`;
 try{
  const out=await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fp8",{
   messages:[{role:"system",content:SYSTEM},{role:"user",content:lines}],
   max_tokens:390,temperature:0.88,top_p:0.92
  });
  const raw=String(out?.response||out?.result?.response||"");
  const found=raw.match(/\{[\s\S]*\}/);
  if(!found)throw new Error("no_json");
  const obj=JSON.parse(found[0]);
  const m=MODES[obj.mode]?obj.mode:mode;
  const prompt=String(obj.prompt||"").slice(0,150).trim();
  if(!prompt)throw new Error("empty_prompt");
  const options=Array.isArray(obj.options)?obj.options.slice(0,2).map(x=>String(x).slice(0,55).trim()).filter(Boolean):[];
  if((["sync","choice"].includes(m)&& (options.length!==2||options[0]===options[1])) || (m==="court"&&!String(obj.evidence||"").trim()))throw new Error("invalid_game_schema");
  return json({
   provider:"workers-ai",reply:String(obj.reply||"新しいお題を作ったよ！").slice(0,90),
   item:{mode:m,title:String(obj.title||"新しいチャレンジ").slice(0,35),
   prompt,options,
   evidence:String(obj.evidence||"").slice(0,110),criterion:String(obj.criterion||"").slice(0,110)}
  });
 }catch(err){return json({error:"AI_FAILED",message:"AI生成に失敗しました。端末内でお題を作成できます。"},503)}
}
export async function onRequestGet(){return json({error:"method_not_allowed"},405)}
