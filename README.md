# サイ校・おバカ世界選手権 — AIゲーム版 v3

人間のスタッフが司会をし、アプリはスタッフと対話して、その場で新しいお題を作る「ゲーム相棒」です。決められた問題集や進行台本を順番に再生するアプリではありません。

公開URL: https://saiko-world-grand-prix.pages.dev/

## 機能

- 7種の固定されたゲームルールと、毎回異なるリアルタイムお題生成
- スタッフとのテキストチャット、簡易指示ボタン、対応ブラウザでの音声入力
- Cloudflare Workers AIによる新しいお題の生成と自然言語指示への対応
- ネットワーク障害・AI利用制限時も遊べる、端末内でのルールに沿った組み合わせ生成（AIではないことを画面に明示）
- どうでもよすぎる裁判所：新事件・新証拠・チーム役割交代・自動得点
- スタッフ画面とは別に、チャットを隠した観客向け大画面
- チーム名・得点・採点の取り消し・タイマー・緊急ニュース
- ホーム画面に追加できるPWA（スマホのブラウザ・OS対応に依存）

## 技術構成

- index.html / game-v3.js / game-v3.css：ゲーム画面とロジック
- functions/api/director.js：AI生成エンドポイント。AI呼び出しはサーバー側のみ
- wrangler.toml：Cloudflare Pages・Workers AIのAIバインディング
- manifest.webmanifest / saiko-icon.svg：アプリ表示とアイコン
- qa/studio.test.mjs / qa/director.test.mjs：自動テスト
- qa/live-deploy.mjs / qa/studio-live.mjs：公開後の動作検証

GitHub: selfwilled6412-cyber/saiko-name-tag-maker の saiko-world-grand-prix ブランチだけを変更。mainの名札アプリやBASE WORK HUBは変更しません。

## 無料運用と制限

Workers FreeのままCloudflare Pages・Workers AI無料割当を利用。2026年10月時点、Workers AIは1日10,000 Neuronsの無料割当を超えると無料プランでは追加推論が失敗します。自動課金契約は追加していません。生成失敗時には端末内で代替出題します。

## データとプライバシー

得点・チーム名・最近のお題は同じ端末のブラウザ内に保存。他端末とは同期しません。AI生成時はスタッフの入力文と直近5件のお題をCloudflare側のAIへ送ります。氏名や健康情報など個人情報を入力しないでください。