# Skill 追加手順

## ディレクトリ構造

```
.claude/skills/<skill-name>/
  SKILL.md              # Skill 定義（必須）
  references/           # 参照資料（任意）
    bitbank-api-formats.md
    <domain-specific>.md
```

## SKILL.md テンプレート

```markdown
---
name: <skill-name>
description: |
  Skill の説明。何ができるか、どんなリクエストに対応するか。
  トリガーとなるユーザーの発話例も含める。
compatibility: |
  Requires bitbank CLI (npx tsx cli/index.ts). Node.js 18+.
metadata:
  author: bitbank-aiforge
  version: "1.0"
---

# <Skill 名> Skill

## 実行フロー

（Plan → Validate → Execute の流れを記述）

## Gotchas

（注意点・落とし穴を列挙）
```

## references/ の規約

- `bitbank-api-formats.md` は共通。各 Skill で同じものを配置
- ドメイン固有の資料は `<domain>-guide.md` や `<domain>-patterns.md` で命名
- CLI コマンドの実行例を含め、モデルが正確にコマンドを組み立てられるようにする

## 注意

- Skill に分析ロジックのコードは書かない（CLAUDE.md 禁止事項 1）
- Skill はモデルへの指示書。実行はモデルが CLI を呼び出して行う
