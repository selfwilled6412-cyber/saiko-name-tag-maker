const base='https://saiko-world-grand-prix.pages.dev';
const files=[['/studio.html','game-v3.js'],['/game-v3.js','何チームで勝負する？'],['/game-v3.css','.setup-names'],['/host-cue-sheet.html','音声が通らない時の文字入力'],['/game-guide.html','利用者への説明例'],['/manifest.webmanifest','standalone']];
for(const [path,marker] of files){
 let result=false,lastStatus=0,lastSize=0;
 for(let attempt=0;attempt<12;attempt++){
  try{
   const r=await fetch(base+path+'?v='+Date.now()+'-'+attempt,{signal:AbortSignal.timeout(12000)});
   const txt=await r.text();lastStatus=r.status;lastSize=txt.length;
   result=r.status===200&&txt.includes(marker);
  }catch(e){lastStatus=0;lastSize=0;}
  if(result)break;
  if(attempt<11)await new Promise(resolve=>setTimeout(resolve,4500));
 }
 console.log(path,'HTTP',lastStatus,'bytes',lastSize,'marker',result?'PASS':'FAIL');
 if(!result)process.exitCode=1;
}
try{
 const r=await fetch(base+'/api/director',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'sync',message:'本番前のAPI接続確認'}),signal:AbortSignal.timeout(25000)});
 let j=null;try{j=await r.json();}catch{}
 console.log('/api/director POST','HTTP',r.status,'provider',j?.provider||j?.error||'invalid');
 if(r.status!==200&&r.status!==503)process.exitCode=1;
}catch(e){console.log('AI_API_NETWORK_ERROR',String(e));process.exitCode=1;}
if(process.exitCode)throw new Error('Published studio not fully verified');
