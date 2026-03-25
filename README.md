# bitbank CLI & Agent Skills

> **開発中** — このプロジェクトは現在アクティブに開発中です。

bitbank 暗号資産取引所の CLI と Agent Skills スターターキット。

## MCP サーバーとの関係

このプロジェクトは姉妹プロジェクト [bitbank-genesis-mcp-server](https://github.com/tjackiet/bitbank-genesis-mcp-server) と対をなします。MCP サーバーがサーバー側で計算済みの結論を LLM に渡すのに対し、この CLI は bitbank API の生データを高速に取得し、モデル（Opus, o3 等）自身に分析・計算させるアプローチを取ります。同じ bitbank API に対して、2つの異なるアクセス方法を提供します。

## セットアップ

```bash
npm install
npx bitbank --help
```

---

詳細なドキュメントは今後追加予定です。
