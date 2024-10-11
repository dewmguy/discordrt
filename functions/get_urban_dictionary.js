// get_urban_dictionary.js

const fetch = require('node-fetch');

const get_urban_dictionary = async ({ word }) => {
  console.log("get_urban_dictionary function was called");
  try {
    const url = `https://mashape-community-urban-dictionary.p.rapidapi.com/define?term=${word}`;
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': `${process.env.RAPIDAPI_APIKEY}`,
        'X-RapidAPI-Host': 'mashape-community-urban-dictionary.p.rapidapi.com'
      }
    };
    const response = await fetch(url, options);
    const result = await response.json();
    const definitions = result.list.map(entry => entry.definition);
    console.log(definitions);
    return definitions;
  }
  catch (error) {
    console.error("Error in get_urban_dictionary:", error);
    return { error: error.message };
  }
}

module.exports = { get_urban_dictionary };

/*
{
  "name": "get_urban_dictionary",
  "description": "Retrieves defintions from the Urban Dictionary API. Useful when asked about slang words or colloquialisms that would not be in the dictionary.",
  "parameters": {
    "type": "object",
    "properties": {
      "word": {
        "type": "string",
        "description": "The word."
      }
    },
    "required": [
      "word"
    ]
  }
}
*/