// get_factcheck.js

const fetch = require('node-fetch');

const get_factcheck = async ({ query }) => {
  console.log("get_factcheck function was called");
  try {
    const url = `https://fact-checker.p.rapidapi.com/search?query=${encodeURIComponent(query)}&limit=5`;
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': `${process.env.RAPIDAPI_APIKEY}`,
        'X-RapidAPI-Host': 'fact-checker.p.rapidapi.com'
      }
    };
    const response = await fetch(url, options);
    const result = await response.text();
    if(!result) { return `There are no results to confirm nor deny the statement: ${query}`; }
    console.log(result);
    return result;
  }
  catch (error) {
    console.error("Error in get_factcheck:", error);
    return { error: error.message };
  }
}

module.exports = { get_factcheck };

/*
{
  "name": "get_factcheck",
  "description": "Retrieves data from Fact Check API. Useful to confirm or deny the factuality of potentially controversial statements or allegations made by a user.",
  "parameters": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "The statement."
      }
    },
    "required": [
      "query"
    ]
  }
}
*/