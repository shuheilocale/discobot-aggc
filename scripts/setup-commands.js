/**
 * Discord Slash Commands Registration Script
 * Run this script to register slash commands for your Discord bot
 */

const DISCORD_API_BASE = 'https://discord.com/api/v10';

async function registerCommands() {
  const APPLICATION_ID = process.env.DISCORD_APPLICATION_ID;
  const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

  if (!APPLICATION_ID || !BOT_TOKEN) {
    console.error('Please set DISCORD_APPLICATION_ID and DISCORD_BOT_TOKEN in .env file');
    process.exit(1);
  }

  const commands = [
    {
      name: 'gori',
      description: 'ゴリ本部長と話す',
      options: [
        {
          type: 3, // STRING
          name: 'message',
          description: 'ゴリ本部長に言いたいこと',
          required: true,
        }
      ]
    },
    {
      name: 'godgori',
      description: 'ゴッドゴリと話す',
      options: [
        {
          type: 3, // STRING
          name: 'message',
          description: 'ゴッドゴリに言いたいこと',
          required: true,
        }
      ]
    },
    {
      name: 'memo',
      description: 'メモを保存します',
      options: [
        {
          type: 3, // STRING
          name: 'content',
          description: '保存するメモの内容',
          required: true,
        }
      ]
    },
    {
      name: 'list',
      description: '保存したメモの一覧を表示します',
    },
    {
      name: 'delete',
      description: 'メモを削除します',
      options: [
        {
          type: 4, // INTEGER
          name: 'id',
          description: '削除するメモのID',
          required: true,
        }
      ]
    }
  ];

  try {
    const response = await fetch(
      `${DISCORD_API_BASE}/applications/${APPLICATION_ID}/commands`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bot ${BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commands),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to register commands: ${error}`);
    }

    const data = await response.json();
    console.log('Successfully registered commands:', data);
  } catch (error) {
    console.error('Error registering commands:', error);
  }
}

// Load environment variables
import('dotenv').then(dotenv => {
  dotenv.config();
  registerCommands();
}).catch(() => {
  console.log('Running without dotenv (CI/CD environment)');
  registerCommands();
});