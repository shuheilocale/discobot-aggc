import os
import discord
from discord.ext import commands
import google.generativeai as genai
from dotenv import load_dotenv
from typing import List, Optional
import asyncio
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

class DiscordBot(commands.Bot):
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        intents.messages = True
        super().__init__(command_prefix='!', intents=intents)
        
        # Gemini APIの初期化
        genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
        self.model = genai.GenerativeModel('gemini-pro')
        
        # メモ機能用のストレージ（本番ではDBを使用）
        self.memos = {}
    
    async def on_ready(self):
        logger.info(f'{self.user} has connected to Discord!')
    
    async def on_message(self, message: discord.Message):
        if message.author == self.user:
            return
        
        # ボットがメンションされた場合
        if self.user.mentioned_in(message):
            await self.handle_mention(message)
        
        await self.process_commands(message)
    
    async def handle_mention(self, message: discord.Message):
        """メンションされた時の処理"""
        content = message.content.replace(f'<@{self.user.id}>', '').strip()
        
        # メモ関連のコマンド処理
        if any(keyword in content.lower() for keyword in ['memo', 'メモ', 'remember', '覚えて']):
            await self.save_memo(message)
        elif any(keyword in content.lower() for keyword in ['forget', '忘れて', 'delete', '削除']):
            await self.delete_memo(message)
        elif any(keyword in content.lower() for keyword in ['list', '一覧', 'show', '見せて']):
            await self.list_memos(message)
        else:
            # 通常の会話処理
            await self.generate_response(message)
    
    async def get_recent_messages(self, channel: discord.TextChannel, limit: int = 5) -> List[discord.Message]:
        """チャンネルから最近のメッセージを取得"""
        messages = []
        async for msg in channel.history(limit=limit):
            messages.append(msg)
        return list(reversed(messages))
    
    async def generate_response(self, message: discord.Message):
        """Gemini APIを使用して返答を生成"""
        try:
            # 最近のメッセージを取得
            recent_messages = await self.get_recent_messages(message.channel, limit=10)
            
            # コンテキストを構築
            context = "以下は最近の会話履歴です:\n\n"
            for msg in recent_messages:
                author = "Bot" if msg.author == self.user else msg.author.name
                context += f"{author}: {msg.content}\n"
            
            prompt = f"{context}\n\n上記の会話履歴を踏まえて、最後のメッセージに対して自然な返答をしてください。"
            
            # Gemini APIで応答生成
            response = self.model.generate_content(prompt)
            
            if response.text:
                await message.reply(response.text[:2000])  # Discord's message limit
            else:
                await message.reply("申し訳ありません、応答を生成できませんでした。")
                
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            await message.reply("エラーが発生しました。")
    
    async def save_memo(self, message: discord.Message):
        """メモを保存"""
        user_id = str(message.author.id)
        content = message.content.replace(f'<@{self.user.id}>', '').strip()
        
        # メモコマンドを除去
        for keyword in ['memo', 'メモ', 'remember', '覚えて']:
            content = content.replace(keyword, '').strip()
        
        if not content:
            await message.reply("メモする内容を教えてください。")
            return
        
        if user_id not in self.memos:
            self.memos[user_id] = []
        
        self.memos[user_id].append({
            'content': content,
            'timestamp': message.created_at.isoformat()
        })
        
        await message.reply(f"メモを保存しました: {content}")
    
    async def delete_memo(self, message: discord.Message):
        """メモを削除"""
        user_id = str(message.author.id)
        
        if user_id not in self.memos or not self.memos[user_id]:
            await message.reply("メモがありません。")
            return
        
        # 簡単のため、最後のメモを削除
        deleted = self.memos[user_id].pop()
        
        if not self.memos[user_id]:
            del self.memos[user_id]
        
        await message.reply(f"メモを削除しました: {deleted['content']}")
    
    async def list_memos(self, message: discord.Message):
        """メモ一覧を表示"""
        user_id = str(message.author.id)
        
        if user_id not in self.memos or not self.memos[user_id]:
            await message.reply("メモがありません。")
            return
        
        memo_list = "📝 あなたのメモ一覧:\n\n"
        for i, memo in enumerate(self.memos[user_id], 1):
            memo_list += f"{i}. {memo['content']}\n"
        
        await message.reply(memo_list[:2000])  # Discord's message limit

def run_bot():
    bot = DiscordBot()
    bot.run(os.getenv('DISCORD_BOT_TOKEN'))