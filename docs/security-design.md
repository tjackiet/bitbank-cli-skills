# セキュリティ設計

## 設計思想

bitbank-cli-skills は AI エージェント（Claude 等）が暗号資産取引所 bitbank の API を操作するための薄い CLI アクセス層である。CLI 自体は分析ロジックを持たず、API データの取得・整形・安全な取引実行に特化する。以下、主な 4 つのリスクに対し、多層防御を構築する。

| # | リスク | 主な対策 |
|---|---|---|
| R1 | 意図しない注文の発行 | ドライランデフォルト・`--execute` ゲート・`--confirm` 対話確認 |
| R2 | クレデンシャル・機密情報の漏洩 | 環境変数隔離・出力マスク・エラーメッセージ制御 |
| R3 | 不正な入力のすり抜け | Zod バリデーション・注文タイプ別検証・上限値チェック |
| R4 | AI エージェントによる設定改ざん | Claude hooks・権限拒否リスト・設定ファイル保護 |

## R1. 意図しない注文の発行

AI エージェントまたはユーザーの操作ミスにより、意図しない注文が発行されるリスク。

### ドライラン（デフォルト）— 全 trade コマンドの安全弁

取引操作（`create-order` / `cancel-order` / `cancel-orders` / `confirm-deposits` / `confirm-deposits-all` / `withdraw`）は、デフォルトで API を叩かない。

#### フロー

```
1. ユーザー/エージェントがコマンドを実行（--execute なし）
2. CLI がリクエスト内容をプレビュー表示（ドライラン）
3. ユーザーが内容を確認し、--execute 付きで再実行
4. CLI が実際の API リクエストを送信
```

#### 実装（`cli/commands/trade/dry-run.ts`）

| 項目 | 内容 |
|---|---|
| デフォルト動作 | API を叩かず、リクエスト内容をプレビュー表示 |
| 出力内容 | エンドポイント、リクエストボディ、`--execute` 付きコマンドのヒント |
| 機密フィールドのマスク | `token`, `otp_token` は `"***"` に置換して表示（`:15-16`） |

各 trade コマンドの `--execute` ガード実装箇所:

| コマンド | 実装箇所 | ガード |
|---|---|---|
| `create-order` | `cli/commands/trade/create-order.ts:85` | `if (!args.execute)` → ドライラン |
| `cancel-order` | `cli/commands/trade/cancel-order.ts:33` | `if (!args.execute)` → ドライラン |
| `cancel-orders` | `cli/commands/trade/cancel-orders.ts:49` | `if (!args.execute)` → ドライラン |
| `withdraw` | `cli/commands/trade/withdraw.ts:60` | `if (!args.execute)` → ドライラン |

### `withdraw` の追加ガード — 二重確認

出金は不可逆であるため、`--execute` に加えて `--confirm` フラグと対話確認を要求する。

#### フロー（`cli/commands/trade/withdraw.ts`）

```
1. --execute なし → ドライラン（:60-69）
2. --execute あり + --confirm なし → エラー（:72-76）
3. --execute + --confirm → 対話プロンプト「本当に出金しますか？ (yes/no)」（:79-89）
4. ユーザーが "yes" → API 実行
5. ユーザーが "no"/"yes" 以外 → キャンセル
```

#### 防御対象

| 攻撃シナリオ | 対策 |
|---|---|
| エージェントが --execute 付きで直接発注 | ドライランがデフォルト。ユーザーの明示的指示が必要 |
| エージェントが出金を試行 | `--execute` + `--confirm` + 対話確認の三重ガード |
| ドライラン出力でのトークン露出 | `token` / `otp_token` は `"***"` にマスク |

### 取引ログ

trade コマンドの実行結果を NDJSON 形式でファイルに記録する（`cli/trade-log.ts`）。

| 項目 | 内容 |
|---|---|
| フォーマット | NDJSON（1行1レコード） |
| スキーマ | `cli/trade-log-schema.ts` — Zod で `timestamp`, `command`, `params`, `success`, `data`/`error` を定義 |
| ドライラン | ログに記録しない（テストで検証済み: `cli/__tests__/trade-log.test.ts:101-109`） |

## R2. クレデンシャル・機密情報の漏洩

API クレデンシャルがログ、エラーメッセージ、出力を通じて漏洩するリスク。

### 機密情報の分類

#### CRITICAL: 認証情報（漏洩 = アカウント侵害）

