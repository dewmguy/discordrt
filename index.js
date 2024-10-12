// Import necessary modules
require('dotenv').config();
const { Client, Events, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, VoiceConnectionStatus, EndBehaviorType } = require('@discordjs/voice');
const WebSocket = require('ws');
const prism = require('prism-media');
const { Readable } = require('stream');
const fs = require('fs');
const path = require('path');

// Discord client setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// OpenAI WebSocket setup
const url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";
let ws;
let audioResponseBuffer = [];

// Connect to a voice channel
let connection;
let audioPlayer;

async function connectToChannel(interaction) {
  const channel = interaction.member.voice.channel;
  if (!channel) {
    console.log('User is not in a voice channel');
    await interaction.editReply({ content: 'You need to be in a voice channel to use this command!', ephemeral: true });
    return;
  }

  console.log(`Connecting to voice channel: ${channel.name}`);
  connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfDeaf: false,
    selfMute: false
  });

  connection.on(VoiceConnectionStatus.Ready, async () => {
    console.log('Connected to voice channel');
    try { await interaction.editReply({ content: 'Connected to voice channel' }); }
    catch (error) { console.error('Error replying to interaction', error); }
    try { await startConversation(); }
    catch (error) { console.error('Error starting conversation', error); }
    try { await startListening(); }
    catch (error) { console.error('Error starting to listen', error); }
  });

  connection.on(VoiceConnectionStatus.Disconnected, () => {
    console.log('Disconnected from voice channel');
  });

  connection.on('error', (error) => {
    console.error('Voice connection error', error);
  });
}

// Disconnect from a voice channel
async function disconnectFromChannel(interaction) {
  console.log('Received /disconnect command');
  if (connection) {
    console.log('Disconnecting from the voice channel');
    connection.destroy();
    connection = null;
    if (ws) {
      console.log('Closing WebSocket connection');
      ws.close();
      ws = null;
    }
    audioPlayer = null;
    audioResponseBuffer = [];
    try { await interaction.editReply({ content: 'Disconnected from the voice channel!' }); }
    catch (error) { console.error('Error replying to interaction', error); }
  }
  else {
    console.log('No active voice channel connection to disconnect from');
    try { await interaction.editReply({ content: 'I am not connected to any voice channel!' }); }
    catch (error) { console.error('Error replying to interaction', error); }
  }
}

// Save audio buffer to file for verification
async function saveAudioBufferToFile(audioBuffer, username) {
  const finalBuffer = Buffer.concat(audioBuffer);
  const filePath = path.join(__dirname, 'buffer', `${username}-${Date.now()}.wav`);

  // Correct WAV header creation
  const header = Buffer.alloc(44);
  const dataSize = finalBuffer.length;

  // 'RIFF' chunk descriptor
  header.write('RIFF', 0); // ChunkID
  header.writeUInt32LE(36 + dataSize, 4); // ChunkSize
  header.write('WAVE', 8); // Format

  // 'fmt ' sub-chunk
  header.write('fmt ', 12); // Subchunk1ID
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  header.writeUInt16LE(1, 22); // NumChannels (1 for mono)
  header.writeUInt32LE(24000, 24); // SampleRate (24000 Hz)
  header.writeUInt32LE(24000 * 2, 28); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  header.writeUInt16LE(2, 32); // BlockAlign (NumChannels * BitsPerSample/8)
  header.writeUInt16LE(16, 34); // BitsPerSample (16 bits)

  // 'data' sub-chunk
  header.write('data', 36); // Subchunk2ID
  header.writeUInt32LE(dataSize, 40); // Subchunk2Size

  // Combine header and audio data
  const combinedBuffer = Buffer.concat([header, finalBuffer]);

  await fs.promises.writeFile(filePath, combinedBuffer);
  console.log(`Audio saved to ${filePath}`);
}

function floatTo16BitPCM(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

function base64EncodeAudio(float32Array) {
  const arrayBuffer = floatTo16BitPCM(float32Array);
  let binary = '';
  let bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000; // 32KB chunk size
  for (let i = 0; i < bytes.length; i += chunkSize) {
    let chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

function base64DecodeToAudioStream(base64String) {
  // Decode the base64 string to binary data
  const audioBuffer = Buffer.from(base64String, 'base64');

  // Create a readable stream from the buffer
  const stream = new Readable();
  stream.push(audioBuffer);
  stream.push(null); // Signals the end of the stream

  return stream;
}

// Send audio buffer to OpenAI WebSocket
async function sendAudioBufferToWebSocket(audioBuffer) {
  if (audioBuffer.length > 0 && ws && ws.readyState === WebSocket.OPEN) {
    const base64Chunk = base64EncodeAudio(audioBuffer);
    try {
      ws.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: base64Chunk
      }));
      ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
      ws.send(JSON.stringify({ type: 'response.create' }));
    }
    catch (error) { console.error('Error sending audio buffer to WebSocket', error); }
  }
  else { console.log('WebSocket is not open or audio buffer is empty.'); }
}

