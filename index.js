//discord realtime api bot

//modules
require('dotenv').config();
const { Client, Events, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, VoiceConnectionStatus, EndBehaviorType } = require('@discordjs/voice');
const prism = require('prism-media');
const WebSocket = require('ws');
const { Readable } = require('stream');

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
            duration: 300 // ms
          }
        });

        const userPCMStream = userRawStream.pipe(new prism.opus.Decoder({ rate: 24000, channels: 1, frameSize: 960 }));

        userPCMStream.on('data', async (chunk) => {
          await sendAudioBufferToWebSocket(chunk.toString('base64'));
        });

        userPCMStream.on('end', async () => {
          console.log(`${user.username} stopped speaking`);
          ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
          ws.send(JSON.stringify({ type: 'response.create' }));
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
    console.log('connected to audio stream');
    audioPlayer = createAudioPlayer();
  }

  ws = new WebSocket(url, { headers: {
    "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
    "OpenAI-Beta": "realtime=v1"
  }});

  ws.on('open', () => {
    console.log('websocket connected');
    ws.send(JSON.stringify({
      type: 'session.update',
      session: {
        instructions: "You don't know anything after October 2023. You are helpful and nice, but you don't like the sound of your own voice. Be charming, funny, and sarcastic, but be terse.",
        voice: 'shimmer' // alloy, echo, shimmer (soon: fable, onyx, nova)
      }
    }));
  });

  const errorHandler = (error) => {
    console.log('openai error: [type]', error.type);
    console.log('openai error: [code]', error.code);
    console.log('openai error: [message]', error.message);
    console.log('openai error: [param]', error.param);
    console.log('openai error: [event_id]', error.event_id);
  };

  ws.on('message', async (message) => {
    const response = JSON.parse(message.toString());
    if (response.type === 'error') {
      const { error } = response;
      errorHandler(error);
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
  });

  ws.on('error', (error) => {
    console.log('error: websocket', error);
  });

  ws.on('close', () => {
    console.log('websocket disconnected');
    ws = null;
  });
}

async function connectChannel(interaction) {
  if(interaction) { console.log('received /connect command'); }
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

async function disconnectChannel(interaction) {
  if(interaction) { console.log('received /disconnect command'); }
  if (connection) {
    console.log('disconnecting from voice');
    connection.destroy();
    connection = null;
    audioPlayer = null;
  }
  else {
    console.log('error: no active voice connection');
  }
  if (ws) {
    console.log('disconnecting websocket');
    ws.close();
    ws = null;
  }
  else {
    console.log('error: no active websocket');
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
  console.log('shutting down');
  await disconnectChannel();
  await client.destroy();
  process.exit(0);
};

process.on('SIGINT', () => shutdown());
process.on('SIGTERM', () => shutdown());

// Startup
client.on(Events.ClientReady, async () => {
  console.log('starting up');
  const commands = [
    new SlashCommandBuilder().setName('connect').setDescription('Connect to the voice channel'),
    new SlashCommandBuilder().setName('disconnect').setDescription('Disconnect from the voice channel'),
  ];
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    console.log('registering slash commands');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log('ready');
  }
  catch (error) { console.log('Error registering slash commands', error); }
});

// Login
console.log('logging in to discord');
client.login(process.env.DISCORD_TOKEN);