# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Discord Bot with Cloudflare Workers - ゴリ本部長として振る舞うAIチャットボット

## ディレクトリ構成

```
discobot-aggt/
├── worker/                 # Cloudflare Worker (JavaScript)
│   ├── index.js           # メインロジック
│   └── system-prompt.js   # システムプロンプト設定
├── config/                # 設定ファイル
│   ├── system-prompt.txt  # ゴリ本部長のキャラクター設定
│   └── schema.sql         # D1データベーススキーマ
├── scripts/               # ユーティリティスクリプト
│   └── setup-commands.js  # Discord Slashコマンド登録
├── docs/                  # ドキュメント
│   ├── customize-bot.md   # カスタマイズ方法
│   ├── local-dev.md       # ローカル開発ガイド
│   └── ...
├── .env                   # 環境変数（Git除外）
├── .env.example          # 環境変数テンプレート
├── wrangler.toml         # Cloudflare Workers設定
└── package.json          # Node.js依存関係
```

## 開発コマンド

```bash
# ローカル開発サーバー起動
npx wrangler dev --remote

# Cloudflare Workersへデプロイ
npx wrangler deploy

# ログ確認
npx wrangler tail

# D1データベース操作
npx wrangler d1 execute discobot-memos --file=config/schema.sql --remote

# Discord Slashコマンド登録
node scripts/setup-commands.js

# シークレット設定
npx wrangler secret put DISCORD_APPLICATION_ID
npx wrangler secret put DISCORD_PUBLIC_KEY
npx wrangler secret put DISCORD_BOT_TOKEN
npx wrangler secret put GEMINI_API_KEY
```

## アーキテクチャ

### 技術スタック
- **Runtime**: Cloudflare Workers (JavaScript)
- **Database**: Cloudflare D1 (SQLite)
- **AI**: Google Gemini API (gemini-1.5-flash)
- **Bot Framework**: Discord Interactions API

### 主要コンポーネント

#### worker/index.js
- Discord Webhook処理
- Slash Commands実装 (`/gori`, `/memo`, `/list`, `/delete`)
- メッセージ履歴取得（Discord API）
- ニックネーム対応
- Gemini API連携

#### worker/system-prompt.js
- システムプロンプト管理
- ゴリ本部長のキャラクター設定
- カスタムプロンプト読み込み

#### config/system-prompt.txt
- ゴリ本部長の詳細な設定
- 口癖・行動指針
- 編集してキャラクター変更可能

## 主要機能

1. **Slash Commands**
   - `/chat [メッセージ]` - AIと会話
   - `/memo [内容]` - メモ保存
   - `/list` - メモ一覧表示
   - `/delete [ID]` - メモ削除

2. **会話機能**
   - 過去10件のメッセージ履歴を参照
   - ユーザーのニックネーム認識
   - ゴリ本部長のキャラクターで応答

3. **データ永続化**
   - D1データベースでユーザーごとのメモ管理
   - user_idで分離

## 環境変数

必須:
- `DISCORD_APPLICATION_ID` - Discord アプリケーションID
- `DISCORD_PUBLIC_KEY` - Discord 公開鍵
- `DISCORD_BOT_TOKEN` - Discord Botトークン
- `GEMINI_API_KEY` - Gemini API キー

## デプロイ手順

1. 環境変数設定 (`.env`ファイル作成)
2. `npx wrangler secret put`で各シークレット設定
3. `npx wrangler deploy`でデプロイ
4. Discord Developer PortalでInteraction Endpoint URL設定
5. `node scripts/setup-commands.js`でコマンド登録

## キャラクターカスタマイズ

`config/system-prompt.txt`を編集後:
1. `worker/system-prompt.js`の`SYSTEM_PROMPT_TEXT`を更新
2. `npx wrangler deploy`で反映

## 注意事項

- Python版は削除済み（Beta版で不安定のため）
- JavaScript版が安定稼働中
- MESSAGE CONTENT INTENTの有効化必須（Discord Developer Portal）