// get_astronomy_stars.js

const axios = require('axios');
const { function_astronomy_search } = require('./function_astronomy_search');

const get_astronomy_stars = async ({ bodyName }) => {
  console.log("get_astronomy_stars function was called");

  try {
    console.log(`searching for ${bodyName}`);
    return function_astronomy_search(bodyName, 'general', 5);
  }
  catch (error) {
    console.error("Error in get_astronomy_stars:", error);
    return { error: error.message };
  }
}

module.exports = { get_astronomy_stars };

/*
{
  "name": "get_astronomy_stars",
  "description": "Retrieves data from the Astronomy API. Useful when asked about the locations of stars, galaxies, constellations, or deep space objects.",
  "parameters": {
    "type": "object",
    "properties": {
      "bodyName": {
        "type": "string",
        "description": "The name of the star, galaxies, or deep space object."
      }
    },
    "required": [
      "bodyName"
    ]
  }
}
*/