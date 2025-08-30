# Discord Bot権限確認ガイド

## 1. Discord Developer Portalでの設定

### Privileged Gateway Intents（重要！）
1. https://discord.com/developers/applications/1411243827033018368/bot にアクセス
2. **Privileged Gateway Intents**セクションまでスクロール
3. 以下を**ON**にする：
   - ✅ **MESSAGE CONTENT INTENT** （メッセージ内容を読むために必須）
   - ✅ **SERVER MEMBERS INTENT** （メンバー情報取得用）
4. 「Save Changes」をクリック

### Bot Permissions
必要な権限：
- ✅ Read Messages/View Channels（メッセージを読む）
- ✅ Send Messages（メッセージを送信）
- ✅ Read Message History（メッセージ履歴を読む）
- ✅ Use Slash Commands（スラッシュコマンドを使用）

## 2. 正しい招待リンクの生成

1. https://discord.com/developers/applications/1411243827033018368/oauth2/url-generator
2. **SCOPES**で選択：
   - ✅ bot
   - ✅ applications.commands
3. **BOT PERMISSIONS**で選択：
   - ✅ Read Messages/View Channels
   - ✅ Send Messages
   - ✅ Read Message History
   - ✅ Use Slash Commands
   - ✅ Embed Links
4. 生成されたURLをコピー

### 更新された招待リンク：
```
https://discord.com/oauth2/authorize?client_id=1411243827033018368&permissions=68672&integration_type=0&scope=bot+applications.commands
```

## 3. Discord サーバー内での確認

1. Discordサーバーの設定を開く
2. 「ロール」セクション
3. Botのロールを探す（通常「discobot-aggt」という名前）
4. 権限を確認：
   - テキストチャンネルの権限
     - ✅ チャンネルを見る
     - ✅ メッセージを送信
     - ✅ メッセージ履歴を読む
     - ✅ スラッシュコマンドを使う

## 4. 特定チャンネルでの権限

1. チャンネルを右クリック
2. 「チャンネルの編集」
3. 「権限」タブ
4. Botのロールまたは「@discobot-aggt」を追加
5. 以下の権限を許可：
   - ✅ チャンネルを見る
   - ✅ メッセージ履歴を読む
   - ✅ メッセージを送信

## トラブルシューティング

### "Unknown Channel"エラーの場合
- Botがそのチャンネルにアクセスできない
- チャンネルの権限設定を確認

### メッセージ内容が取得できない場合
- MESSAGE CONTENT INTENTがOFFになっている
- Discord Developer Portalで有効化が必要

### 権限エラーの場合
- Botを一度キックして、新しい招待リンクで再度追加
- サーバーのロール設定を確認