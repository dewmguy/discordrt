//discord realtime api bot
// saves audio captured by users and the api into wav files

//modules
require('dotenv').config();
const { Client, Events, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, VoiceConnectionStatus, EndBehaviorType } = require('@discordjs/voice');
const WebSocket = require('ws');
const { Readable } = require('stream');
const prism = require('prism-media');
const path = require('path');
const fs = require('fs');

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
  const filePath = path.join(__dirname, 'debug', `${username}-${Date.now()}.wav`);
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
    catch (error) { console.log('error: websocket audio buffer problem', error); }
  }
  else { console.log('error: websocket is not open or audio buffer is empty'); }
}

async function startListening() {
  console.log('listening to voice channel');
  const receiver = connection.receiver;
  
  receiver.speaking.on('start', async (userId) => {
    try {
      const user = client.users.cache.get(userId);
      if (user) {
        console.log(`${user.username} started speaking`);
        ws.send(JSON.stringify({ type: 'response.cancel' }));

        if (audioPlayer) {
          console.log('detected user speech, halting audio');
          audioPlayer.stop();
          wavBuffer = [];
        }

        const userRawStream = receiver.subscribe(userId, {
          end: {
            behavior: EndBehaviorType.AfterSilence,
            duration: 100 // ms
          }
        });

        let userPCMBuffer = []; // initialize
        const userPCMStream = userRawStream.pipe(new prism.opus.Decoder({ rate: 24000, channels: 1, frameSize: 960 }));

        userPCMStream.on('data', async (chunk) => {
          console.log(`${user.username} voice processing`);
          await sendAudioBufferToWebSocket(chunk.toString('base64'));
          userPCMBuffer.push(chunk);
        });

        userPCMStream.on('end', async () => {
          console.log(`${user.username} stopped speaking`);
          ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
          ws.send(JSON.stringify({ type: 'response.create' }));
          await saveAudioBufferToFile(userPCMBuffer, user.username);
          userPCMBuffer = []; // reset
        });
      }
      else { console.log('error: discord api issue'); }
    }
    catch (error) { console.log('error: mishandling speaking event', error); }
  });
}

async function startConversation() {
  console.log('connecting to websocket');
  let wavBuffer = []; // initialize

  if (!audioPlayer) {
    audioPlayer = createAudioPlayer(); // await?
    console.log('connected to audio stream');
  }

  ws = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01', {
    headers: {
      "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
      "OpenAI-Beta": "realtime=v1"
    }
  });

  ws.on('open', () => {
    console.log('openai: websocket connected');
    ws.send(JSON.stringify({
      type: 'session.update',
      session: {
        instructions: "You don't know anything after October 2023. You are helpful and nice, but you don't like the sound of your own voice. Be charming, funny, and sarcastic, but be terse.",
        voice: 'alloy' // alloy, echo, shimmer (soon: fable, onyx, nova)
      }
    }));
  });

  ws.on('message', async (message) => {
    const response = JSON.parse(message.toString());
    if (response.type === 'error') {
      const { error } = response;
      console.log('openai:', error.message);
    }
    else if (response.type === "response.audio_transcript.done") { console.log('openai:', response.transcript); }
    else if (response.type === "response.audio.delta") {
      try {
        console.log('openai: response.audio.delta');
        const audioChunk = Buffer.from(response.delta, 'base64');
        wavBuffer.push(audioChunk);
      }
      catch (error) { console.log('error: failure to process audio delta response', error); }
    } 
    else if (response.type === "response.audio.done") {
      try {
        const combinedBuffer = Buffer.concat(wavBuffer);
        wavBuffer = []; // reset
        await saveAudioBufferToFile([combinedBuffer], 'openai-response');

        const apiPCMStream = new Readable();
        apiPCMStream.push(combinedBuffer);
        apiPCMStream.push(null); // close

        const ffmpeg = new prism.FFmpeg({
          // in: 16-bit little-endian PCM 24 kHz mono -> stdin pipe -> out: 16-bit little-endian PCM 48 kHz stereo
          args: ['-f', 's16le', '-ar', '24000', '-ac', '1', '-i', 'pipe:0', '-f', 's16le', '-ar', '48000', '-ac', '1']
        });

        const pcmStream = apiPCMStream.pipe(ffmpeg);
        const opusEncoder = new prism.opus.Encoder({ rate: 48000, channels: 1, frameSize: 960 });
        const opusStream = pcmStream.pipe(opusEncoder);
        const resource = createAudioResource(opusStream);

        connection.subscribe(audioPlayer);
        audioPlayer.play(resource);
      }
      catch (error) { console.log('error: failure to process audio done response', error); }
    }
    else { console.log('openai:', response.type); }
  });

  ws.on('error', (error) => {
    console.log('openai: websocket error', error);
  });

  ws.on('close', () => {
    console.log('openai: websocket disconnected');
    ws = null;
    disconnectChannel();
  });
}

async function connectChannel(interaction) {
  const userChannel = interaction.member.voice.channel;
  console.log(`connecting to channel: ${userChannel.name}`);
  if (!userChannel) {
    console.log('error: user is not in a channel');
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
    console.log('connected to voice channel');
    try { await interaction.editReply({ content: 'Connected to voice channel!' }); }
    catch (error) { console.log('error: failure to reply to discord interaction', error); }
    try { await startListening(); }
    catch (error) { console.log('error: startListening() broke', error); }
    try { await startConversation(); }
    catch (error) { console.log('error: startConversation() broke', error); }
  });

  connection.on(VoiceConnectionStatus.Disconnected, () => {
    console.log('disconnected from voice');
  });

  connection.on('error', (error) => {
    console.log('error: issue with voice connectivity', error);
  });
}

async function disconnectChannel() {
  if (connection) {
    console.log('warning: disconnecting from voice');
    connection.destroy();
    connection = null;
    audioPlayer = null;
  }
  else { console.log('warning: no active voice connection'); }
  if (ws) {
    console.log('warning: disconnecting websocket');
    ws.close();
    ws = null;
  }
  else { console.log('warning: no active websocket'); }
}

// Slash commands handler
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isCommand()) { return; }
  if(interaction) { console.log(`received /${interaction.commandName} command`); }
  try {
    await interaction.deferReply();
    if (interaction.commandName === 'connect') { await connectChannel(interaction); }
    else if (interaction.commandName === 'disconnect') { await disconnectChannel(); }
  }
  catch (error) {
    console.log('error: mishandling discord interaction', error);
    if (!interaction.replied && !interaction.deferred) {
      try { await interaction.reply({ content: 'An error occurred while processing your request.', ephemeral: true }); }
      catch (replyError) { console.log('error: could not send interaction reply', replyError); }
    }
  }
});

// Shutdown
const shutdown = async () => {
  console.log('');
  console.log('bot shutting down');
  await disconnectChannel();
  await client.destroy();
  process.exit(0);
};

process.on('SIGINT', () => shutdown());
process.on('SIGTERM', () => shutdown());

// Startup
client.on(Events.ClientReady, async () => {
  console.log('bot starting up');
  const commands = [
    new SlashCommandBuilder().setName('connect').setDescription('Connects VoiceGPT to your current voice channel'),
    new SlashCommandBuilder().setName('disconnect').setDescription('Disconnects VoiceGPT from your current voice channel'),
  ];
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    console.log('registering slash commands');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log('bot is ready');
  }
  catch (error) { console.log('Error registering slash commands', error); }
});

// Login
console.log('logging in to discord');
client.login(process.env.DISCORD_TOKEN);