// Start listening to the user in the voice channel
async function startListening() {
  console.log('Listening to voice channel');
  const receiver = connection.receiver;

  receiver.speaking.on('start', async (userId) => {
    try {
      const user = client.users.cache.get(userId);
      if (user) {
        console.log(`${user.username} started speaking, opening audio stream`);
        const audioStream = receiver.subscribe(userId, {
          end: {
            behavior: EndBehaviorType.AfterSilence,
            duration: 100
          }
        });

        const pcmStream = audioStream.pipe(new prism.opus.Decoder({
          rate: 24000,
          channels: 1,
          frameSize: 960
        }));

        let audioBuffer = [];
        pcmStream.on('data', (chunk) => {
          console.log(`Receiving audio data from ${user.username}`);
          audioBuffer.push(chunk);
        });

        pcmStream.on('end', async () => {
          console.log(`${user.username} stopped speaking, closed audio stream`);
          await saveAudioBufferToFile(audioBuffer, user.username);
          await sendAudioBufferToWebSocket(audioBuffer);
        });
      }
    }
    catch (error) { console.error('Error handling speaking start event', error); }
  });
}

// Start conversation with OpenAI Real-Time API
async function startConversation() {
  console.log('Connecting to websocket');
  ws = new WebSocket(url, { headers: getWebSocketHeaders() });

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
        console.log('Received audio message from OpenAI API:', response);
        const audioChunk = Buffer.from(response.delta, 'base64');
        audioResponseBuffer.push(audioChunk);
      }
      catch (error) { console.error('Error processing audio delta response', error); }
    }
    else if (response.type === "response.audio.done") {
      try {
        console.log('Received response.audio.done from OpenAI API, combining audio chunks.');
        const combinedBuffer = Buffer.concat(audioResponseBuffer);
        audioResponseBuffer = [];

        // Save audio to file before playing it
        await saveAudioBufferToFile([combinedBuffer], 'openai-response');

        const stream = new Readable();
        stream.push(combinedBuffer);
        stream.push(null);

        const ffmpeg = new prism.FFmpeg({
          args: [
            '-f', 's16le',          // Input format: signed 16-bit little-endian PCM
            '-ar', '24000',         // Input sample rate: 24 kHz
            '-ac', '1',             // Input channels: mono
            '-i', 'pipe:0',         // Input from stdin (piped in)
            '-f', 's16le',          // Output format: signed 16-bit little-endian PCM
            '-ar', '48000',         // Output sample rate: 48 kHz
            '-ac', '1'              // Output channels: mono
          ]
        });

        const pcmStream = stream.pipe(ffmpeg);
        const resource = createAudioResource(pcmStream);

        if (!audioPlayer) {
          audioPlayer = createAudioPlayer();
          connection.subscribe(audioPlayer);
        }
        audioPlayer.play(resource);
      }
      catch (error) { console.error('Error processing audio done response', error); }
    }
    else {
      console.log('Received non-audio message from OpenAI API:', response);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket Error', error);
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
    ws = null;
  });
}

// WebSocket headers
function getWebSocketHeaders() {
  return {
    "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
    "OpenAI-Beta": "realtime=v1",
    ...(process.env.PROJECT ? { "OpenAI-Project": process.env.PROJECT } : {})
  };
}

// Slash commands handler
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isCommand()) { return; }
  console.log(`Received command: /${interaction.commandName}`);
  try {
    await interaction.deferReply();
    if (interaction.commandName === 'connect') { await connectToChannel(interaction); }
    else if (interaction.commandName === 'disconnect') { await disconnectFromChannel(interaction); }
  }
  catch (error) {
    console.error('Error handling interaction', error);
    if (!interaction.replied && !interaction.deferred) {
      try { await interaction.reply({ content: 'An error occurred while processing your request.', ephemeral: true }); }
      catch (replyError) { console.error('Error sending reply', replyError); }
    }
  }
});

// Startup
client.on(Events.ClientReady, async () => {
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
  catch (error) { console.error('Error registering slash commands', error); }
});

// Login
console.log('Logging in to discord');
client.login(process.env.DISCORD_TOKEN);