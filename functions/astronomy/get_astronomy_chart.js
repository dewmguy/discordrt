// get_astronomy_chart.js

const axios = require('axios');
const { function_coords } = require('../function_coords');
const { function_elevation } = require('../function_elevation');
const { function_astronomy_search } = require('./function_astronomy_search');

const get_astronomy_chart = async ({ bodyName, location, date }) => {
  console.log("get_astronomy_chart function was called");
  console.log(`creating a star chart for ${bodyName}`);

  try {
    const coordinates = await function_coords({ location });
    if (coordinates.error) throw new Error(coordinates.error);
    const { latitude, longitude } = coordinates;
    const elevation = await function_elevation({ latitude, longitude });

    const constID = await function_astronomy_search(bodyName, 'constellation', 1);
    console.log(`searched for ${bodyName} and recovered ${constID}`);

    const config = {
      method: 'post',
      url: 'https://api.astronomyapi.com/api/v2/studio/star-chart',
      headers: { 'Authorization': `Basic ${process.env.ASTRONOMY_HASH}` },
      data: {
        "style": "red",
        "observer": {
          "latitude": latitude,
          "longitude": longitude,
          "date": date
        },
        "view": {
          "type": "constellation",
          "parameters": {
            "constellation": constID
          }
        }
      }
    };

    const response = await axios.request(config);
    console.log(response.data);
    return response.data.data.imageUrl;
  }
  catch (error) {
    console.error("Error in get_astronomy_chart:", error);
    return { error: error.message };
  }
}

module.exports = { get_astronomy_chart };

/*
{
  "name": "get_astronomy_chart",
  "description": "Retrieves image data from the Astronomy API. Useful when asked about the visual representation of a star, galaxy, or constellation.",
  "parameters": {
    "type": "object",
    "properties": {
      "bodyName": {
        "type": "string",
        "description": "The name of the star, galaxy, or constellation."
      },
      "location": {
        "type": "string",
        "description": "The name of the city. Required. Ask for the location."
      },
      "date": {
        "type": "string",
        "description": "The current date at the location. Also used as the newest date in a range. Format: YYYY-MM-DD"
      }
    },
    "required": [
      "bodyName",
      "location",
      "date"
    ]
  }
}
*/