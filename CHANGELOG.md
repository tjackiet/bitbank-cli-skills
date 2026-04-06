# Changelog

[Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) 形式で管理しています。  
[Semantic Versioning](https://semver.org/lang/ja/) に準拠します。

## [Unreleased]

## [0.1.0] - 2026-04-06

初回リリース。CLI 基盤・全 API コマンド・Agent Skills を一通り実装。

### Added

- **CLI 基盤**: サブコマンドルーター、json/table/csv 出力フォーマッター
- **Public API コマンド (9)**: ticker, tickers, tickers-jpy, depth, transactions, candles, circuit-break, status, pairs
- **Private API コマンド (13)**: assets, order, orders-info, active-orders, trade-history, deposit-history, unconfirmed-deposits, deposit-originators, withdrawal-accounts, withdrawal-history, margin-status, margin-positions, schema
- **Trade コマンド (6)**: create-order, cancel-order, cancel-orders, confirm-deposits, confirm-deposits-all, withdraw
- **安全設計**: `--execute` ドライランデフォルト、`withdraw` は `--confirm` 必須
- **HMAC-SHA256 認証**: Private/Trade API 向け署名生成
- **リアルタイムストリーム**: PubNub / Socket.IO による ticker・transactions・depth 配信
- **Agent Skills (3)**: indicator-analysis, backtest, portfolio
- **candles 拡張**: `--limit` 年跨ぎ自動結合、`--from`/`--to` 日付範囲指定、ローカルキャッシュ
- **HTTP 基盤**: レートリミット対応（Retry-After + 指数バックオフ）、タイムアウト制御、exit code 体系
- **DX 向上**: `--raw` 1行JSON出力、`--machine` モード、`--profile` 複数アカウント切替、サブコマンド別ヘルプ
- **開発環境**: Biome lint、lefthook pre-commit、GitHub Actions CI、vitest カバレッジ閾値
- **Trade ログ**: NDJSON 形式の取引ログ記録
- **レートリミット情報**: レスポンスヘッダから抽出しResultに含める

### Security

- ドライラン出力で 2FA トークンをマスク
- `.env` を `.gitignore` に含め API キー漏洩を防止

[Unreleased]: https://github.com/tjackiet/bitbank-cli-skills/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/tjackiet/bitbank-cli-skills/releases/tag/v0.1.0
