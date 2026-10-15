const root='https://saiko-world-grand-prix.pages.dev';
const checks=[['/avatar.html','avatar-stage.js'],['/avatar-stage.js','saiko-voice-host-v1'],['/avatar-stage.css','.avatar']];
for(const [path,mark] of checks){
 let ok=false,status=0,bytes=0;
 for(let i=0;i<10;i++){
  const r=await fetch(root+path+'?v='+Date.now()+'-'+i,{signal:AbortSignal.timeout(12000)});
  const html=await r.text();status=r.status;bytes=html.length;
  ok=r.ok&&html.includes(mark);
  if(ok)break;
  await new Promise(done=>setTimeout(done,4000));
 }
 console.log(path,'HTTP',status,'size',bytes,ok?'PASS':'FAIL');
 if(!ok)process.exitCode=1;
}
if(process.exitCode)throw Error('Avatar stage preview not deployed');