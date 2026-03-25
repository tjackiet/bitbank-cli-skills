---
name: indicator-analysis
description: |
  bitbank の暗号資産ローソク足データからテクニカル指標を計算・分析する。
  SMA、RSI、MACD、ボリンジャーバンド等の指標をモデルが直接計算し、
  パラメータも自由にカスタマイズ可能。
  暗号資産の価格分析、テクニカル分析、指標計算、チャート分析、
  トレンド判定、売買判断に関する質問があったときに使用してください。
  「BTC の RSI を見て」「移動平均のクロスを確認して」「ボリバンのスクイーズは？」
  といったリクエストにも対応します。
compatibility: |
  Requires bitbank CLI (npx tsx cli/index.ts). Node.js 18+.
metadata:
  author: bitbank-aiforge
  version: "1.0"
---

# テクニカル指標分析 Skill

## データ取得

ローソク足データを CLI で取得する:

```bash
npx tsx cli/index.ts candles <pair> --type=<timeframe> --format=json
```

例:
```bash
# BTC/JPY の日足を取得
npx tsx cli/index.ts candles btc_jpy --type=1day --format=json

# ETH/JPY の4時間足、特定日
npx tsx cli/index.ts candles eth_jpy --type=4hour --date=20240301 --format=json

# データ件数を指定（デフォルト100件）
npx tsx cli/index.ts candles btc_jpy --type=1hour --limit=200 --format=json
```

`--format=json` を使う。JSON はモデルがパースしやすいため。

## デフォルト分析セット

ユーザーが指標を指定しない場合、以下をすべて計算する:

- **SMA**: 20, 50, 200 期間
- **RSI**: 14 期間
- **MACD**: 短期 12, 長期 26, シグナル 9
- **ボリンジャーバンド**: 20 期間, 2σ

ユーザーが特定の指標やパラメータを指定した場合はそちらを優先する。

## 実行手順

1. `candles` コマンドで OHLCV データを取得
2. JSON レスポンスから `data.candlestick[0].ohlcv` 配列を取り出す
3. 各要素は `[open, high, low, close, volume, timestamp]`（open〜volume は文字列 → 数値変換する）
4. 配列は古い順。末尾が最新
5. デフォルト分析セット（または指定された指標）を計算
6. 結果をテーブル形式で表示し、サマリーを付ける

## 出力フォーマット

### テーブル形式（最新5〜10本分）

```
日付        | 終値       | SMA20      | SMA50      | RSI(14) | MACD    | Signal  | BB上限     | BB下限
2024-03-01 | 9,250,000 | 9,100,000 | 8,900,000 | 62.3    | 15,200  | 12,800  | 9,400,000 | 8,800,000
...
```

### サマリー

計算結果に基づいて以下を述べる:
- 現在のトレンド方向（SMA の位置関係から）
- RSI の水準（過熱/中立/売られすぎ）
- MACD のクロス状況
- ボリンジャーバンドの幅（スクイーズ/エクスパンション）

## Gotchas

- **価格は文字列で返る。** `ohlcv[0]`（open）等は `"9250000"` のような文字列。必ず `parseFloat()` 相当の数値変換をしてから計算すること
- **配列は古い順。** 先頭がいちばん古い。最新データは末尾
- **日付形式に注意。** `--type=1month` のときは `--date=2024`（年のみ）。それ以外は `--date=20240101`（YYYYMMDD）
- **十分なデータが必要。** SMA(200) を計算するには 200 本以上のデータが必要。`--limit=300` 等で多めに取得する
- **API がエラーを返した場合は `references/bitbank-api-formats.md` を読んでエラーコードを確認する**
- **1回のリクエストで取得できる最大件数に注意。** 足りない場合は `--date` を変えて複数回取得し、結合する
