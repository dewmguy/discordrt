// get_astronomy_planet.js

const axios = require('axios');
const { function_coords } = require('../function_coords');
const { function_elevation } = require('../function_elevation');

const get_astronomy_planet = async ({ bodyName, location, time, date, old_date }) => {
  console.log("get_astronomy_planet function was called");
  console.log(`retrieving position data for ${bodyName}`);

  try {
    const coordinates = await function_coords({ location });
    if (coordinates.error) throw new Error(coordinates.error);
    const { latitude, longitude } = coordinates;
    const elevation = await function_elevation({ latitude, longitude });

    const config = {
      method: 'get',
      url: `https://api.astronomyapi.com/api/v2/bodies/positions/${bodyName}?latitude=${latitude}&longitude=${longitude}&elevation=${elevation}&time=${time}&to_date=${date}&from_date=${old_date}`,
      headers: { 'Authorization': `Basic ${process.env.ASTRONOMY_HASH}` }
    };

    const response = await axios.request(config);
    console.log(response.data);
    return response.data;
  }
  catch (error) {
    console.error("Error in get_astronomy_planet:", error);
    return { error: error.message };
  }
}

module.exports = { get_astronomy_planet };

/*
{
  "name": "get_astronomy_planet",
  "description": "Retrieves data from the Astronomy API. Useful when asked about the current locations of planets in the solar system.",
  "parameters": {
    "type": "object",
    "properties": {
      "bodyName": {
        "type": "string",
        "description": "The name of the name of the planet."
      },
      "location": {
        "type": "string",
        "description": "The name of the city. Required. Ask for the location."
      },
      "time": {
        "type": "string",
        "description": "The current local time at the location. Format: HH:MM:SS"
      },
      "date": {
        "type": "string",
        "description": "The current date at the location. Also used as the newest date in a range. Format: YYYY-MM-DD"
      },
      "old_date": {
        "type": "string",
        "description": "The current date at the location. Also used as the oldest date in a range. Format: YYYY-MM-DD"
      }
    },
    "required": [
      "bodyName",
      "location",
      "time",
      "date",
      "old_date"
    ]
  }
}
*/