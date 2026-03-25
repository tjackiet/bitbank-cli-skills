# CLAUDE.md

bitbank API への薄い CLI アクセス層。分析ロジックは一切持たない。

## コマンド

```bash
npm test                # vitest 全テスト
npx tsx cli/index.ts    # CLI 実行
```

## 禁止事項

1. **CLI に分析ロジックを入れない。** 指標計算・パターン検出・スコアリングは実装しない。CLI は API データの取得と整形だけ。
2. **MCP サーバー (`bitbank-genesis-mcp-server`) の `tools/` を import しない。** 別リポ。API は直接 HTTP で叩く。
3. **手動の `interface` / `type` を定義しない。** Zod スキーマ + `z.infer` が型の単一ソース。
4. **例外を throw しない。** Result パターン (`{ success, data } | { success, error }`) を使う。

## 安全設計（取引コマンド）

`create-order`, `cancel-order`, `cancel-orders`, `withdraw` は資金に影響する:

- `--execute` なしではドライラン（API を叩かない）
- `withdraw` は追加で `--confirm` 対話確認が必須

## 規約

- 1ファイル 100 行以内。超えたら分割
- 出力: `--format=json|table|csv`（デフォルト json）
- コミット: `<type>: <概要>`（日本語 OK、type = feat/fix/refactor/test/docs/chore）
- 外部依存最小。`tsx` で直接実行。ビルドステップなし

## ポインタ

- 開発フェーズとタスク一覧 → [`docs/phases.md`](docs/phases.md)
- Agent Skills → `.claude/skills/`
