#!/usr/bin/env bash
# 目的: セッション終了時にテストを実行し、壊れていないことを保証する

echo "Running tests before session end..."
npx vitest run 2>&1
exit_code=$?

if [ $exit_code -ne 0 ]; then
  echo "❌ テストが失敗しています。修正してからセッションを終了してください。"
  exit 2
fi

echo "✅ 全テスト通過"
exit 0
