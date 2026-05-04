# Changelog

[Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) 形式で管理しています。  
[Semantic Versioning](https://semver.org/lang/ja/) に準拠します。

## [Unreleased]

### Breaking Changes

- `--profile=<name>` で読み込まれる `.env.<profile>` ファイルから、
  `BITBANK_*` 以外の env 変数が反映されなくなった。それ以外のキーが
  含まれる場合は stderr に警告を出して無視する。
  これは profile 経由の任意 env 上書き（`NODE_OPTIONS` など）による
  コード実行リスクを断つための安全側の変更。
- プロファイル名の許容文字を `^[A-Za-z0-9._-]+$` に厳格化。
  先頭ドットのプロファイル名（`.hidden` など）も拒否される。

### Added

- `volatility-profile` skill: リターン分布・ファットテール・時間帯別出来高などリスク特性を定量化
- `signal-explorer` skill: シグナル候補の予測力評価（相関・Z-score・ラグ相関・冗長性チェック）
- `correlation-analysis` skill: 複数銘柄間の相関・β・環境別相関・ラグ相関
- `data-verification` skill: ローソク足の欠損・整合性・異常値・重複の品質検証
- `indicator-analysis` skill に ATR と ROC を追加
- `.claude/skills/_shared/references/` に共通参照資料（`bitbank-api-formats.md` / `pair-classification.md`）を集約

### Changed

- リトライバックオフに ±25% のジッターを追加。複数クライアント同時実行時の
  リトライ同期（thundering herd）を緩和。
- trade ログの `data` フィールドも再帰的に sensitive キーをマスク。
  従来は `params` のみマスクしていたが、API レスポンス側に token 等が
  含まれた場合に素通りする可能性があった。
- `cli/index.ts` の起動部に未捕捉 Promise のセーフティネットを追加。
  Result パターンで吸収できなかった例外を `Fatal: <message>` として
  stderr に出して exit code を返すようになった。
- README / `docs/phases.md` / `docs/customization-guide.md` / `.claude/rules/skills.md` を 7 Skill 構成と `_shared/references/` 運用に合わせて更新
- `withdraw` / `cancel-orders` / `confirm-deposits` の入力検証を Zod に統一。
  以下のケースが従来は素通りしていたが、CLI 層で弾くようになった:
  - `withdraw --amount=Infinity` / `--amount=1e308` / `--amount=NaN`
  - `withdraw --uuid=<UUID形式以外>`
  - `withdraw --asset=<英数以外>`
  - `cancel-orders --order-ids=1.5,2`（小数点）
  - `confirm-deposits --id=abc`（非数値）
  既存の正常系（`amount=0.5`、`uuid=xxx-yyy-...` 等）の挙動は変わらない。
  バリデーションエラーメッセージのフォーマットは変更されている（複数 issue は `;` 区切り）。
- `create-order` / `cancel-order` および public/private GET 系の `pair` 入力検証を
  共通スキーマ（`PairSchema` / `PositiveDecimalSchema` / `IntegerStringSchema`）に統一。
  以下のケースが従来は素通りしていたが、CLI 層で弾くようになった（破壊的変更）:
  - `create-order --amount=Infinity` / `--amount=1e308` / `--amount=+1`
  - `create-order --price=-100` / `--trigger-price=Infinity` 等の非正値・指数表記
  - `create-order --pair=foo`（`^[a-z0-9]+_[a-z0-9]+$` 形式不正）
  - `cancel-order --order-id=0` / `--order-id=abc`（0 や非整数）
  - `ticker` / `depth` / `transactions` / `circuit-break` / `candles` /
    `order` / `active-orders` / `trade-history` / `trade-history-all` /
    `orders-info` / `margin-positions` で形式不正な `pair` を URL に補間する前に拒否
  共通ヘルパ `validatePair(pair, missingMessage)` を `cli/validators.ts` に追加。
  `cancel-order --order-id` 未指定時のエラー文言が
  `order-id is required. Example: --order-id=12345` から
  `id is required. Example: --id=12345` に変更（共通スキーマ既定の文言）。
