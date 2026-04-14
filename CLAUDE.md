# CLAUDE.md

bitbank API への薄い CLI アクセス層。分析ロジックは一切持たない。

## コマンド

```bash
npm test                # vitest 全テスト
npx tsx cli/index.ts    # CLI 実行
```

## コード品質

- chaos テスト（`cli/__tests__/chaos/conventions/`）が検証する規約に従う。
  違反したら無視・回避せず修正する。
- CLI の責務は API データの取得と整形のみ

## アーキテクチャ

- Zod スキーマ（`z.infer`）が型の単一ソース
- 全コマンドは Result パターンで返す（例外は使わない）
- MCP サーバー（`bitbank-genesis-mcp-server`）は別リポ。直接 import しない
- コマンド追加 → `.claude/rules/commands.md`
- 取引安全設計 → `.claude/rules/trading-safety.md`

## リポジトリルール

- コミット: `<type>: <概要>`（日本語 OK）
- 外部依存最小。`tsx` で直接実行。ビルドステップなし
- 開発フェーズ → [`docs/phases.md`](docs/phases.md)
- Skill 追加 → `.claude/rules/skills.md`
