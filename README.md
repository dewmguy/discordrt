# Node.js Discord Voice Bot

## Overview

This Node.js Discord bot integrates OpenAI's Realtime API allowing for real-time communication using the latest models. It is capable of joining voice channels and responding to voice users, providing an immersive and dynamic experience.

## Features

- **Discord and OpenAI Realtime Integration**: The bot uses the `discord.js` and `@discordjs/voice` libraries to interact seamlessly with Discord servers, including joining voice channels and handling real-time voice interactions. It connects to OpenAI's Realtime API via WebSocket, leveraging the latest models to generate intelligent, context-aware responses.
- **Advanced Audio Handling**: The bot uses `prism-media` for handling and converting audio streams to and from the discord voice channel, ensuring that user inputs are effectively processed and responses are seamlessly delivered within the voice channel.

## Dependencies

- **discord.js**: A popular library for interacting with the Discord API, allowing the bot to manage server events, users, and messages.
- **@discordjs/voice**: This library adds voice support to `discord.js`, enabling the bot to join and manage voice channels, stream audio, and interact with users through voice.
- **dotenv**: A module that loads environment variables from a `.env` file, simplifying the management of sensitive data such as API keys and configuration settings.
- **prism-media**: A media framework used to handle audio streams, essential for processing voice inputs and outputs efficiently in real-time.
- **WebSocket**: A built-in Node.js module that allows the bot to connect to OpenAI's Realtime API for real-time communication and interaction.
