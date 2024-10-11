//discord realtime api bot
require('dotenv').config();
// const functions = require("./functions.js"); // disabled for now
const connection = require("./connect.js");

//discord
const { Client, Events, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

//openai
const { OpenAI, toFile } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_APIKEY });

//functions
async function updateBotStatus(statusType, activityType, statusName) {
  // rate limited, unknown duration // online, idle, dnd, invisible
  if (client.user.presence.status !== statusType) { client.user.setStatus(statusType); }
  // playing = 0, listening (to) = 2, watching = 3
  if (client.user.presence.type !== statusName) { client.user.setActivity(statusName, {type: activityType}); }
}

//main logic

//startup
client.once(Events.ClientReady, botUser => {
  updateBotStatus(`online`, 2, `you for input`);
  console.log(`Bot is ready.`);
});

//login
client.login(process.env.DISCORD_TOKEN);