# Node.js Discord Voice Bot

## Overview

This Node.js application is a Discord bot that integrates voice interaction capabilities with advanced AI. The bot connects to Discord, OpenAI's Realtime API, and manages voice channels, allowing for real-time communication using the latest AI models. It is capable of joining voice channels, processing audio input, and responding with intelligent, context-aware content, providing an immersive and dynamic experience for users.

## Features

- **Discord and OpenAI Realtime Integration**: The bot uses the `discord.js` and `@discordjs/voice` libraries to interact seamlessly with Discord servers, including joining voice channels and handling real-time voice interactions. It connects to OpenAI's Realtime API via WebSocket, leveraging the latest AI models to generate intelligent, context-aware responses. This combination allows the bot to join voice channels, process voice inputs, and generate immediate, intelligent responses, creating a smooth and immersive user experience.
- **Advanced Audio Handling**: The bot uses `prism-media` for handling and converting audio streams, ensuring that user inputs are effectively processed and responses are seamlessly delivered within the voice channel. This feature supports reading, converting, and playing audio as needed.
- **Function Calling**: The bot includes function calling capabilities to enhance user interactions. It can perform specific actions, such as retrieving data or interacting with third-party services, in response to voice commands, making it highly adaptable to various needs.

## Dependencies

- **discord.js**: A popular library for interacting with the Discord API, allowing the bot to manage server events, users, and messages.
- **@discordjs/voice**: This library adds voice support to `discord.js`, enabling the bot to join and manage voice channels, stream audio, and interact with users through voice.
- **dotenv**: A module that loads environment variables from a `.env` file, simplifying the management of sensitive data such as API keys and configuration settings.
- **prism-media**: A media framework used to handle audio streams, essential for processing voice inputs and outputs efficiently in real-time.
- **WebSocket**: A built-in Node.js module that allows the bot to connect to OpenAI's Realtime API for real-time communication and interaction.
