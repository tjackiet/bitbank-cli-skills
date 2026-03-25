---
name: portfolio
description: |
  bitbank の保有資産を分析し、損益計算・リバランス提案を行う。
  現在の保有資産、取引履歴、現在価格を組み合わせて
  ポートフォリオ全体の状況を把握する。
  「ポートフォリオの状況を見せて」「今の損益は？」「リバランスすべき？」
  「保有資産の比率を確認して」「取引履歴から平均取得単価を計算して」
  といったリクエストに対応します。
compatibility: |
  Requires bitbank CLI (npx tsx cli/index.ts). Node.js 18+.
  Private API commands require API key/secret in .env file.
metadata:
  author: bitbank-aiforge
  version: "1.0"
---

# ポートフォリオ分析 Skill

## 前提: Private API の認証設定

Private API コマンド（`assets`, `trade-history`）を使うには `.env` ファイルに API キーを設定する必要がある:

```
BITBANK_API_KEY=your_api_key
BITBANK_API_SECRET=your_api_secret
```

Private API コマンドは `--env-file=.env` 付きで実行する:

```bash
npx tsx --env-file=.env cli/index.ts assets --format=json
```

**API キーがない場合:** ユーザーに設定方法を案内し、Public API（ticker）だけで可能な分析を行う。

## 分析フロー

### Step 1: 保有資産の取得

```bash
npx tsx --env-file=.env cli/index.ts assets --format=json
```

全資産（残高ゼロを含む）を取得する場合:
```bash
npx tsx --env-file=.env cli/index.ts assets --all --format=json
```

### Step 2: 取引履歴・入出金履歴の取得（損益計算に必要）

保有している各ペアについて取引履歴を取得:

```bash
npx tsx --env-file=.env cli/index.ts trade-history --pair=btc_jpy --all --format=json
npx tsx --env-file=.env cli/index.ts trade-history --pair=eth_jpy --all --format=json
```

入出金履歴を取得（コストベース計算の精度向上に必要）:

```bash
npx tsx --env-file=.env cli/index.ts deposit-history --asset=btc --format=json
npx tsx --env-file=.env cli/index.ts deposit-history --asset=eth --format=json
npx tsx --env-file=.env cli/index.ts withdrawal-history --asset=btc --format=json
npx tsx --env-file=.env cli/index.ts withdrawal-history --asset=eth --format=json
```

### Step 3: 現在価格の取得

```bash
npx tsx cli/index.ts ticker btc_jpy --format=json
npx tsx cli/index.ts ticker eth_jpy --format=json
```

または全ペア一括:
```bash
npx tsx cli/index.ts tickers-jpy --format=json
```

### Step 4: 計算・分析

取得したデータからモデルが以下を計算する:

1. **保有比率:** 各資産の評価額 / ポートフォリオ合計
2. **平均取得単価:** 取引履歴と入出金履歴から算出（下記ルール参照）
3. **評価損益:** (現在価格 - 平均取得単価) × 保有量
4. **損益率:** 評価損益 / 投資額 × 100

#### 平均取得単価の計算ルール（入出金考慮）

1. **取引所内での購入分:** 取引履歴の buy レコードから加重平均で取得単価を算出
2. **外部入金分（deposit-history）:** 取得単価不明として扱う。以下のいずれかで対処:
   - ユーザーが取得単価を知っている場合 → ユーザーに確認して手動指定
   - 不明な場合 → 入金時点の市場価格（ticker）を参考値として使用し、「推定値」と明示する
   - 入金量は保有量に加算するが、コストベースの確度が下がる旨を注記する
3. **出金分（withdrawal-history）のコストベース調整:**
   - 出金時点までの平均取得単価で出金量分のコストを差し引く
   - 調整後コストベース = 調整前コストベース - (出金量 × 出金時点の平均取得単価)
   - 出金後の平均取得単価自体は変わらない（単価は同じまま、数量とコスト総額が減る）
4. **計算順序:** 取引・入金・出金をすべて時系列順に並べ、古い順に処理する

## デフォルト分析項目

ユーザーが特に指定しない場合、以下をすべて出力する:

### ポートフォリオサマリー

```
=== ポートフォリオサマリー ===

総評価額: 2,500,000 JPY

資産     | 保有量      | 評価額       | 比率   | 平均取得単価  | 現在価格     | 損益         | 損益率
JPY     | 500,000    | 500,000     | 20.0% | -            | -           | -           | -
BTC     | 0.15       | 1,387,500   | 55.5% | 8,500,000    | 9,250,000   | +112,500    | +8.8%
ETH     | 2.0        | 612,500     | 24.5% | 280,000      | 306,250     | +52,500     | +9.4%

--- 全体損益 ---
投資額合計:   2,335,000 JPY
評価額合計:   2,500,000 JPY
総損益:       +165,000 JPY (+7.1%)
```

### リバランス提案

現在の比率と目標比率（均等配分、または時価総額比例）を比較し、調整案を提示する。

## Gotchas

- **金額は文字列で返る。** `assets` の `onhand_amount`, `locked_amount` 等はすべて文字列。数値変換が必要
- **取引履歴は `--all` で全件取得する。** `trade-history --all` は自動ページネーションで1000件超の履歴も全件取得する。期間を絞りたい場合は `--since` / `--end` と併用可能
- **maker/taker 手数料の区別。** 取引履歴の `fee_amount_base` と `fee_amount_quote` で手数料がわかる。損益計算に含めること
- **locked_amount に注意。** オーダー中の資産は `locked_amount` に入る。実際に使える量は `free_amount`
- **API がエラーを返した場合は `references/bitbank-api-formats.md` を読んでエラーコードを確認する**
- **20001 エラー（認証失敗）が出たら:** `.env` ファイルの設定を確認するようユーザーに案内する
- **JPY は ticker がない。** JPY の「価格」は常に 1。評価額 = 保有量そのもの