| 情報 | 所在 |
|---|---|
| `BITBANK_API_KEY` | 環境変数 → `cli/auth.ts:9` → HTTP ヘッダー `ACCESS-KEY` |
| `BITBANK_API_SECRET` | 環境変数 → `cli/auth.ts:10` → HMAC 署名生成 |
| `ACCESS-SIGNATURE` | `cli/auth.ts:21-28` で生成される HMAC-SHA256 署名 |
| `token`（OTP トークン） | `withdraw` コマンドの入力パラメータ |

#### HIGH: 財務・個人情報（漏洩 = 資産状況や取引履歴の特定）

| 情報 | 取得コマンド |
|---|---|
| 資産残高（保有量） | `assets` |
| 取引履歴（約定価格・数量） | `trade-history` / `trade-history-all` |
| 注文情報（価格・数量・ステータス） | `order` / `orders-info` / `active-orders` |
| 入出金履歴（金額・日時） | `deposit-history` / `withdrawal-history` |
| 出金先アカウント UUID | `withdrawal-accounts` |
| 証拠金ステータス | `margin-status` / `margin-positions` |

### 保護策

#### 認証情報の隔離（CRITICAL）

| 保護策 | 実装箇所 | 説明 |
|---|---|---|
| 環境変数からのみ読み込み | `cli/auth.ts:8-18` | `loadCredentials()` が唯一の読み込み口。ハードコードは存在しない |
| 両方揃わなければエラー返却 | `cli/auth.ts:11-16` | KEY と SECRET 両方が未設定なら即エラー（Result パターン） |
| 認証処理の封じ込め | `cli/auth.ts:21-61` | `signGet` / `signPost` / `authHeadersGet` / `authHeadersPost` に集約。各コマンドは直接触れない |
| HTTP ヘルパーの分離 | `cli/http-private.ts`, `cli/http-private-post.ts` | 認証ヘッダーの組み立ては HTTP ヘルパー層で完結 |
| `.env` の Git 除外 | `.gitignore:10-12` | `.env` / `.env.*` をコミット対象外（`.env.example` のみ許可） |

#### 出力時のマスク（CRITICAL）

| 保護策 | 実装箇所 | 説明 |
|---|---|---|
| ドライラン出力での機密フィールドマスク | `cli/commands/trade/dry-run.ts:15-16` | `sensitiveKeys` に `token`, `otp_token` を登録。`"***"` に置換して表示 |
| `withdraw` ヒント出力でのマスク | `cli/commands/trade/withdraw.ts:61` | `--token=***` と表示。実値を出力しない |

#### エラー経路の安全性

| エラー種別 | 実装箇所 | 対応 |
|---|---|---|
| 認証エラー（20001〜20003） | `cli/http-core.ts:7-9` | 静的メッセージ（`API認証失敗` / `APIキー不正` / `APIキー権限不足`）。レスポンスボディをエコーしない |
| HTTP 401/403 | `cli/http-core.ts:77` | `HTTP {status}: {statusText}` のみ。クレデンシャルは露出しない |
| ネットワークエラー | `cli/http-core.ts:91-93` | `Error.message` のみ。スタックトレースやリクエストヘッダーは含めない |
| レート制限（60001） | `cli/http-core.ts:83-86` | 自動リトライ後、静的エラーメッセージ |
| 全エラー | `cli/types.ts:14-16` | Result パターン（`{ success: false, error: string }`）。例外を throw しない |

## R3. 不正な入力のすり抜け

未知のパラメータや不正な値がバリデーションをすり抜けるリスク。

### Zod スキーマによる入力検証

全コマンドの入力を Zod スキーマで検証する。手動の `interface` / `type` 定義は禁止（`CLAUDE.md` 禁止事項 3）。

| 検証項目 | 実装箇所 | 内容 |
|---|---|---|
| side 列挙 | `cli/commands/trade/create-order.ts:6` | `z.enum(["buy", "sell"])` |
| type 列挙 | `cli/commands/trade/create-order.ts:7` | `z.enum(["limit", "market", "stop", "stop_limit"])` |
| amount 正値 | `cli/commands/trade/create-order.ts:15` | `z.string().refine(v => Number(v) > 0)` |
| withdraw amount 正値 | `cli/commands/trade/withdraw.ts:51` | `Number(args.amount) <= 0` で拒否 |
| レスポンス検証 | 各コマンド | `xxxResponseSchema.safeParse()` で API 応答も検証 |

### 注文タイプ別バリデーション（`superRefine`）

