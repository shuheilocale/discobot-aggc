# Discord Bot - ゴリ本部長

Cloudflare WorkersとGemini APIを使用したDiscord Bot。面倒くさがり屋の本部長「ゴリ」として振る舞います。

## 特徴

- 💬 AIチャットボット（Gemini API）
- 📝 メモ機能（ユーザーごと）
- 🗣️ ゴリ本部長のキャラクター
- ☁️ Cloudflare Workers（無料ホスティング）
- 💾 D1データベース（永続化）

## クイックスタート

### 1. 環境準備

```bash
# リポジトリをクローン
git clone https://github.com/your-username/discobot-aggt.git
cd discobot-aggt

# 依存関係インストール
npm install
```

### 2. Discord Bot作成

1. [Discord Developer Portal](https://discord.com/developers/applications)でアプリケーション作成
2. Bot設定で以下を取得:
   - Application ID
   - Public Key
   - Bot Token
3. Bot招待リンクで権限設定:
   - Read Messages
   - Send Messages
   - Read Message History
   - Use Slash Commands

### 3. 環境変数設定

`.env`ファイルを作成:
```
DISCORD_APPLICATION_ID=your_application_id
DISCORD_PUBLIC_KEY=your_public_key
DISCORD_BOT_TOKEN=your_bot_token
GEMINI_API_KEY=your_gemini_api_key
```

### 4. デプロイ

```bash
# Cloudflareログイン
npx wrangler login

# D1データベース作成
npx wrangler d1 create discobot-memos

# スキーマ適用
npx wrangler d1 execute discobot-memos --file=config/schema.sql --remote

# シークレット設定
npx wrangler secret put DISCORD_APPLICATION_ID
npx wrangler secret put DISCORD_PUBLIC_KEY
npx wrangler secret put DISCORD_BOT_TOKEN
npx wrangler secret put GEMINI_API_KEY

# デプロイ
npx wrangler deploy

# Slashコマンド登録
node scripts/setup-commands.js
```

### 5. Discord設定

Discord Developer PortalでInteraction Endpoint URLを設定:
```
https://your-worker-name.workers.dev/discord
```

## コマンド

- `/gori [メッセージ]` - ゴリ本部長と会話
- `/memo [内容]` - メモを保存
- `/list` - メモ一覧表示
- `/delete [ID]` - メモ削除

## カスタマイズ

`config/system-prompt.txt`を編集してキャラクターを変更できます。

## ライセンス

MIT