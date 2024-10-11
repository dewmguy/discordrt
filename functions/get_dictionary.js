// get_dictionary.js

const fetch = require('node-fetch');

const get_dictionary = async ({ word }) => {
  console.log("get_dictionary function was called");
  try {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
    const response = await fetch(url);
    const data = await response.json();
    const result = data;
    if (!result) throw new Error('No data returned for the given word: ${word}');
    return result;
  }
  catch (error) {
    console.error("Error in get_dictionary:", error);
    return { error: error.message };
  }
}

module.exports = { get_dictionary };

/*
{
  "name": "get_dictionary",
  "description": "Retrieves defintions from the FreeDictionary API. Useful when asked about word meanings, origins, synonyms, or antonyms.",
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