`create-order` では注文タイプに応じた必須パラメータを事前チェックする（`cli/commands/trade/create-order.ts:19-26`）:

| 注文タイプ | 必須パラメータ | チェック内容 |
|---|---|---|
| `limit` | `price` | price 未指定で拒否 |
| `stop_limit` | `price` + `triggerPrice` | いずれか未指定で拒否 |
| `stop` | `triggerPrice` | triggerPrice 未指定で拒否 |
| `market` | — | price 不要 |

### 上限値チェック

| チェック | 実装箇所 | 内容 |
|---|---|---|
| 一括キャンセル上限 | `cli/commands/trade/cancel-orders.ts:21,40-44` | `MAX_ORDER_IDS = 30`。超過で即エラー |
| order-ids 数値検証 | `cli/commands/trade/cancel-orders.ts:38-39` | `Number.isNaN` チェック。非数値で拒否 |

### Result パターンによる安全なエラー伝播

例外を throw せず、全関数が `Result<T>` 型で返却する（`cli/types.ts:14-16`）。

```typescript
type Result<T> =
  | { success: true; data: T; meta?: ResultMeta }
  | { success: false; error: string; exitCode?: ExitCode };
```

- `throw` 禁止は `CLAUDE.md` 禁止事項 4、`lefthook.yml:13-15` の pre-commit フック、`.claude/hooks/post-ts-lint.sh:22-25` で三重に強制
- エラーメッセージは人間可読な静的文字列。内部状態やスタックトレースを含めない

## R4. AI エージェントによる設定改ざん

AI エージェント（Claude 等）がセキュリティ関連の設定ファイルを緩和・無効化するリスク。

### Claude Code 権限制御（`.claude/settings.json`）

#### 破壊的 Git 操作の拒否

| 拒否パターン | 目的 |
|---|---|
| `git commit --no-verify*` | pre-commit フック（Lint・型チェック・秘密検査・テスト）のバイパスを防止 |
| `git push --force*` | リモートブランチの強制上書きを防止 |
| `git reset --hard*` | 未コミット変更の破壊を防止 |

#### 設定ファイルの保護（`.claude/hooks/protect-config.sh`）

`PreToolUse` フックで Edit/Write を遮断する保護対象ファイル:

| ファイル | 保護理由 |
|---|---|
| `biome.json` | Lint ルールの緩和防止 |
| `tsconfig.json` | `strict: true` の無効化防止 |
| `lefthook.yml` | pre-commit セキュリティチェックの無効化防止 |
| `.github/workflows/ci.yml` | CI セキュリティゲートの無効化防止 |

#### 編集後の自動検証（`.claude/hooks/post-ts-lint.sh`）

`PostToolUse` フックで TS ファイル編集後に自動実行:

| チェック | 内容 |
|---|---|
| Biome lint | コード品質ルール違反の検出 |
| `throw` 禁止パターン | テストファイル以外での `throw` 使用を検出 |

#### セッション終了時テスト（`.claude/hooks/stop-test.sh`）

`Stop` フックで `.ts` / `.js` ファイルに変更があった場合、`vitest run` を自動実行。テスト失敗時はセッション終了をブロックする。

## 横断的な施策

### Pre-commit 品質ゲート（`lefthook.yml`）

6 つのチェックを並列実行:

| チェック | 内容 |
|---|---|
| `biome-check` | `cli/**/*.ts` の Lint チェック |
| `typecheck` | `tsc --noEmit` による型チェック（`strict: true`） |
| `banned-throw` | `cli/` 内の `throw` 文を検出・拒否（テスト除外） |
| `banned-new-date` | `new Date()` の使用を警告（タイムゾーン問題） |
| `secret-check` | `BITBANK_API_KEY` / `BITBANK_API_SECRET` / `API_KEY=` のハードコードを検出・拒否 |
| `test` | `vitest run` 全テスト実行 |

### CI/CD セキュリティゲート（`.github/workflows/ci.yml`）

| トリガー | push to main / 全 PR |
|---|---|
| `npm audit --audit-level=high` | high 以上の依存脆弱性を検出時に fail |
| `npx biome check cli/` | Lint チェック |
| `npx tsc --noEmit` | 型チェック |
| `npx vitest run` | 全テスト実行 |

### Exit Code 体系（`cli/exit-codes.ts`）

AI エージェントがリトライ判断に使える構造化された終了コード:

