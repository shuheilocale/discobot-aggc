/**
 * Clear all Discord slash commands
 * Run this before re-registering commands if they're stuck
 */

const DISCORD_API_BASE = 'https://discord.com/api/v10';

async function clearCommands() {
  const APPLICATION_ID = process.env.DISCORD_APPLICATION_ID;
  const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
  
  if (!APPLICATION_ID || !BOT_TOKEN) {
    console.error('Please set DISCORD_APPLICATION_ID and DISCORD_BOT_TOKEN in .env file');
    process.exit(1);
  }
  
  try {
    // Clear global commands
    const response = await fetch(
      `${DISCORD_API_BASE}/applications/${APPLICATION_ID}/commands`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bot ${BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([]), // Empty array clears all commands
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to clear commands: ${error}`);
    }
    
    console.log('Successfully cleared all commands');
  } catch (error) {
    console.error('Error clearing commands:', error);
  }
}

// Load environment variables
import('dotenv').then(dotenv => {
  dotenv.config();
  clearCommands();
}).catch(() => {
  console.log('Running without dotenv (CI/CD environment)');
  clearCommands();
});