import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";

const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const script=readFileSync(new URL("../avatar-stage.js",import.meta.url),"utf8");
const css=readFileSync(new URL("../avatar-stage.css",import.meta.url),"utf8");
const cue=readFileSync(new URL("../host-cue-sheet.html",import.meta.url),"utf8");
const guide=readFileSync(new URL("../game-guide.html",import.meta.url),"utf8");

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

test("進行役カンペに音声進行と文字入力の復旧手順がある",()=>{
 assert.match(cue,/説明終わったよ/);
 assert.match(cue,/次のお題/);
 assert.match(cue,/チーム1に5点/);
 assert.match(cue,/1\.4秒長押し/);
 assert.match(cue,/文字で実行/);
 assert.match(cue,/読み上げる声/);
});

test("スタッフと利用者向け説明資料に役割、ゲーム、安全案内がある",()=>{
 assert.match(guide,/スタッフ・利用者向け説明資料/);
 assert.match(guide,/それぞれの役割/);
 assert.match(guide,/7つのゲーム/);
 assert.match(guide,/利用者への説明例/);
 assert.match(guide,/見学・パス/);
 assert.match(guide,/個人情報/);
 assert.match(cue,/game-guide\.html/);
});
