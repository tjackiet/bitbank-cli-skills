# 取引安全ガード

## 対象コマンド

`trade create-order`, `trade cancel-order`, `trade cancel-orders`, `trade withdraw` は資金に影響する trade サブコマンド（`bitbank trade <cmd>` で呼び出す）。

注: サブコマンド形式は discoverability と視覚的な警告が目的で、実行ガードではない。実際の安全ガードは以下 `--execute` / `--confirm` フラグ側にある。

## ドライラン（デフォルト）

- `--execute` フラグなしでは **API を叩かない**
- `cli/commands/trade/dry-run.ts` でドライラン出力を生成
- ドライラン時は「これはドライランです。実際に実行するには --execute を付けてください」と表示

## --execute フラグ

- 付与時のみ実際の API リクエストを送信
- コマンド実装では必ず `options.execute` を確認してからリクエスト送信

## withdraw の追加ガード

- `--execute` に加えて `--confirm` による対話確認が必須
- 両方が揃わない限り API を叩かない

## POST のリトライ無効化（冪等性の保護）

- bitbank API は `Idempotency-Key` 相当のヘッダを受け付けない
- POST はサーバ側で副作用が発生し得るため、`cli/http-private-post.ts` は
  `retries: 0` と `retryOnNetworkError: false` を強制している
- trade コマンドはネットワーク例外（タイムアウト・ECONNRESET 等）でも
  自動再送しない。CLI が「失敗」を返しても、注文や出金が実際には通って
  いる可能性がある（silent success）
- タイムアウトや 5xx を受け取った場合は、再実行する前に必ず
  `bitbank active-orders` / `bitbank trade-history` / `bitbank assets`
  などで実際の状態を確認すること

## 実装チェックリスト（新規 trade コマンド追加時）

1. `dry-run.ts` のドライラン表示を実装
2. `--execute` なしでドライランになることをテストで確認
3. 資金移動を伴う場合は `--confirm` ガードも追加
4. テストでは実 API を叩かない（モック使用）
