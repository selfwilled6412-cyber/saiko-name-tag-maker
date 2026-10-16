import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";

const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const script=readFileSync(new URL("../avatar-stage.js",import.meta.url),"utf8");
const css=readFileSync(new URL("../avatar-stage.css",import.meta.url),"utf8");

test("本番URLは完全音声アバター画面を読み込む",()=>{
 assert.match(html,/avatar-stage\.js\?v=voice-only/);
 assert.match(html,/avatar-stage\.css\?v=voice-only/);
 assert.match(html,/coach-avatar\.png/);
 assert.match(html,/coach-avatar-speaking\.png/);
 assert.doesNotMatch(html,/game-v3|game-v4|チャット|字幕|おバカ/);
});

test("アバター画像と音声進行の実装が存在する",()=>{
 assert.ok(existsSync(new URL("../coach-avatar.png",import.meta.url)));
 assert.ok(existsSync(new URL("../coach-avatar-speaking.png",import.meta.url)));
 assert.match(script,/SpeechRecognition/);
 assert.match(script,/speechSynthesis/);
 assert.match(script,/saiko-voice-choice-v1/);
 assert.match(script,/adminCommand/);
 assert.match(script,/説明終わ/);
 assert.match(script,/team_setup/);
 assert.match(script,/pending=\{type:"score"/);
});

test("通常画面のCSSは文字UIを持たず、管理画面だけ別レイヤーにする",()=>{
 assert.match(css,/\.avatar-image/);
 assert.match(css,/\.avatar-mouth/);
 assert.match(css,/\.start-surface/);
 assert.match(css,/\.admin-backdrop/);
 assert.match(css,/\.sr-only/);
});
