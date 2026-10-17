import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";

const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const script=readFileSync(new URL("../avatar-stage.js",import.meta.url),"utf8");
const css=readFileSync(new URL("../avatar-stage.css",import.meta.url),"utf8");
const cue=readFileSync(new URL("../host-cue-sheet.html",import.meta.url),"utf8");
const guide=readFileSync(new URL("../game-guide.html",import.meta.url),"utf8");
const analog=readFileSync(new URL("../analog-game-book.html",import.meta.url),"utf8");

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
 assert.match(script,/data-team-name/);
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
 assert.match(cue,/ぴったりシンクロ、パターン1、スタート/);
 assert.match(cue,/一問目スタート/);
 assert.match(cue,/次のお題お願いします/);
 assert.match(cue,/新しい証拠お願いします/);
 assert.match(cue,/お題をお願いします/);
 assert.match(cue,/ぴったりチャレンジ、個人戦、パターン1、スタート/);
 assert.match(cue,/1\.4秒長押し/);
 assert.match(cue,/文字で実行/);
 assert.doesNotMatch(cue,/チーム名を設定|順位を教えて|今の得点を取り消して/);
});

test("スタッフと利用者向け説明資料に役割、ゲーム、安全案内がある",()=>{
 assert.match(guide,/利用者向け事前説明資料/);
 assert.match(guide,/それぞれの役割/);
 assert.match(guide,/7つのゲーム/);
 assert.match(guide,/利用者への説明例/);
 assert.match(guide,/見学・パス/);
 assert.match(guide,/個人情報/);
 assert.match(guide,/操作はスタッフがする/);
 assert.match(guide,/1人1分/);
 assert.match(cue,/game-guide\.html/);
});

test("完全アナログ版に全210問とゲーム別の進行情報がある",()=>{
 assert.match(analog,/完全アナログ版/);
 assert.equal((analog.match(/class="question(?:\s|\")/g)||[]).length,210);
 assert.equal((analog.match(/class="pattern"/g)||[]).length,21);
 assert.equal((analog.match(/class="evidence"/g)||[]).length,30);
 assert.equal((analog.match(/class="mode individual"/g)||[]).length,30);
 assert.equal((analog.match(/class="mode team"/g)||[]).length,30);
 for(const name of ["ぴったりシンクロ","おすすめプレゼン","ジェスチャー対決","もしも裁判","記者会見チャレンジ","どっちを選ぶ？","ぴったりチャレンジ"])assert.match(analog,new RegExp(name.replace("？","\\？")));
 assert.match(cue,/analog-game-book\.html/);
 assert.match(guide,/analog-game-book\.html/);
});
