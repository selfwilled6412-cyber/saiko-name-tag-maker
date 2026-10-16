"""Generate the preset host's cloud-hosted Japanese speech assets.

Run from the repository root after installing edge-tts:
    python -m pip install edge-tts
    python tools/generate_preset_audio.py
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import re
from pathlib import Path

import edge_tts


ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "preset-game-data.js"
OUTPUT_DIR = ROOT / "audio" / "preset"
MANIFEST_FILE = ROOT / "preset-audio-manifest.js"
VOICE = "ja-JP-KeitaNeural"
RATE = "+2%"
PITCH = "-2Hz"

META = {
    "sync": {
        "mode": "team",
        "explain": "ぴったりシンクロは、二人一組のチーム戦です。二人で相談せず、二つの選択肢から一つを選びます。私が、せーの、と言ったら二人同時に答えてください。答えが同じならシンクロ成功です。",
    },
    "pitch": {
        "mode": "individual",
        "explain": "おすすめプレゼンは個人戦です。身近な物を、とびきり魅力的な商品として一分間で紹介してください。判定は、魅力、分かりやすさ、発想や工夫の三項目です。それぞれ二点、合計六点満点です。",
    },
    "mime": {
        "mode": "team",
        "explain": "ジェスチャー対決は、二人一組のチーム戦です。一人がお題を言葉や声を使わずに表現し、もう一人が答えます。一チームにつき二問で、一問ごとに役割を交代します。三問目からは次のチームです。お題は演じる人だけに秘密で伝えます。",
    },
    "court": {
        "mode": "individual",
        "explain": "もしも裁判は個人戦です。挑戦者は、有罪か無罪かを選び、理由を説明してください。最初の意見のあと、スタッフが、新しい証拠お願いします、と言うと、追加の証拠を発表します。証拠を聞いたあと、最終判決と理由を発表してください。",
    },
    "press": {
        "mode": "individual",
        "explain": "記者会見チャレンジは個人戦です。一人につき一問、思いがけない質問に答えてください。質問を聞いたら五秒以内に話し始めます。はい、いいえ、分かりません、だけで終わらせず、その場で理由や物語を作ってください。二問目は二人目が挑戦します。",
    },
    "choice": {
        "mode": "team",
        "explain": "どっちを選ぶ、は二人一組のチーム戦です。二つの選択肢から、チームで一つを選んでください。相談して決めたら、選んだ答えと理由を発表します。正解はありません。なるほどと思わせる理由や、楽しい使い方を考えましょう。",
    },
    "challenge": {
        "mode": "individual",
        "explain": "ぴったりチャレンジは、時間や長さなどを、自分の感覚で目標に近づけるゲームです。目標との差がいちばん小さい人、またはチームが勝ちです。スタッフが安全を確認し、必要な計測を行ってください。",
    },
}


def load_games() -> list[dict]:
    source = DATA_FILE.read_text(encoding="utf-8")
    match = re.search(r"window\.SAIKO_PRESET_GAMES\s*=\s*(\[[\s\S]*\])\s*;?\s*$", source)
    if not match:
        raise RuntimeError("Could not read preset game data")
    return json.loads(match.group(1))


def clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def audio_name(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:20] + ".mp3"


def collect_phrases(games: list[dict]) -> list[str]:
    phrases: set[str] = {
        "タップを確認しました。マイクを準備します。",
        "こんにちは。サイ校ゲームを、いっしょに楽しみましょう。",
        "こんにちは。サイ校ゲーム、プリセット確認版です。遊びたいゲーム名、パターン1、スタート、のように言ってください。例えば、ぴったりシンクロ、パターン1、スタート、です。",
        "マイクの準備ができませんでした。Chromeでマイクを許可してから、画面を長押しして、マイク再開か文字入力を使ってください。",
        "このブラウザでは音声認識を使えません。画面を長押しすると、文字入力で操作できます。",
        "マイクを使えないみたいです。画面を長押しして、文字入力またはマイク再開を使ってください。",
        "先に、ゲーム名とパターンを指定してスタートしてください。",
        "現在は、ジェスチャーのお題待ちではありません。",
        "それでは、ジェスチャー、スタート。",
        "今のお題には、追加の証拠はありません。",
        "ぴったりチャレンジは、個人戦かチーム戦も付けて、もう一度言ってください。",
        "まだ読み上げた内容はありません。",
        "現在、お題は始まっていません。",
        "現在、選ばれているゲームはありません。",
        "これより前のお題はありません。",
        "最初は、一問目スタート、と言ってください。",
        "ゲーム名、パターン1、スタート、のように言ってください。",
        "その操作は分かりませんでした。ゲーム名とパターン、または、次のお題お願いします、のように入力してください。",
        "確認版を初期化しました。ゲーム名、パターン1、スタート、のように言ってください。",
        "おかえりなさい。前回の続きです。始めるときは、一問目スタート、と言ってください。",
    }
    for number in range(1, 11):
        phrases.add(f"今は、第{number}問です。")
        phrases.add(f"おかえりなさい。前回の続きです。今は第{number}問です。続けるときは、次のお題お願いします、と言ってください。")
        phrases.add(f"ゲームはすでに進行中です。今は第{number}問です。もう一度聞くときは、もう一度。次に進むときは、次のお題お願いします、と言ってください。")

    for game in games:
        game_id = game["id"]
        name = game["name"]
        config = META[game_id]
        phrases.add(f"{name}ですね。パターン1、パターン2、パターン3のどれかを付けて、もう一度言ってください。")
        phrases.add(f"{name}を終了しました。次に遊ぶときは、ゲーム名、パターン、スタート、と言ってください。")
        for pattern in (1, 2, 3):
            phrases.add(f"これで第十問まで終了です。お疲れさまでした。{name}、パターン{pattern}は終了です。次に遊ぶときは、ゲーム名、パターン、スタート、と言ってください。")
            phrases.add(f"現在は、{name}、パターン{pattern}です。一問目スタート、次のお題お願いします、もう一度、前のお題、今は何問目、このゲームを終了、が使えます。")
            modes = ("individual", "team") if game_id == "challenge" else (config["mode"],)
            for mode in modes:
                explanation = config["explain"]
                if game_id == "challenge":
                    label = "チーム戦" if mode == "team" else "個人戦"
                    explanation = f"ぴったりチャレンジ、{label}です。{explanation}"
                phrases.add(f"了解しました。{name}、パターン{pattern}を始めます。最初にルールを説明します。{explanation}以上で説明は終わりです。準備ができたら、一問目スタート、と言ってください。")

                for index, item in enumerate(game["patterns"][str(pattern)]):
                    number = index + 1
                    if game_id == "mime":
                        team = index // 2 + 1
                        within = index % 2 + 1
                        turn = f"{team}チーム目の一問目です。" if within == 1 else f"{team}チーム目の二問目です。演じる人と答える人を交代してください。"
                        phrases.add(f"{turn}答える人は、耳をふさいで後ろを向くか、音が聞こえない場所へ移動してください。準備ができたら、お題をお願いします、と言ってください。")
                        phrases.add(f"{item['prompt']}お題を確認しました。答える人が戻ったら、ゲームスタート、と言ってください。")
                        continue

                    if game_id == "court":
                        body = f"{item['prompt']}まず、有罪か無罪かと、その理由を発表してください。意見を発表したあと、スタッフは、新しい証拠お願いします、と言ってください。"
                        phrases.add(f"新しい証拠です。{item['evidence']}以上が新しい証拠です。判決を変えてもかまいません。最終判決と、その理由をお願いします。")
                    elif game_id == "challenge":
                        body = item["team"] if mode == "team" else item["individual"]
                    else:
                        body = item["prompt"]
                    person = f"{number}人目の挑戦です。" if game_id == "press" else ""
                    phrases.add(f"第{number}問です。{person}{body}それでは、スタート。")

    return sorted(clean(text) for text in phrases if clean(text))


async def generate_one(text: str, semaphore: asyncio.Semaphore) -> tuple[str, str]:
    file_name = audio_name(text)
    output = OUTPUT_DIR / file_name
    if not output.exists() or output.stat().st_size < 1000:
        async with semaphore:
            temporary = output.with_suffix(".tmp.mp3")
            for attempt in range(3):
                try:
                    await edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH).save(str(temporary))
                    temporary.replace(output)
                    break
                except Exception:
                    temporary.unlink(missing_ok=True)
                    if attempt == 2:
                        raise
                    await asyncio.sleep(1.5 * (attempt + 1))
    return text, f"/audio/preset/{file_name}"


async def main() -> None:
    games = load_games()
    phrases = collect_phrases(games)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    semaphore = asyncio.Semaphore(4)
    completed = 0

    async def tracked(text: str) -> tuple[str, str]:
        nonlocal completed
        result = await generate_one(text, semaphore)
        completed += 1
        if completed % 25 == 0 or completed == len(phrases):
            print(f"generated {completed}/{len(phrases)}")
        return result

    pairs = await asyncio.gather(*(tracked(text) for text in phrases))
    manifest = {text: path for text, path in sorted(pairs)}
    payload = json.dumps(manifest, ensure_ascii=False, separators=(",", ":"))
    MANIFEST_FILE.write_text(
        "// Generated by tools/generate_preset_audio.py\n"
        f"window.SAIKO_PRESET_AUDIO=Object.freeze({payload});\n",
        encoding="utf-8",
    )
    total_bytes = sum(path.stat().st_size for path in OUTPUT_DIR.glob("*.mp3"))
    print(f"ready: {len(manifest)} phrases, {total_bytes / 1024 / 1024:.1f} MiB")


if __name__ == "__main__":
    asyncio.run(main())
