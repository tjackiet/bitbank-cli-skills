# bitbank CLI & Agent Skills

bitbank 暗号資産取引所の CLI と Agent Skills スターターキット。

## 設計思想

CLI は bitbank API への**薄いアクセス層**。分析ロジックは一切持たせていません。  
Skills を編集・追加する等、ご自身の用途に合わせてカスタマイズしてください。

- **MCP サーバー** ([bitbank-genesis-mcp-server](https://github.com/tjackiet/bitbank-genesis-mcp-server)) はサーバー側で計算済みの結論を LLM に渡す
- **この CLI** は生データを高速に取得し、LLM 自身に計算させる

同じ bitbank API に対して、真逆のアプローチを提供します。モデルに生 OHLCV を渡せば、指標のパラメータもロジックも完全にカスタマイズ可能。MCP の固定実装では対応できない「自分だけの指標」が作れます。

## 想定する使い方

このプロジェクトは npm パッケージとしては配布していません。**リポをクローンして、自分の環境で使う**スタイルです。

1. **Claude Code から自然言語で操作する** — メインの使い方。Agent Skills が CLI コマンドを組み合わせて分析・取引を実行します
2. **ターミナルから直接 CLI を叩く** — データの確認やスクリプトとの連携に
3. **Skills を自分用にカスタマイズする** — `.claude/skills/` 以下を編集・追加して、自分だけの分析フローを作れます

Skills は利用者が自由に追加・編集していくものなので、リポごと手元に持つ必要があります。

## セットアップ

### 1. クローンとインストール

```bash
git clone https://github.com/tjackiet/bitbank-cli-skills.git
cd bitbank-cli-skills
npm install
```

### 2. Public API を試す（認証不要）

```bash
npx bitbank ticker btc_jpy
npx bitbank candles btc_jpy --type=1day --format=table
```

### 3. API キーを設定する（Private API / Trade 用）

```bash
cp .env.example .env
# .env を編集して BITBANK_API_KEY / BITBANK_API_SECRET を設定
```

```bash
npx tsx --env-file=.env cli/index.ts assets
npx tsx --env-file=.env cli/index.ts active-orders --pair=btc_jpy
```

> `.env` は `.gitignore` に含まれています。API キーは絶対にコミットしないでください。

### 4. Claude Code で使う

Claude Code でこのリポを開くと、Agent Skills が自動で有効になります。

```text
「BTC の RSI を見て」
「ポートフォリオの状況を見せて」
「SMA クロス戦略をバックテストして」
```

## コマンド一覧

### Public（認証不要）

| コマンド | 説明 | 使用例 |
|---------|------|--------|
| `ticker` | 単一ペアのティッカー | `npx bitbank ticker btc_jpy` |
| `tickers` | 全ペア一括ティッカー | `npx bitbank tickers` |
| `tickers-jpy` | 全JPYペア一括 | `npx bitbank tickers-jpy` |
| `depth` | 板情報（asks/bids） | `npx bitbank depth btc_jpy` |
| `transactions` | 約定履歴 | `npx bitbank transactions btc_jpy` |
| `candles` | ローソク足 OHLCV | `npx bitbank candles btc_jpy --type=1day` |
| `circuit-break` | サーキットブレーカー | `npx bitbank circuit-break btc_jpy` |
| `status` | 取引所ステータス | `npx bitbank status` |
| `pairs` | ペア設定情報 | `npx bitbank pairs` |

### Private（要認証）

| コマンド | 説明 | 使用例 |
|---------|------|--------|
| `assets` | 保有資産一覧 | `assets --format=table` |
| `order` | 注文情報照会 | `order --pair=btc_jpy --order-id=123` |
| `orders-info` | 複数注文照会 | `orders-info --pair=btc_jpy --order-ids=1,2,3` |
| `active-orders` | アクティブ注文 | `active-orders --pair=btc_jpy` |
| `trade-history` | 約定履歴 | `trade-history --pair=btc_jpy` |
| `deposit-history` | 入金履歴 | `deposit-history --asset=btc` |
| `unconfirmed-deposits` | 未確認入金 | `unconfirmed-deposits` |
| `deposit-originators` | 入金元情報 | `deposit-originators --asset=btc` |
| `withdrawal-accounts` | 出金先一覧 | `withdrawal-accounts --asset=btc` |
| `withdrawal-history` | 出金履歴 | `withdrawal-history --asset=btc` |
| `margin-status` | 証拠金ステータス | `margin-status` |
| `margin-positions` | ポジション情報 | `margin-positions --pair=btc_jpy` |

### Trade（資金操作 — ドライランデフォルト）

Trade コマンドは `bitbank trade <subcommand>` の形で呼び出します（誤爆防止のため public/private とは階層を分けています）。

| コマンド | 説明 | 使用例 |
|---------|------|--------|
| `trade create-order` | 新規注文 | `trade create-order --pair=btc_jpy --side=buy --type=limit --price=9000000 --amount=0.001` |
| `trade cancel-order` | 注文キャンセル | `trade cancel-order --pair=btc_jpy --order-id=123` |
| `trade cancel-orders` | 一括キャンセル | `trade cancel-orders --pair=btc_jpy --order-ids=1,2,3` |
| `trade confirm-deposits` | 入金確認 | `trade confirm-deposits --id=456` |
| `trade confirm-deposits-all` | 全入金確認 | `trade confirm-deposits-all` |
| `trade withdraw` | 出金リクエスト | `trade withdraw --asset=btc --uuid=xxx --amount=0.1 --execute --confirm` |

> Trade コマンドは `--execute` を付けない限り API を叩きません（ドライラン）。`withdraw` は追加で `--confirm` も必須です。サブコマンド一覧は `npx bitbank trade` で表示できます。

### Stream（リアルタイム）

```bash
# Public: ティッカー・約定・板のリアルタイム配信
npx bitbank stream btc_jpy

# チャンネル指定
npx bitbank stream btc_jpy --channel=transactions

# Private: ユーザーデータのリアルタイム配信
npx tsx --env-file=.env cli/index.ts stream --private --pair=btc_jpy
```

## 出力フォーマット

全コマンドで `--format` オプションが使えます:

```bash
npx bitbank ticker btc_jpy --format=json   # デフォルト
npx bitbank ticker btc_jpy --format=table  # 見やすいテーブル
npx bitbank ticker btc_jpy --format=csv    # パイプ・インポート向け
```

```bash
# jq でフィルタ
npx bitbank ticker btc_jpy | jq '.last'

# CSV をファイルに保存
npx bitbank candles btc_jpy --type=1day --format=csv > btc_daily.csv
```

## Agent Skills

Claude Code / Cursor 等のエージェント環境で自動的にトリガーされる Skill を7つ搭載しています。Skill はモデルへの指示書であり、CLI コマンドを組み合わせて分析や取引を実行します。
あくまでサンプルですので、ご自身の用途に合わせて追加・編集してください。

共通の参照資料（`bitbank-api-formats.md` 等）は `.claude/skills/_shared/references/` に集約しており、各 Skill から参照されます。

### indicator-analysis

テクニカル指標を計算・分析。SMA、RSI、MACD、ボリンジャーバンド、ATR、ROC 等。

```
「BTC の RSI を見て」
「移動平均のクロスを確認して」
「ETH の4時間足でテクニカル分析して」
```

### backtest

トレーディング戦略のバックテスト。SMA クロス、RSI 逆張り等を過去データでシミュレーション。

```
「SMA クロス戦略をバックテストして」
「過去1年の BTC で RSI 逆張りの成績は？」
「複数の戦略を比較して」
```

### portfolio

保有資産のポートフォリオ分析。資産構成・JPY 建て評価額・推移。

```
「ポートフォリオの状況を見せて」
「資産推移を見たい」
「保有資産の比率を確認して」
```

### volatility-profile

リターン分布の歪度・尖度・ファットテール倍率、時間帯別出来高、√T スケーリングなどリスク特性を定量化。

```
「BTC のボラどう？」
「ファットテール度は？」
「ストップ幅どう決める？」
```

### signal-explorer

シグナル候補の予測力を評価。生データ vs 将来リターン相関、Z-score 改善度、ラグ相関、自己相関、既存指標との冗長性、符号ベース簡易 PnL。

```
「RSI、本当に効く？」
「この指標に予測力ある？」
「自作のシグナルを評価して」
```

### correlation-analysis

複数銘柄間の関係性を定量化。Pearson / Spearman 相関、β 行列、ローリング相関、環境別（上昇 / 下落）相関、ラグ相関。

```
「BTC-ETH の相関は？」
「分散投資効果はある？」
「ETH の β は？」
```

### data-verification

ローソク足データの品質検証。欠損足の検出、OHLCV 整合性、異常値、重複検出。

```
「データ検証して」
「欠損ないか確認して」
「品質チェックして」
```

### 独自 Skill の追加

`.claude/skills/<name>/SKILL.md` を作成するだけで独自 Skill を追加できます。詳細は [カスタマイズガイド](docs/customization-guide.md) を参照してください。

## ⚠️ 免責事項

本 CLI ツールが提供するデータを AI エージェントが受け取り処理した結果は、必ずしも正確性・完全性を保証するものではありません。

提供される情報は情報提供のみを目的としており、投資助言・代理業に該当するものではありません。投資に関する判断はご自身の責任で行ってください。

## フィードバック

バグ報告・機能リクエストは [GitHub Issues](https://github.com/tjackiet/bitbank-cli-skills/issues) へお願いします。

## 開発

```bash
npm test          # テスト実行
npm run lint      # Biome lint
npm run typecheck # 型チェック
```

### アーキテクチャ

```
cli/
  index.ts              # サブコマンドルーター
  output.ts             # json/table/csv フォーマッター
  types.ts              # Result<T> 型定義
  http.ts               # Public API クライアント
  http-private.ts       # Private GET（HMAC 認証）
  http-private-post.ts  # Private POST（HMAC 認証）
  auth.ts               # HMAC-SHA256 署名
  commands/
    public/             # 認証不要コマンド（9）
    private/            # 認証必要・読み取り専用（13）
    trade/              # 資金操作・ドライランデフォルト（6）
    stream.ts           # リアルタイムストリーム
  __tests__/            # 全コマンドのテスト（37ファイル / 140テスト）
.claude/skills/         # Agent Skills（7本 + _shared/references/）
docs/                   # ADR・フェーズ管理・カスタマイズガイド
```
