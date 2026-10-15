// Cloudflare Pages の公開内容が GitHub の最新版と一致するか確認する。
const url='https://saiko-world-grand-prix.pages.dev/?qa='+Date.now();
const marker='game-v4.js';
let last='';
for(let i=0;i<18;i++){
 try{
  const response=await fetch(url+'&try='+i,{signal:AbortSignal.timeout(15000),headers:{'User-Agent':'SAIKO-Live-QA'}});
  const html=await response.text();
  last='HTTP '+response.status+' / HTML '+html.length+' bytes / latest='+html.includes(marker);
  if(response.ok&&html.includes(marker)){
   console.log('Cloudflare live verification PASS: '+last);
   process.exit(0);
  }
  console.log('Waiting for deployment: '+last);
 }catch(error){last=String(error);console.log('Fetch retry: '+last);}
 await new Promise(resolve=>setTimeout(resolve,8000));
}
throw new Error('Cloudflare production was not verified as latest. Last result: '+last);