| コード | 名前 | 意味 |
|---|---|---|
| 0 | `SUCCESS` | 成功 |
| 1 | `GENERAL` | 一般エラー |
| 2 | `AUTH` | 認証エラー（リトライ不要） |
| 3 | `RATE_LIMIT` | レート制限（リトライ可能） |
| 4 | `PARAM` | パラメータエラー（リトライ不要） |
| 5 | `NETWORK` | ネットワークエラー（リトライ可能） |

### HTTP リトライ制御（`cli/http-core.ts:54-100`）

| 条件 | 動作 |
|---|---|
| HTTP 429 | `Retry-After` ヘッダーに従い自動リトライ |
| HTTP 5xx | Exponential Backoff（最大 2 回、`2^attempt * 500ms`） |
| API 60001（レート制限） | Exponential Backoff で自動リトライ |
| タイムアウト | `AbortController` による 5 秒タイムアウト（`timeoutMs` で変更可能） |

### テストによる継続的検証

セキュリティ関連のテストを含む 55 テストファイル:

| テストファイル | 検証内容 |
|---|---|
| `cli/__tests__/auth.test.ts` | HMAC 署名の正確性、認証ヘッダーの生成、未設定時のエラー返却 |
| `cli/__tests__/http-core.test.ts` | エラーコードマッピング、リトライ判定、fetchWithRetry のエラーハンドリング |
| `cli/__tests__/trade/create-order.test.ts` | ドライランデフォルト、`--execute` での API 実行、price/trigger-price/amount バリデーション |
| `cli/__tests__/trade/cancel-order.test.ts` | ドライランデフォルト、`--execute` ガード |
| `cli/__tests__/trade/cancel-orders.test.ts` | 一括キャンセル上限、ドライランデフォルト |
| `cli/__tests__/trade/withdraw.test.ts` | ドライランデフォルト、`--execute` + `--confirm` 二重ガード、対話キャンセル、トークンマスク |
| `cli/__tests__/trade/dry-run.test.ts` | ドライラン出力、`token` / `otp_token` のマスク検証 |
| `cli/__tests__/trade-log.test.ts` | NDJSON ログ書き込み、ドライラン時の非記録 |

### 監査結果（2026/4/3 時点）

現時点でポリシー違反はありません。

| チェック項目 | 結果 | 備考 |
|---|---|---|
| CRITICAL 情報がハードコードされていない | OK | `secret-check` pre-commit フックで強制 |
| 認証情報が環境変数からのみ読み込まれる | OK | `loadCredentials()` が唯一の読み込み口 |
| 全 trade コマンドがドライランデフォルト | OK | 6 コマンドすべてで `--execute` ガード実装済み |
| `withdraw` の二重確認 | OK | `--execute` + `--confirm` + 対話確認 |
| ドライラン出力での機密マスク | OK | `token` / `otp_token` が `"***"` に置換されること（テスト検証済み） |
| エラーメッセージの安全性 | OK | 認証エラーは静的メッセージ、クレデンシャル非露出 |
| 例外 throw 禁止 | OK | lefthook + Claude hooks + CLAUDE.md で三重強制 |
| 設定ファイル保護 | OK | `protect-config.sh` で 4 ファイルを AI 編集から保護 |
| 依存脆弱性チェック | OK | CI で `npm audit --audit-level=high` 実行 |
| テスト網羅 | OK | 55 テストファイル、全 trade コマンドのドライラン・バリデーションをカバー |

## MCP サーバーとの比較

本 CLI と [bitbank-genesis-mcp-server](https://github.com/tjackiet/bitbank-genesis-mcp-server) では、同じリスクに対して異なるアプローチで防御を行う:

| リスク | MCP サーバー | CLI（本ツール） |
|---|---|---|
| R1: 意図しない注文 | HITL 確認トークン（HMAC ベース） | ドライランデフォルト + `--execute` / `--confirm` ゲート |
| R2: クレデンシャル漏洩 | ログマスク + 出力マッピング除外 | 環境変数隔離 + ドライラン出力マスク + エラーメッセージ制御 |
| R3: 不正な入力 | Zod + 通貨ペア Allowlist + トリガー価格妥当性 | Zod + 注文タイプ別 superRefine + 上限値チェック |
| R4: 外部攻撃 / 設定改ざん | DNS Rebinding 保護 + Origin 制限 | Claude hooks 設定ファイル保護 + 権限拒否リスト |
| 監査ログ | チェーンハッシュ付き取引ログ | NDJSON 取引ログ |
| CI/CD | `npm audit` + oxlint + Lefthook | `npm audit` + Biome + Lefthook |
