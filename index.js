//discord realtime api bot

//modules
require('dotenv').config();
const { Client, Events, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, VoiceConnectionStatus, EndBehaviorType } = require('@discordjs/voice');
const WebSocket = require('ws');
const { Readable } = require('stream');
const fs = require('fs');
const path = require('path');
const prism = require('prism-media');

//discord setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

//openai ws setup
const url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";
let ws;
let connection;
let audioPlayer;

function createWavHeader(dataSize, numChannels = 1, sampleRate = 24000, bitsPerSample = 16) {
  const header = Buffer.alloc(44);
  //RIFF chunk descriptor
  header.write('RIFF', 0); // ChunkID
  header.writeUInt32LE(36 + dataSize, 4); // ChunkSize
  header.write('WAVE', 8); // Format
  //fmt sub-chunk
  header.write('fmt ', 12); // Subchunk1ID
  header.writeUInt32LE(16, 16); // Subchunk1Size
  header.writeUInt16LE(1, 20); // AudioFormat
  header.writeUInt16LE(numChannels, 22); // NumChannels
  header.writeUInt32LE(sampleRate, 24); // SampleRate
  header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28); // ByteRate
  header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32); // BlockAlign
  header.writeUInt16LE(bitsPerSample, 34); // BitsPerSample
  //data sub-chunk
  header.write('data', 36); // Subchunk2ID
  header.writeUInt32LE(dataSize, 40); // Subchunk2Size
  return header;
}

async function saveAudioBufferToFile(pcmBuffer, username) {
  const audioBuffer = Buffer.concat(pcmBuffer);
  const filePath = path.join(__dirname, 'buffer', `${username}-${Date.now()}.wav`);
  const header = createWavHeader(audioBuffer.length);
  const combinedBuffer = Buffer.concat([header, audioBuffer]);
  await fs.promises.writeFile(filePath, combinedBuffer);
  console.log(`wav file saved to ${filePath}`);
}

async function sendAudioBufferToWebSocket(base64Chunk) {
  if (base64Chunk.length > 0 && ws && ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: base64Chunk
      }));
    }
    catch (error) { console.log('WebSocket Error: Audio Buffer Problem', error); }
  }
  else { console.log('WebSocket is not open or audio buffer is empty.'); }
}

async function startListening() {
  console.log('Listening to voice channel');
  const receiver = connection.receiver;
  
  //if(!ws && !)

  receiver.speaking.on('start', async (userId) => {
    try {
      const user = client.users.cache.get(userId);
      if (user) {
        console.log(`Discord detects ${user.username} started speaking`);
        const userRawStream = receiver.subscribe(userId, {
          end: {
            behavior: EndBehaviorType.AfterSilence,
            duration: 100 // ms
          }
        });

        let userPCMBuffer = []; // initialize
        const userPCMStream = userRawStream.pipe(new prism.opus.Decoder({ rate: 24000, channels: 1, frameSize: 960 }));

        userPCMStream.on('data', async (chunk) => {
          userPCMBuffer.push(chunk);
          await sendAudioBufferToWebSocket(chunk.toString('base64'));
          console.log(`${user.username} voice is being processed`);
        });

        userPCMStream.on('end', async () => {
          console.log('Saving wav file');
          await saveAudioBufferToFile(userPCMBuffer, user.username);
          ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
          ws.send(JSON.stringify({ type: 'response.create' }));
          userPCMBuffer = []; // reset
          console.log(`decoder detects ${user.username} stopped speaking, pushing response request`);
        });
      }
      else {
        console.log('Discord Error: Discord API issue.');
      }
    }
    catch (error) {
      console.log('Error handling speaking start event', error);
    }
  });

  receiver.speaking.on('stop', async (userId) => {
    console.log(`Discord detects ${user.username} stopped speaking`);
  });
}

