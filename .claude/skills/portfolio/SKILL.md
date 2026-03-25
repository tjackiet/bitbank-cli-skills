---
name: portfolio
description: |
  bitbank の保有資産と価格データから、ポートフォリオの現況を把握する。
  現在の資産構成、JPY建て資産推移、各銘柄の騰落率を計算する。
  「ポートフォリオの状況を見せて」「資産推移を見たい」「各銘柄の騰落率は？」
  「保有資産の比率を確認して」といったリクエストに対応します。
compatibility: |
  Requires bitbank CLI (npx tsx cli/index.ts). Node.js 18+.
  Private API commands require API key/secret in .env file.
metadata:
  author: bitbank-aiforge
  version: "2.0"
---

# ポートフォリオ Skill

## 前提: Private API の認証設定

Private API コマンド（`assets`）を使うには `.env` ファイルに API キーを設定する:

```
BITBANK_API_KEY=your_api_key
BITBANK_API_SECRET=your_api_secret
```

実行時は `--env-file=.env` を付ける:

```bash
npx tsx --env-file=.env cli/index.ts assets --format=json
```

**API キーがない場合:** ユーザーに設定方法を案内し、Public API（ticker, candles）だけで可能な分析を行う。

## 分析フロー

### Step 1: 保有資産の取得

```bash
npx tsx --env-file=.env cli/index.ts assets --format=json
```

### Step 2: 現在価格の取得

全 JPY ペアの ticker を一括取得:

```bash
npx tsx cli/index.ts tickers-jpy --format=json
```

### Step 3: 月次ローソク足の取得

保有銘柄ごとに月次ローソク足を取得する。年指定で1年分まとめて取れる:

```bash
npx tsx cli/index.ts candles btc_jpy --type=1month --date=2025 --format=json
npx tsx cli/index.ts candles btc_jpy --type=1month --date=2026 --format=json
```

複数年分が必要なら年ごとに並列取得する。

### Step 4: 計算・出力

取得データからモデルが以下を計算する。

## 出力項目

### 1. 現在の資産構成

保有資産・評価額・比率を一覧する。

```
=== 資産構成 ===

総評価額: 2,500,000 JPY

資産  | 保有量   | 評価額      | 比率
JPY  | 500,000 | 500,000    | 20.0%
BTC  | 0.15    | 1,387,500  | 55.5%
ETH  | 2.0     | 612,500    | 24.5%
```

- 評価額 = 保有量 × ticker の `last` 価格（JPY は 1）
- 比率 = 各資産の評価額 / 総評価額

### 2. JPY建て資産推移（月次・年次）

月次ローソク足の `close` と保有量から、各月末時点の評価額を算出する。
**保有量は現在値で固定**する（過去の保有量変動は追わない）。

```
=== 資産推移（月次） ===

月        | BTC評価額    | ETH評価額   | 合計         | 前月比
2025/01  | 1,200,000  | 540,000   | 2,240,000   | -
2025/02  | 1,350,000  | 570,000   | 2,420,000   | +8.0%
2025/03  | 1,387,500  | 612,500   | 2,500,000   | +3.3%
```

年次は各年12月の close（または最新月）で同様に算出する。

### 3. 各銘柄の月次騰落率・年次騰落率

月次ローソク足から価格ベースの騰落率を計算する。

```
=== 騰落率 ===

■ BTC/JPY
月        | 終値        | 月次騰落率
2025/01  | 8,000,000  | -
2025/02  | 9,000,000  | +12.5%
2025/03  | 9,250,000  | +2.8%

年次騰落率: 2024 → 2025: +XX.X%

■ ETH/JPY
...
```

- 月次騰落率 = (当月close - 前月close) / 前月close × 100
- 年次騰落率 = (当年12月close - 前年12月close) / 前年12月close × 100

## Gotchas

- **金額は文字列で返る。** `assets` の各フィールド、ticker の価格はすべて文字列。数値変換が必要
- **locked_amount に注意。** オーダー中の資産は `locked_amount` に入る。表示には `onhand_amount`（総量）を使う
- **JPY は ticker がない。** JPY の「価格」は常に 1。評価額 = 保有量そのもの
- **月次ローソク足の `--date` は年（YYYY）。** `--date=2025` で2025年の全月データが取れる
- **API エラー時は `references/bitbank-api-formats.md` を参照**
- **20001 エラー（認証失敗）** → `.env` の設定を確認するようユーザーに案内
