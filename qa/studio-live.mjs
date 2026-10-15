const base='https://saiko-world-grand-prix.pages.dev';
const files=[['/studio.html','game-v3.js'],['/game-v3.js','saiko-grand-prix-studio-v3'],['/game-v3.css','.chatlog'],['/manifest.webmanifest','standalone']];
for(const [path,marker] of files){
 const r=await fetch(base+path+'?v='+Date.now(),{signal:AbortSignal.timeout(12000)});
 const txt=await r.text();
 const result=r.status===200&&txt.includes(marker);
 console.log(path,'HTTP',r.status,'bytes',txt.length,'marker',result?'PASS':'FAIL');
 if(!result)process.exitCode=1;
}
try{
 const r=await fetch(base+'/api/director',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'sync',message:'本番前のAPI接続確認'}),signal:AbortSignal.timeout(25000)});
 let j=null;try{j=await r.json();}catch{}
 console.log('/api/director POST','HTTP',r.status,'provider',j?.provider||j?.error||'invalid');
 if(r.status!==200&&r.status!==503)process.exitCode=1;
}catch(e){console.log('AI_API_NETWORK_ERROR',String(e));process.exitCode=1;}
if(process.exitCode)throw new Error('Published studio not fully verified');