# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Discord botプロジェクト。メンションされた際に過去の投稿を参照してGemini APIを使用して返答を生成し、メモ機能も提供する。

## 開発環境

- Python 3.12+
- パッケージマネージャー: uv
- 主要依存関係:
  - discord.py: Discord bot フレームワーク
  - google-generativeai: Gemini API クライアント
  - python-dotenv: 環境変数管理

## 開発コマンド

```bash
# 仮想環境のアクティベート
source .venv/bin/activate

# 依存関係のインストール
uv sync

# 新しい依存関係の追加
uv add <package-name>

# ボットの実行
uv run python main.py

# Cloudflare Workersへのデプロイ
wrangler deploy

# Cloudflare Workersのログ確認
wrangler tail

# シークレットの設定
wrangler secret put DISCORD_BOT_TOKEN
wrangler secret put GEMINI_API_KEY
```

## アーキテクチャ

### コア構造

- `main.py`: エントリーポイント
- `src/bot.py`: Discord botのメインロジック
  - `DiscordBot`クラス: commands.Botを継承
  - Gemini APIとの統合
  - メモ機能の実装（create/read/delete）

### デプロイ構成

- **Cloudflare Workers** (`worker/index.js`): Discord webhookの処理
- **KV Namespace**: メモデータの永続化
- `wrangler.toml`: Cloudflare Workers設定

### 主要機能

1. **メンション応答**: 過去10件のメッセージをコンテキストとして使用
2. **メモ管理**: 
   - 保存: "memo", "メモ", "remember", "覚えて"
   - 削除: "forget", "忘れて", "delete", "削除"  
   - 一覧: "list", "一覧", "show", "見せて"

## セキュリティ

- `.env`ファイルで機密情報を管理（`.gitignore`に含める）
- 本番環境ではwrangler secretsを使用
- Discord webhookの署名検証を実装予定

## 注意事項

- Gemini APIは無料枠を使用
- メモ機能は現在メモリ内保存（本番ではKV Namespaceを使用）
- Discord botトークンとGemini APIキーは`.env`ファイルに設定が必要