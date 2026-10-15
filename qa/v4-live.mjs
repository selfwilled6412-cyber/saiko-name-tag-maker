const base='https://saiko-world-grand-prix.pages.dev';
for(const [path,marker] of [['/new-game.html','game-v4.js'],['/game-v4.js','saiko-grand-prix-v4'],['/game-v4.css','.mascot']]){
 let valid=false,status=0,len=0;
 for(let i=0;i<12;i++){
  const r=await fetch(base+path+'?t='+Date.now()+'-'+i,{signal:AbortSignal.timeout(12000)});
  status=r.status;const body=await r.text();len=body.length;valid=status===200&&body.includes(marker);
  if(valid)break;
  await new Promise(ok=>setTimeout(ok,2500));
 }
 console.log('Preview',path,status,len,valid?'PASS':'FAIL');
 if(!valid)process.exitCode=1;
}
async function talk(kind,text){
 try{
  const r=await fetch(base+'/api/partner',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,mode:'court',message:text,history:[{who:'host',text:'身近な話題でお願いします'}],teamCount:3,recent:[]}),signal:AbortSignal.timeout(30000)});
  const data=await r.json();
  console.log('AI',kind,'HTTP',r.status,'provider',data.provider||data.error||'?', 'reply=',String(data.reply||'').slice(0,85),'draft=',String(data.draft?.prompt||'').slice(0,85),'reason=',String(data.reason||'').slice(0,90));
  if(r.status!==200&&r.status!==503)process.exitCode=1;
 }catch(e){console.log('AI',kind,'ERROR',String(e));process.exitCode=1}
}
await talk('chat','食べ物の話題でどうでもいい裁判をやりたい。どんな感じがいい？');
await talk('draft','プリンのような身近な食べ物の裁判を、一つ提案して。');
if(process.exitCode)throw Error('v4 preview verification failed');