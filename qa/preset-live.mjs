const base=process.env.BASE_URL||"https://saiko-world-grand-prix.pages.dev";
const checks=[
 ["/preset-preview.html","preset-preview-6"],
 ["/preset-game-data.js","ぴったりシンクロ"],
 ["/preset-game-data.js","第二の人生"],
 ["/preset-stage.js","SAIKO_PRESET_AUDIO"],
 ["/preset-audio-manifest.js","94f5b3e2767ec80bce4a.mp3"],
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
const audio=await fetch(base+"/audio/preset/94f5b3e2767ec80bce4a.mp3",{signal:AbortSignal.timeout(15000)});
if(!audio.ok)throw new Error(`/audio/preset/: HTTP ${audio.status}`);
const bytes=await audio.arrayBuffer();
if(bytes.byteLength<1000)throw new Error("/audio/preset/: empty audio");
console.log("ok /audio/preset/ (natural voice)");
