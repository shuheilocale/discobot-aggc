/**
 * Cloudflare Worker for Discord Bot with D1 Database
 */

import { getSystemPrompt } from './system-prompt.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Discord Webhook endpoint
    if (url.pathname === '/discord' && request.method === 'POST') {
      return handleDiscordWebhook(request, env);
    }

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response('OK', { status: 200 });
    }

    return new Response('Not Found', { status: 404 });
  },
};

async function verifyDiscordRequest(request, env) {
  const signature = request.headers.get('X-Signature-Ed25519');
  const timestamp = request.headers.get('X-Signature-Timestamp');

  if (!signature || !timestamp) {
    return false;
  }

  const body = await request.clone().text();

  try {
    const encoder = new TextEncoder();
    const publicKey = await crypto.subtle.importKey(
      'raw',
      hexToBytes(env.DISCORD_PUBLIC_KEY),
      { name: 'Ed25519', namedCurve: 'Ed25519' },
      false,
      ['verify']
    );

    const message = encoder.encode(timestamp + body);
    const signatureBytes = hexToBytes(signature);

    return await crypto.subtle.verify(
      'Ed25519',
      publicKey,
      signatureBytes,
      message
    );
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

async function handleDiscordWebhook(request, env) {
  try {
    // Verify Discord signature
    const isValid = await verifyDiscordRequest(request, env);
    if (!isValid) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();

    // Handle Discord interaction
    if (body.type === 1) {
      // Ping interaction
      return new Response(JSON.stringify({ type: 1 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Handle application commands
    if (body.type === 2) {
      return handleCommand(body, env);
    }

    // Handle message components (buttons, select menus)
    if (body.type === 3) {
      return handleMessageComponent(body, env);
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error handling Discord webhook:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

async function handleCommand(interaction, env) {
  const { data, member, user } = interaction;
  const userId = member?.user?.id || user?.id;
  const command = data.name.toLowerCase();

  try {
    switch (command) {
      case 'memo':
        return handleMemoCommand(data.options, userId, env);
      case 'list':
        return handleListCommand(userId, env);
      case 'delete':
        return handleDeleteCommand(data.options, userId, env);
      case 'gori':
      case 'ゴリ':
        return handleGoriCommand(data.options, interaction, env);
      default:
        return createResponse('不明なコマンドです。');
    }
  } catch (error) {
    console.error('Error handling command:', error);
    return createResponse('エラーが発生しました。');
  }
}

async function handleMemoCommand(options, userId, env) {
  const content = options?.find(opt => opt.name === 'content')?.value;

  if (!content) {
    return createResponse('なんか書けや。知らんけど。');
  }

  try {
    await env.DB.prepare(
      'INSERT INTO memos (user_id, content) VALUES (?, ?)'
    ).bind(userId, content).run();

    return createResponse(`はいはい、メモっといたけんね。「${content}」って。\nまぁ後で見るかどうかは知らんけど。じゃ、俺帰るけん。`);
  } catch (error) {
    console.error('Error saving memo:', error);
    return createResponse('あー面倒くせぇ。メモ保存できんかったわ。もう一回やり直して。俺は知らんけんね。');
  }
}

async function handleListCommand(userId, env) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT id, content, created_at FROM memos WHERE user_id = ? ORDER BY created_at DESC LIMIT 10'
    ).bind(userId).all();

    if (results.length === 0) {
      return createResponse('メモなんか一個もないやん。なんも書いとらんのに見るもんないやろ。知らんけど。');
    }

    const memoList = results.map((memo, index) =>
      `${index + 1}. [ID:${memo.id}] ${memo.content}`
    ).join('\n');

    return createResponse(`あー面倒くせぇけど、一応メモ見せたるわ。\n\n${memoList}\n\nほら、これでいい？俺もう帰るけん。あとよろしくぅ。`);
  } catch (error) {
    console.error('Error listing memos:', error);
    return createResponse('メモ見ようとしたけど、なんかエラー出たわ。俺管理せんけん。もう一回やって。');
  }
}

async function handleDeleteCommand(options, userId, env) {
  const memoId = options?.find(opt => opt.name === 'id')?.value;

  if (!memoId) {
    return createResponse('ID書けや。何消したいんか分からんやろ。ふぇっふぁっふぁぇっ。');
  }

  try {
    const result = await env.DB.prepare(
      'DELETE FROM memos WHERE id = ? AND user_id = ?'
    ).bind(memoId, userId).run();

    if (result.meta.changes === 0) {
      return createResponse(`ID:${memoId}？そんなメモないけど。俺そんなこと言ったっけ。知らんけんね。`);
    }

    return createResponse(`はいはい、ID:${memoId}のメモ消しといたけん。\nまぁ消したところで俺は困らんけど。じゃ、先帰るけん。`);
  } catch (error) {
    console.error('Error deleting memo:', error);
    return createResponse('削除しようとしたけど失敗したわ。俺のせいじゃないけんね。しゃーしー。');
  }
}

async function handleMessageComponent() {
  // Handle button clicks and select menu interactions
  return createResponse('コンポーネントのインタラクションを受け取りました。');
}

function createResponse(content, ephemeral = false) {
  return new Response(JSON.stringify({
    type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
    data: {
      content,
      flags: ephemeral ? 64 : 0, // EPHEMERAL flag
    },
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// ゴリ本部長との会話を処理
async function handleGoriCommand(options, interaction, env) {
  const message = options?.find(opt => opt.name === 'message')?.value;

  if (!message) {
    return createResponse('なんか言えや。知らんけど。');
  }

  // チャンネルIDとギルドIDを取得
  const channelId = interaction.channel_id || interaction.channel?.id;
  const guildId = interaction.guild_id;

  // 直近のメッセージ履歴を取得（ギルドIDも渡す）
  const messageHistory = await fetchRecentMessages(channelId, guildId, env);

  // 現在のユーザーのニックネームを取得
  const currentUserNickname = interaction.member?.nick || interaction.member?.user?.username || interaction.user?.username || 'User';

  // コンテキストを含めてAIに送信
  const contextPrompt = await buildContextPrompt(messageHistory, message, currentUserNickname, env);
  const aiResponse = await generateAIResponse(contextPrompt, env);

  return createResponse(aiResponse);
}

// Discord APIから直近のメッセージを取得（ニックネーム対応）
async function fetchRecentMessages(channelId, guildId, env) {
  try {
    console.log('Fetching messages from channel:', channelId);

    const response = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages?limit=10`,
      {
        headers: {
          'Authorization': `Bot ${env.DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch messages:', response.status, errorText);
      return [];
    }

    const messages = await response.json();
    console.log('Fetched messages count:', messages.length);

    // ギルドメンバー情報を取得してニックネームを追加
    if (guildId) {
      for (const msg of messages) {
        if (msg.author && !msg.author.bot) {
          const nickname = await fetchMemberNickname(guildId, msg.author.id, env);
          msg.author.nickname = nickname || msg.author.username;
        }
      }
    }

    // 古い順に並び替え
    return messages.reverse();
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}

// ギルドメンバーのニックネームを取得
async function fetchMemberNickname(guildId, userId, env) {
  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${userId}`,
      {
        headers: {
          'Authorization': `Bot ${env.DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      return null;
    }

    const member = await response.json();
    return member.nick || member.user?.username;
  } catch (error) {
    console.error('Error fetching member nickname:', error);
    return null;
  }
}

// メッセージ履歴からコンテキストプロンプトを構築
async function buildContextPrompt(messageHistory, currentMessage, currentUserNickname, env) {
  // システムプロンプトを取得
  const systemPrompt = await getSystemPrompt(env);

  if (!messageHistory || messageHistory.length === 0) {
    console.log('No message history available');
    return `${systemPrompt}\n\n${currentUserNickname}: ${currentMessage}\n\nAssistant:`;
  }

  let context = `${systemPrompt}\n\n以下は最近の会話履歴です：\n\n`;

  for (const msg of messageHistory) {
    // Botのメッセージかユーザーのメッセージか判定
    // ニックネームがあればそれを使用、なければユーザー名を使用
    const author = msg.author?.bot ? 'Assistant' : (msg.author?.nickname || msg.author?.username || 'User');
    const content = msg.content;

    if (content) {
      context += `${author}: ${content}\n`;
    }
  }

  context += `\n${currentUserNickname}: ${currentMessage}\n\nAssistant:`;

  console.log('Built context with nicknames, system prompt and history');

  return context;
}

// Gemini models in priority order (best to worst)
const GEMINI_MODELS = [
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
];

// Gemini API integration with fallback for rate limits
async function generateAIResponse(prompt, env) {
  let lastError = null;

  // Try each model in order until one succeeds
  for (const model of GEMINI_MODELS) {
    try {
      console.log(`Trying Gemini model: ${model}`);

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API error for model ${model}:`, errorText);

        // Check if it's a rate limit error (429) or quota exceeded
        if (response.status === 429 || errorText.includes('quota') || errorText.includes('rate')) {
          lastError = `Model ${model} rate limited`;
          continue; // Try next model
        }

        // For other errors, throw immediately
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const responseText = data.candidates[0]?.content?.parts[0]?.text;

      if (responseText) {
        console.log(`Successfully generated response with model: ${model}`);
        return responseText;
      }

      // If no response text, try next model
      lastError = `Model ${model} returned empty response`;
      continue;

    } catch (error) {
      console.error(`Error with model ${model}:`, error);
      lastError = error;

      // If it's a rate limit or quota error, try the next model
      if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('rate')) {
        continue;
      }

      // For other errors, stop trying
      break;
    }
  }

  // All models failed
  console.error('All Gemini models failed:', lastError);
  return 'ちょっと今忙しいけん、後でまた聞いて。知らんけど。';
}