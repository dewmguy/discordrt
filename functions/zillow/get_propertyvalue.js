// get_propertyvalue.js

const fetch = require('node-fetch');

const get_propertyvalue = async ({ location }) => {
  console.log("get_propertyvalue function was called");

  try {
    let link = `https://zillow-com1.p.rapidapi.com/zestimate?address=${encodeURIComponent(location)}`;

    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': `${process.env.RAPIDAPI_APIKEY}`,
        'X-RapidAPI-Host': 'zillow-com1.p.rapidapi.com'
      }
    };
    
    const response = await fetch(link, options);
    const result = await response.text();
    if(!result.value) { return `no value is known found for the address provided.`; }
    return result;
  }
  catch (error) {
    console.error("Error in get_propertyvalue:", error);
    return { error: error.message };
  }
}

module.exports = { get_propertyvalue };

/*
{
  "name": "get_propertyvalue",
  "description": "Retrieves property value data from Zillow API. Useful when asked about the value of a home or building at an address.",
  "parameters": {
    "type": "object",
    "properties": {
      "location": {
        "address": "string",
        "description": "The full address of the home: Street, City, State, Zip."
      }
    },
    "required": [
      "location"
    ]
  }
}
*/