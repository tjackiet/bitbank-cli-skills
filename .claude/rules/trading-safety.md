# 取引安全ガード

## 対象コマンド

`create-order`, `cancel-order`, `cancel-orders`, `withdraw` は資金に影響する trade コマンド。

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

## 実装チェックリスト（新規 trade コマンド追加時）

1. `dry-run.ts` のドライラン表示を実装
2. `--execute` なしでドライランになることをテストで確認
3. 資金移動を伴う場合は `--confirm` ガードも追加
4. テストでは実 API を叩かない（モック使用）
