const root='https://saiko-world-grand-prix.pages.dev';
const checks=[['/','coach-avatar-speaking.png'],['/avatar.html','coach-avatar-speaking.png'],['/avatar-stage.js','adminCommand'],['/avatar-stage.css','.avatar-mouth'],['/coach-avatar.png','PNG'],['/coach-avatar-speaking.png','PNG']];
for(const [path,mark] of checks){
 let ok=false,status=0,bytes=0;
 for(let i=0;i<10;i++){
  const r=await fetch(root+path+'?v='+Date.now()+'-'+i,{signal:AbortSignal.timeout(12000)});
  status=r.status;
  if(path.endsWith('.png')){
   const data=new Uint8Array(await r.arrayBuffer());bytes=data.byteLength;
   ok=r.ok&&data[0]===0x89&&data[1]===0x50&&data[2]===0x4e&&data[3]===0x47;
  }else{
   const html=await r.text();bytes=html.length;ok=r.ok&&html.includes(mark);
  }
  if(ok)break;
  await new Promise(done=>setTimeout(done,4000));
 }
 console.log(path,'HTTP',status,'size',bytes,ok?'PASS':'FAIL');
 if(!ok)process.exitCode=1;
}
if(process.exitCode)throw Error('Avatar stage preview not deployed');
