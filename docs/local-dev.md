# ローカル開発・デバッグ方法

## 1. Wrangler開発サーバー

```bash
# ローカル開発サーバーを起動（リモートのD1とシークレットを使用）
npx wrangler dev --remote

# ローカルでテスト（ローカルのD1を使用）
npx wrangler dev
```

開発サーバーが起動したら、`http://localhost:8787`でアクセス可能。

## 2. テストスクリプト実行

```bash
# テストスクリプトを実行
node test-local.js
```

実際のチャンネルIDに変更する必要があります：
1. Discordでチャンネルを右クリック
2. 「チャンネルIDをコピー」を選択
3. test-local.jsの`channelId`を更新

## 3. ngrokでローカルをDiscordに接続

```bash
# ngrokをインストール（まだの場合）
brew install ngrok

# ローカルサーバーを公開
ngrok http 8787
```

ngrokのURLをDiscord Developer PortalのInteraction Endpoint URLに設定すると、
ローカルでDiscordからのリクエストを受け取れます。

## 4. デバッグのコツ

### console.logを活用
```javascript
console.log('Channel ID:', channelId);
console.log('Messages:', messages);
```

### エラーハンドリング
```javascript
if (!response.ok) {
  const errorText = await response.text();
  console.error('Error details:', errorText);
}
```

### Wranglerのログ確認
```bash
# 本番環境のログ
npx wrangler tail

# ローカル開発時はコンソールに直接出力される
```

## トラブルシューティング

### 404 Unknown Channel
- チャンネルIDが正しいか確認
- BotがそのチャンネルにアクセスできるかDiscordで確認

### 401 Unauthorized
- Bot Tokenが正しいか確認
- `.env`ファイルが読み込まれているか確認

### メッセージ履歴が取得できない
- Botに「メッセージ履歴を読む」権限があるか確認
- Discord Developer Portal > Bot > Privileged Gateway Intentsで
  「MESSAGE CONTENT INTENT」を有効にする