# 開発フェーズ管理

> 各フェーズのタスクチェックリスト。次のセッションで「何をやるか」が一目でわかるようにする。

---

## Phase 0: プロジェクト初期セットアップ ✅

- [x] CLAUDE.md 作成
- [x] package.json 作成
- [x] .gitignore 作成
- [x] README.md 作成
- [x] ADR-001: CLI と MCP サーバーの分離
- [x] ADR-002: CLI に分析ロジックを持たない
- [x] docs/phases.md 作成

---

## Phase 1: CLI 基盤 + Public API コマンド（9コマンド）

**リスクレベル:** なし
**成果物:** `cli/index.ts`, `cli/output.ts`, `cli/commands/public/*.ts`
**ドッグフーディング基準:** セットアップ手順書なしで `clone → npx bitbank ticker btc_jpy` が動くこと

### 基盤

- [ ] `cli/index.ts` — サブコマンドルーター（エントリーポイント）
- [ ] `cli/output.ts` — 出力フォーマッター（json/table/csv）
- [ ] Public API クライアント共通処理
- [ ] npm install → npx bitbank --help が動作する

### コマンド

- [ ] `ticker` — 単一ペアのティッカー（価格・24h高安・出来高）
- [ ] `tickers` — 全ペア一括ティッカー
- [ ] `tickers-jpy` — 全JPYペア一括ティッカー
- [ ] `depth` — 板情報（asks/bids 生データ）
- [ ] `transactions` — 約定履歴（直近60件 or 日付指定）
- [ ] `candles` — ローソク足OHLCV（全11時間軸）
- [ ] `circuit-break` — サーキットブレーカー状態
- [ ] `status` — 取引所ステータス
- [ ] `pairs` — 全ペア設定情報（手数料・制限値等）

### テスト

- [ ] 各コマンドのユニットテスト（API モック使用）
- [ ] 出力フォーマッターのテスト（json/table/csv）

---

## Phase 2: HMAC認証基盤 + Private API 読み取り系（12コマンド）

**リスクレベル:** APIキー漏洩のみ
**成果物:** `cli/auth.ts`, `cli/commands/private/*.ts`
**ドッグフーディング基準:** APIキー設定 → `npx bitbank assets` で残高表示まで5分以内

### 基盤

- [ ] `cli/auth.ts` — HMAC-SHA256 認証
- [ ] APIキー設定の仕組み（環境変数 or 設定ファイル）

### コマンド

- [ ] `assets` — 保有資産一覧
- [ ] `order` — 注文情報照会（単一）
- [ ] `orders-info` — 複数注文一括照会
- [ ] `active-orders` — アクティブ注文一覧
- [ ] `trade-history` — 約定履歴（maker/taker・手数料込み）
- [ ] `deposit-history` — 入金履歴
- [ ] `unconfirmed-deposits` — 未確認入金一覧
- [ ] `deposit-originators` — 入金元情報
- [ ] `withdrawal-accounts` — 出金先アカウント一覧
- [ ] `withdrawal-history` — 出金履歴
- [ ] `margin-status` — 証拠金取引ステータス
- [ ] `margin-positions` — ポジション情報

### テスト

- [ ] 認証ロジックのユニットテスト
- [ ] 各コマンドのユニットテスト（API モック使用）

---

## Phase 3: 注文・出金コマンド（6コマンド）

**リスクレベル:** 資金操作
**成果物:** `cli/commands/trade/*.ts`, dry-run/confirm 機構
**ドッグフーディング基準:** 誤発注が構造的に不可能であること（Jackie が自分で検証）

### 基盤

- [ ] dry-run / --execute 機構の実装
- [ ] --confirm インタラクティブ確認の実装

### コマンド

- [ ] `create-order` — 新規注文（--dry-run デフォルト、--execute で実行）
- [ ] `cancel-order` — 注文キャンセル
- [ ] `cancel-orders` — 複数注文一括キャンセル（最大30件）
- [ ] `confirm-deposits` — 入金確認
- [ ] `confirm-deposits-all` — 全入金確認
- [ ] `withdraw` — 出金リクエスト（--execute + --confirm 必須）

### テスト

- [ ] dry-run モードのテスト（API が呼ばれないことを検証）
- [ ] --execute フラグなしで API が呼ばれないことを検証
- [ ] 各コマンドのユニットテスト（API モック使用）

---

## Phase 4: Stream — PubNub リアルタイムデータ（2コマンド）

**リスクレベル:** なし
**成果物:** `cli/stream.ts`, `cli/commands/stream.ts`

### 技術的注意

- Private Stream の PubNub トークンは12時間で失効（自動再取得が必要）
- PubNub メッセージの到着順序は保証されない

### コマンド

- [ ] `stream` — Public Stream（PubNub、リアルタイム板・約定・ティッカー）
- [ ] `stream --private` — Private Stream（ユーザーデータのリアルタイム配信）

### テスト

- [ ] PubNub 接続・再接続のテスト（モック使用）

---

## Phase 5: Agent Skills（3本）+ references + カスタマイズガイド

**成果物:** `.claude/skills/*/SKILL.md`, README 拡充
**ドッグフーディング基準:** Claude Code / Cursor で Skills が正しくトリガーされること

### Skills

- [x] `indicator-analysis` — 生OHLCVからモデルに任意の指標を計算させる
- [x] `backtest` — ストラテジーをモデルに定義・シミュレーションさせる
- [x] `portfolio` — 保有資産の損益分析・リバランス提案

### ドキュメント

- [x] references（API リファレンス等）
- [ ] カスタマイズガイド
- [ ] README 拡充
