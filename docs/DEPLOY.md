# デプロイガイド

このドキュメントでは、Discord Bot「ゴリ本部長」をCloudflare Workersにデプロイする手順を説明します。

## 前提条件

- Node.js (v16以上)
- npmまたはyarn
- Cloudflareアカウント
- Discord Developer Portalアクセス
- Gemini API Key

## 手順

### 1. 初回セットアップ

#### 1.1 リポジトリのクローン

```bash
git clone https://github.com/your-username/discobot-aggt.git
cd discobot-aggt
```

#### 1.2 依存関係のインストール

```bash
npm install
```

### 2. Discord Bot設定

#### 2.1 Discord Developer Portalでアプリケーション作成

1. [Discord Developer Portal](https://discord.com/developers/applications)にアクセス
2. 「New Application」をクリック
3. アプリケーション名を入力（例：ゴリ本部長）

#### 2.2 Botの設定

1. 左メニューから「Bot」を選択
2. 「Reset Token」をクリックしてBot Tokenを取得（一度だけ表示されるので必ず保存）
3. 「MESSAGE CONTENT INTENT」を有効化（重要！）

#### 2.3 必要な情報の取得

以下の情報をメモしておく：
- **Application ID**: General Informationページ
- **Public Key**: General Informationページ
- **Bot Token**: Botページで取得したトークン

### 3. Cloudflare設定

#### 3.1 Cloudflareログイン

```bash
npx wrangler login
```

ブラウザが開いて認証を求められるので、Cloudflareアカウントでログインして許可する。

#### 3.2 D1データベース作成

```bash
npx wrangler d1 create discobot-memos
```

出力される`database_id`をメモする。例：
```
Created database discobot-memos with ID: d4de3d60-7767-499a-a8ad-f27fee9e67ed
```

#### 3.3 wrangler.toml更新

`wrangler.toml`ファイルを開き、database_idを更新：

```toml
[[d1_databases]]
binding = "DB"
database_name = "discobot-memos"
database_id = "YOUR_DATABASE_ID_HERE"  # ← ここに取得したIDを入力
```

#### 3.4 データベーススキーマ適用

```bash
# ローカル環境（開発用）
npx wrangler d1 execute discobot-memos --file=config/schema.sql --local

# 本番環境
npx wrangler d1 execute discobot-memos --file=config/schema.sql --remote
```

### 4. 環境変数設定

#### 4.1 シークレット設定（本番環境）

以下のコマンドを順番に実行し、それぞれの値を入力：

```bash
npx wrangler secret put DISCORD_APPLICATION_ID
# プロンプトが表示されたら、Application IDを入力してEnter

npx wrangler secret put DISCORD_PUBLIC_KEY
# プロンプトが表示されたら、Public Keyを入力してEnter

npx wrangler secret put DISCORD_BOT_TOKEN
# プロンプトが表示されたら、Bot Tokenを入力してEnter

npx wrangler secret put GEMINI_API_KEY
# プロンプトが表示されたら、Gemini API Keyを入力してEnter
```

#### 4.2 ローカル開発用（オプション）

`.env`ファイルを作成：

```env
DISCORD_APPLICATION_ID=your_application_id
DISCORD_PUBLIC_KEY=your_public_key
DISCORD_BOT_TOKEN=your_bot_token
GEMINI_API_KEY=your_gemini_api_key
```

### 5. キャラクターカスタマイズ（オプション）

`config/system-prompt.txt`を編集してBotの性格を変更できます。

変更後、`worker/system-prompt.js`の埋め込みテキストも更新する必要があります：
1. `config/system-prompt.txt`の内容をコピー
2. `worker/system-prompt.js`の`SYSTEM_PROMPT_TEXT`定数の中身を置き換え

### 6. デプロイ

#### 6.1 Workerのデプロイ

```bash
npx wrangler deploy
```

成功すると、WorkerのURLが表示されます：
```
Published discobot-aggt (x.xx sec)
  https://discobot-aggt.YOUR_SUBDOMAIN.workers.dev
```

#### 6.2 Discord Interaction Endpoint設定

1. Discord Developer Portalに戻る
2. アプリケーションを選択
3. 「General Information」ページ
4. 「INTERACTIONS ENDPOINT URL」に以下を入力：
   ```
   https://discobot-aggt.YOUR_SUBDOMAIN.workers.dev/discord
   ```
5. 「Save Changes」をクリック（自動的に検証される）

### 7. Slashコマンド登録

```bash
node scripts/setup-commands.js
```

成功すると、以下のコマンドが登録されます：
- `/chat [メッセージ]` - ゴリ本部長と会話
- `/memo [内容]` - メモを保存
- `/list` - メモ一覧表示
- `/delete [ID]` - メモ削除

### 8. Botをサーバーに招待

#### 8.1 招待リンク生成

Discord Developer Portalで：
1. 左メニューから「OAuth2」→「URL Generator」を選択
2. 「SCOPES」で`bot`と`applications.commands`を選択
3. 「BOT PERMISSIONS」で以下を選択：
   - Read Messages/View Channels
   - Send Messages
   - Read Message History
   - Use Slash Commands
4. 生成されたURLをコピー

#### 8.2 Botを招待

1. 生成されたURLにアクセス
2. 追加したいサーバーを選択
3. 権限を確認して「認証」

## デプロイ後の確認

### 動作テスト

Discordサーバーで以下を試す：

1. **Slashコマンドテスト**
   ```
   /chat こんにちは
   ```

2. **メンション応答テスト**
   ```
   @ゴリ本部長 どう思う？
   ```

3. **メモ機能テスト**
   ```
   /memo 今日の会議は16時から
   /list
   ```

### ログ確認

問題が発生した場合、ログを確認：

```bash
# リアルタイムログ
npx wrangler tail

# 過去のログ
npx wrangler tail --format json > logs.json
```

## 更新とメンテナンス

### コード更新

1. コードを変更
2. 再デプロイ：
   ```bash
   npx wrangler deploy
   ```

### システムプロンプト更新

1. `config/system-prompt.txt`を編集
2. `worker/system-prompt.js`の埋め込みテキストを更新
3. 再デプロイ

### データベース確認

```bash
# メモ一覧確認
npx wrangler d1 execute discobot-memos --command="SELECT * FROM memos" --remote

# チャット履歴確認
npx wrangler d1 execute discobot-memos --command="SELECT * FROM chat_history ORDER BY created_at DESC LIMIT 10" --remote
```

## トラブルシューティング

### よくある問題

#### 1. 「AIレスポンスの生成に失敗しました」

**原因**: Gemini API Keyが正しく設定されていない
**解決**: 
```bash
npx wrangler secret put GEMINI_API_KEY
```

#### 2. 「メッセージ履歴の取得に失敗しました」

**原因**: Bot TokenまたはMESSAGE CONTENT INTENTが有効でない
**解決**: 
- Discord Developer PortalでMESSAGE CONTENT INTENTを有効化
- Bot Tokenを再設定

#### 3. Interaction Endpoint検証エラー

**原因**: Public Keyが正しくない
**解決**:
```bash
npx wrangler secret put DISCORD_PUBLIC_KEY
```

#### 4. Slashコマンドが表示されない

**原因**: コマンド登録されていない、またはBot権限不足
**解決**:
1. コマンド再登録：
   ```bash
   node scripts/setup-commands.js
   ```
2. Bot権限確認（Use Slash Commandsが必要）

## セキュリティ注意事項

- **Bot Token**は絶対に公開しない
- `.env`ファイルはGitにコミットしない（.gitignoreに含まれているか確認）
- 本番環境では必ず`wrangler secret`を使用する
- 定期的にBot Tokenをリセットすることを推奨

## 参考リンク

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Discord Developer Documentation](https://discord.com/developers/docs)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Gemini API Documentation](https://ai.google.dev/docs)