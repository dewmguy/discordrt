// get_solarlunar.js

const fetch = require('node-fetch');
const { function_coords } = require('./function_coords');

const get_solarlunar = async ({ location, body }) => {
  console.log("get_solarlunar function was called");
  
  let coordinates = await function_coords({ location });
  if (coordinates.error) throw new Error(coordinates.error);
  let { latitude, longitude } = coordinates;
  
  try {
    const url = `https://moon-phase.p.rapidapi.com/advanced?lat=${latitude}&lon=${longitude}`;
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': `${process.env.RAPIDAPI_APIKEY}`,
        'X-RapidAPI-Host': 'moon-phase.p.rapidapi.com'
      }
    };
    const response = await fetch(url, options);
    const result = await response.json();

    if (body === 'sun') {
      const sunResult = result.sun;
      console.log(sunResult);
      return sunResult;
    }
    else if (body === 'moon') {
      const moonResult = { moon_data: result.moon, moon_phases: result.moon_phases };
      console.log(moonResult);
      return moonResult;
    }
  }
  catch (error) {
    console.error("Error in get_solarlunar:", error);
    return { error: error.message };
  }
}

module.exports = { get_solarlunar };

/*
{
  "name": "get_solarlunar",
  "description": "Retrieves current lunar or solar data from Moon API. Useful when asked about any solar or lunar activity.",
  "parameters": {
    "type": "object",
    "properties": {
      "location": {
        "type": "string",
        "description": "The name of the city. Required. Ask for the location."
      },
      "body": {
        "type": "string",
        "description": "The celestial body.",
        "enum": [
          "sun",
          "moon"
        ]
      }
    },
    "required": [
      "location",
      "body"
    ]
  }
}
*/