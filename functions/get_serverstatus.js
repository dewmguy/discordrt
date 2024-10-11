// get_serverstatus.js

const net = require('net');
const { Server } = require('@fabricio-191/valve-server-query');

const get_serverstatus = async ({ address, port, steam }) => {
  console.log("get_serverstatus function was called");
  try {
    const type = steam === 'true' ? 'steam' : 'web';
    console.log(`Checking ${type} server at ${address}:${port}`);
    
    if (type === 'steam') {
      const gamePort = port;
      console.log(`Attempting to query Steam server at ${address}:${gamePort}`);
      
      const server = await Server({ ip: `${address}`, port: gamePort, timeout: 5000 });
      const info = await server.getInfo();
      if(info) {
        const infoStringified = JSON.parse(JSON.stringify(info, (key, value) => typeof value === 'bigint' ? value.toString() : value ));
        console.log(infoStringified);
        return infoStringified;
      }
      else { return 'this game server appears to be down.'; }
    }

    return new Promise((resolve) => {
      const client = new net.Socket();
      
      client.setTimeout(5000);

      client.connect(port, address, () => {
        console.log('Connection successful');
        client.destroy();
        resolve({ status: "up", address, port });
      });

      client.on('error', (err) => {
        console.log('Connection failed:', err.message);
        resolve({ status: "down", address, port, error: err.message });
      });

      client.on('timeout', () => {
        console.log('Connection timeout');
        client.destroy();
        resolve({ status: "down", address, port, error: 'Connection timed out' });
      });
    });
  }
  catch (error) {
    console.error("Error in get_serverstatus:", error);
    return { status: "down", address, port, error: error.message };
  }
};

module.exports = { get_serverstatus };

/*
{
  "name": "get_serverstatus",
  "description": "Retrieves server status information for a provided server address and port. Useful for checking the current status of a website or web service, including local servers. Local servers include Plex Media Server (192.168.1.11:32400), Warcraft AzerothCore Private Server (localhost:8085), Minecraft (localhost:25565), Insurgency: Sandstorm (localhost:27131,Steam), and Valheim (localhost:2457,Steam).",
  "parameters": {
    "type": "object",
    "properties": {
      "address": {
        "type": "string",
        "description": "The server address.",
        "default": "127.0.0.1"
      },
      "port": {
        "type": "number",
        "description": "The server port.",
        "default": 80
      },
      "steam": {
        "type": "string",
        "description": "Whether to use a special Steam protocol to verify the status of certain game servers. Required. Ask if unknown.",
        "default": "false",
        "enum": [
          "true",
          "false"
        ]
      }
    },
    "required": [
      "address",
      "port",
      "steam"
    ]
  }
}
*/