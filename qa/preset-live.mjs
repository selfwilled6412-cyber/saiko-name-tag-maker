const base=process.env.BASE_URL||"https://saiko-world-grand-prix.pages.dev";
const checks=[
 ["/preset-preview.html","preset-preview-2"],
 ["/preset-game-data.js","ぴったりシンクロ"],
 ["/preset-game-data.js","第二の人生"],
 ["/preset-stage.js","タップを確認しました"],
 ["/preset-stage.js","新しい証拠お願いします"],
 ["/preset-stage.css",".secret-card"]
];
for(const [path,marker] of checks){
 const response=await fetch(base+path,{signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error(`${path}: HTTP ${response.status}`);
 const text=await response.text();
 if(!text.includes(marker))throw new Error(`${path}: missing ${marker}`);
 console.log(`ok ${path}`);
}
