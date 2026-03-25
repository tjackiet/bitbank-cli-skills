# CLAUDE.md — bitbank CLI & Agent Skills

このファイルは AI アシスタント（Claude Code 等）がこのリポジトリで作業する際の指示書です。
すべてのセッションでこのファイルを最初に読み、ここに書かれたルールに従ってください。

## プロジェクト概要

bitbank 暗号資産取引所の CLI と Agent Skills スターターキット。

**設計思想: CLI = bitbank API への薄いアクセス層。分析ロジックは一切持たない。**

姉妹プロジェクト `bitbank-genesis-mcp-server`（MCP サーバー）とは真逆のアプローチを取る:

| | MCP サーバー | この CLI |
|---|---|---|
| 対象 | 汎用 LLM ユーザー | 中上級者 |
| 方針 | サーバー側で計算済みの結論を渡す | 生データを高速に渡し、モデル（Opus, o3 等）に計算させる |
| 利点 | すぐ使える | 柔軟・高速・モデルの推論力を活用 |

同じ bitbank API に対して、2つのアプローチを提供する。

---

## 絶対ルール（すべてのセッションで厳守）

1. **CLI は分析ロジックを持たない。** テクニカル指標の計算、パターン検出、スコアリング等は一切実装しない。CLI の責務は API からデータを取得し、整形して出力することだけ。
2. **bitbank API を直接 HTTP で叩く。** MCP サーバーの `tools/` を import しない（別リポのため）。
3. **外部依存最小。ビルド不要。** `tsx` で直接実行する。コンパイルステップは不要。
4. **出力フォーマットは `--format=json|table|csv` の3種。** `json` がデフォルト（モデルがパースしやすいため）。

---

## 技術スタック

- **TypeScript** 5.9+
- **Node.js** 18+
- **エントリーポイント:** `cli/index.ts`（`#!/usr/bin/env tsx`）
- **パッケージ名:** `bitbank`（`npx bitbank` で実行）
- **テスト:** vitest
- **パッケージマネージャ:** npm

---

## API 情報

| API | ベース URL | 認証 |
|---|---|---|
| Public API | `https://public.bitbank.cc` | 不要 |
| Private REST API | `https://api.bitbank.cc/v1` | HMAC-SHA256 |

### レート制限

- **QUERY:** 10 calls/sec
- **UPDATE:** 6 calls/sec

---

## ファイル構成

```
cli/
├── index.ts                 ← サブコマンドルーター
├── output.ts                ← 出力フォーマッター（json/table/csv）
├── auth.ts                  ← HMAC-SHA256 認証（Phase 2 で実装）
└── commands/
    ├── public/              ← Phase 1: ticker, candles, depth 等
    ├── private/             ← Phase 2: assets, trade-history 等
    └── trade/               ← Phase 3: create-order, withdraw 等

.claude/skills/              ← Phase 5 で実装
```

---

## コーディング規約

- **Zod スキーマを型の単一ソースとする。** `z.infer<typeof Schema>` で型を生成する。手動の `interface` / `type` 定義は原則禁止。ランタイムバリデーションと型安全を同時に得る。
- **エラーハンドリングは Result パターン。** `{ success: true, data: T } | { success: false, error: string }` の union を使う。例外を throw しない。
- **1ファイル 100 行以内を目安に分割。** 超えそうな場合は責務を分けて別ファイルにする。
- **ブランチ命名規則:**
  - `ai/` プレフィクス — AI が作業するブランチ
  - `human/` プレフィクス — 手動作業ブランチ

---

## 安全設計（Phase 3: 取引コマンド向け）

以下のコマンドは資金に影響するため、安全設計を厳守する:

- `create-order`, `cancel-order`, `cancel-orders`, `withdraw`

### ルール

1. **`--dry-run` がデフォルト。** フラグなしで実行した場合、リクエスト内容を表示するだけで API を叩かない。
2. **実行には `--execute` フラグの明示が必須。** `--execute` が付いていない限り、実際の API コールは行わない。
3. **`withdraw` は追加で `--confirm` インタラクティブ確認を要求する。** `--execute` に加えて、ユーザーが対話的に「yes」と入力しなければ実行しない。

---

## 開発フェーズ

詳細なタスクチェックリストは [`docs/phases.md`](docs/phases.md) を参照。

| Phase | 内容 | 状態 |
|---|---|---|
| Phase 0 | プロジェクト初期セットアップ | ✅ 完了 |
| Phase 1 | Public API コマンド（9コマンド: ticker, candles, depth 等） | 未着手 |
| Phase 2 | HMAC認証基盤 + Private API 読み取り系（12コマンド） | 未着手 |
| Phase 3 | 注文・出金コマンド（6コマンド、安全設計込み） | 未着手 |
| Phase 4 | Stream — PubNub リアルタイムデータ（2コマンド） | 未着手 |
| Phase 5 | Agent Skills（3本）+ references + カスタマイズガイド | 未着手 |

---

## セッション開始時のチェックリスト

1. この `CLAUDE.md` を読む
2. 現在の Phase と未完了タスクを確認する
3. `git status` で作業状態を確認する
4. 変更前にテストが通ることを確認する（`npm test`）

---

## テスト

```bash
npm test          # vitest を実行
```

- 新しいコマンドを追加したら、対応するテストも書く
- API コールのテストはモックを使う（実際の API を叩かない）

---

## コミットメッセージ規約

- 日本語 OK
- 形式: `<type>: <概要>`
- type: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
- 例: `feat: ticker コマンドを追加`
