
const TYPES=["sync","pitch","mime","court","press","choice","challenge"];
const basePrompt=`必ず自然な日本語の一人称の返事だけを書く。会話の脚本を作らず、相手の台詞を創作しない。「スタッフ：」「もこ：」と話者名を付けない。短い返事は2〜3文で完結させる。あなたの返事だけを出力する。あなたは大人向けチーム対抗レクリエーション「サイ校・おバカ世界選手権」の企画相棒「もこ」です。司会者は必ず人間のスタッフ。舞台裏でスタッフと自然な日本語で相談します。大切なのは「くだらなくて笑えるのに、真剣勝負になる」こと。福祉施設の利用者を子ども扱いしない。体力・知識・話す速さの差を考慮し、危険行為・差別・性的内容・私生活暴露・実在人物への中傷は避ける。話し言葉は温かく、短く、分かりやすい日本語。根拠のない決めつけや不自然な単語の羅列をしない。スタッフへの返事に進行台本や準備物一覧を書かない。`;
const draftPrompt=`${basePrompt}
スタッフと会話した内容から、観客にまだ表示しないお題の「案」を1つ作る。AIから勝手に本番公開はしない。
以下のJSONのみを返す。ほかの言葉、コードフェンスは禁止。
{"reply":"スタッフへの自然な一言（100文字以内）","title":"短い題名","prompt":"自然な日本語のお題の内容","options":["選択肢A","選択肢B"],"evidence":"裁判の途中で明かす新証拠","criterion":"明快な採点・判定基準"}
ゲームルール：
sync: 2人が相談せずA/Bを選ぶ一致ゲーム。違う2つのoptions必須。
pitch: 30秒間のインチキ通販。身近なものを売り込む。言いやすく計測できる条件を付ける。
mime: 言葉を使わずジェスチャーか絵で伝える、変な一場面。
court: くだらない生活マナーをめぐる「〜は有罪か？」という事件。後出しのevidence必須。
press: ありえない記者会見の問い。5秒以内の返答。「はい」「いいえ」「わかりません」禁止。
choice: どちらも迷う究極の2択。違う2つのoptions必須。
challenge: 道具なしでもできる安全な、計測できるチャレンジ。criterionに判定を書き入れる。
要望された難易度や話題を優先し、意味が通る面白い日本語を出す。`;
const replyJSON=(v,status=200)=>Response.json(v,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
function parseJSON(raw){const i=raw.indexOf("{"),j=raw.lastIndexOf("}");if(i<0||j<=i)throw Error("json");return JSON.parse(raw.slice(i,j+1))}
async function onRequestPost({request,env}){
 const origin=request.headers.get("Origin");if(origin&&origin!==new URL(request.url).origin)return replyJSON({error:"origin"},403);
 if(Number(request.headers.get("Content-Length")||0)>9000)return replyJSON({error:"too_large"},413);
 let data;try{data=await request.json()}catch{return replyJSON({error:"bad_json"},400)}
 const mode=String(data?.mode||"sync"),kind=String(data?.kind||"chat");
 if(!TYPES.includes(mode)||!["chat","draft"].includes(kind))return replyJSON({error:"bad_mode"},400);
 if(!env?.AI)return replyJSON({error:"AI_UNBOUND"},503);
 const msg=String(data?.message||"").trim().slice(0,300);
 const history=Array.isArray(data?.history)?data.history.slice(-8).map(x=>({role:x?.who==="host"?"user":"assistant",content:String(x?.text||"").slice(0,180)})).filter(x=>x.content):[];
 const old=data?.draft&&typeof data.draft==="object"?{title:String(data.draft.title||"").slice(0,45),prompt:String(data.draft.prompt||"").slice(0,160)}:null;
 const recent=Array.isArray(data?.recent)?data.recent.slice(-5).map(x=>String(x).slice(0,100)):[];
 const instructions=`競技:${mode}。チーム数:${Math.max(2,Math.min(10,Number(data?.teamCount)||3))}。スタッフの発言:${msg||"新しいお題案を考えて"}。検討中のお題案:${old?JSON.stringify(old):"まだなし"}。最近のお題（重複を避ける）:${recent.join(" / ")||"なし"}。`;
 try{
  const out=await env.AI.run("@cf/qwen/qwen3-30b-a3b-fp8",{
   messages:[{role:"system",content:kind==="chat"?basePrompt:draftPrompt},...history,{role:"user",content:instructions+(kind==="chat"?"今回はスタッフとの相談として自然に返事をし、お題は確定しない。":"相談内容に合う新しいお題案を作ってください。")}],
   max_tokens:kind==="chat"?260:900,temperature:kind==="chat"?0.55:0.69,top_p:0.87
  });
  const raw=String(out?.response||out?.result?.response||out?.choices?.[0]?.message?.content||"").replace(/<think>[\s\S]*?<\/think>/g,"").trim();
  if(kind==="chat"){
   if(!raw)throw Error("empty");
   return replyJSON({kind,provider:"workers-ai",reply:raw.replace(/<[^>]*>/g,"").slice(0,390)});
  }
  const obj=parseJSON(raw),prompt=String(obj.prompt||"").trim().slice(0,220);
  const options=Array.isArray(obj.options)?obj.options.slice(0,2).map(x=>String(x||"").trim().slice(0,80)).filter(Boolean):[];
  if(!prompt)throw Error("empty_prompt");
  if(["sync","choice"].includes(mode)&&(options.length!==2||options[0]===options[1]))throw Error("options");
  if(mode==="court"&&!String(obj.evidence||"").trim())throw Error("evidence");
  return replyJSON({kind,provider:"workers-ai",
   reply:String(obj.reply||"この案、どうかな？ 変えたいところがあれば教えてね。").slice(0,160),
   draft:{mode,title:String(obj.title||"おバカチャレンジ").slice(0,48),prompt,options,evidence:String(obj.evidence||"").slice(0,140),criterion:String(obj.criterion||"").slice(0,140)}});
 }catch{return replyJSON({error:"AI_UNAVAILABLE",message:"AIと通信できませんでした。"},503)}
}
function onRequestGet(){return replyJSON({error:"method_not_allowed"},405)}

export {onRequestPost,onRequestGet};