async function startConversation() {
  console.log('Connecting to websocket');
  let wavBuffer = []; // initialize

  if (!audioPlayer) {
    console.log('Connected to audio stream');
    audioPlayer = createAudioPlayer();
  }

  ws = new WebSocket(url, { headers: {
    "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
    "OpenAI-Beta": "realtime=v1"
  }});

  ws.on('open', () => {
    console.log('Websocket connected');
  });

  const errorHandler = (error) => {
    console.log(`API 'type' error:`, error.type);
    console.log(`API 'code' error:`, error.code);
    console.log(`API 'message' error:`, error.message);
    console.log(`API 'param' error:`, error.param);
    console.log(`API 'event_id' error:`, error.event_id);
  };

  ws.on('message', async (message) => {
    const response = JSON.parse(message.toString());
    if (response.type === 'error') {
      const { error } = response;
      errorHandler(error);
    }
    else if (response.type === "response.audio.delta") {
      try {
        connection.subscribe(audioPlayer);
        console.log('Received audio package from API');
        const audioChunk = Buffer.from(response.delta, 'base64');
        wavBuffer.push(audioChunk);

        const apiPCMStream = new Readable();
        apiPCMStream.push(audioChunk);
        apiPCMStream.push(null); // one chunk at a time

        const ffmpeg = new prism.FFmpeg({
          // in: 16-bit little-endian PCM 24 kHz mono -> stdin pipe -> out: 16-bit little-endian PCM 48 kHz stereo
          args: ['-f', 's16le', '-ar', '24000', '-ac', '1', '-i', 'pipe:0', '-f', 's16le', '-ar', '48000', '-ac', '2']
        });

        const pcmStream = apiPCMStream.pipe(ffmpeg);
        const opusEncoder = new prism.opus.Encoder({ rate: 48000, channels: 2, frameSize: 960 });
        const opusStream = pcmStream.pipe(opusEncoder);
        const resource = createAudioResource(opusStream);

        audioPlayer.play(resource);
      }
      catch (error) { console.log('Error processing audio delta response', error); }
    } 
    else if (response.type === "response.audio.done") {
      try {
        console.log('creating wav file');
        const combinedBuffer = Buffer.concat(wavBuffer);
        await saveAudioBufferToFile([combinedBuffer], 'openai-response');
        wavBuffer = []; // reset
      }
      catch (error) { console.log('Error processing audio done response', error); }
    }
    else { console.log('Received non-audio message from OpenAI API:', response); }
  });

  ws.on('error', (error) => {
    console.log('WebSocket Error', error);
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
    ws = null;
  });
}

async function connectChannel(interaction) {
  if(interaction) { console.log('Received /connect command'); }
  const userChannel = interaction.member.voice.channel;
  console.log(`Connecting to voice channel: ${userChannel.name}`);
  if (!userChannel) {
    console.log('User is not in a voice channel');
    await interaction.editReply({ content: 'You need to be in a voice channel to use this command!', ephemeral: true });
    return;
  }

  connection = joinVoiceChannel({
    channelId: userChannel.id,
    guildId: userChannel.guild.id,
    adapterCreator: userChannel.guild.voiceAdapterCreator,
    selfDeaf: false,
    selfMute: false
  });

  connection.on(VoiceConnectionStatus.Ready, async () => {
    console.log('Connected to voice channel');
    try { await interaction.editReply({ content: 'Connected to voice channel' }); }
    catch (error) { console.log('Error replying to interaction', error); }
    try { await startConversation(); }
    catch (error) { console.log('Error starting startConversation()', error); }
    try { await startListening(); }
    catch (error) { console.log('Error starting startListening()', error); }
  });

  connection.on(VoiceConnectionStatus.Disconnected, () => {
    console.log('Disconnected from voice channel');
  });

  connection.on('error', (error) => {
    console.log('Voice connection error', error);
  });
}

async function disconnectChannel(interaction) {
  if(interaction) { console.log('Received /disconnect command'); }
  if (connection) {
    console.log('Disconnecting from voice channel');
    connection.destroy();
    connection = null;
    audioPlayer = null;
  }
  else {
    console.log('No active voice channel connection');
  }
  if (ws) {
    console.log('Closing WebSocket connection');
    ws.close();
    ws = null;
  }
  else {
    console.log('No active websocket connection');
  }
}

// Slash commands handler
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isCommand()) { return; }
  try {
    await interaction.deferReply();
    if (interaction.commandName === 'connect') { await connectChannel(interaction); }
    else if (interaction.commandName === 'disconnect') { await disconnectChannel(interaction); }
  }
  catch (error) {
    console.log('Error handling interaction', error);
    if (!interaction.replied && !interaction.deferred) {
      try { await interaction.reply({ content: 'An error occurred while processing your request.', ephemeral: true }); }
      catch (replyError) { console.log('Error sending reply', replyError); }
    }
  }
});

// Shutdown
const shutdown = async () => {
  console.log('Shutting down');
  await disconnectChannel();
  await client.destroy();
  process.exit(0);
};

process.on('SIGINT', () => shutdown());
process.on('SIGTERM', () => shutdown());

// Startup
client.on(Events.ClientReady, async () => {
  console.log('Starting up');
  const commands = [
    new SlashCommandBuilder().setName('connect').setDescription('Connect to the voice channel'),
    new SlashCommandBuilder().setName('disconnect').setDescription('Disconnect from the voice channel'),
  ];
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    console.log('Registering slash commands');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log('Bot is ready');
  }
  catch (error) { console.log('Error registering slash commands', error); }
});

// Login
console.log('Logging in to discord');
client.login(process.env.DISCORD_TOKEN);