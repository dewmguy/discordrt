// get_inflation.js

const fetch = require('node-fetch');

const get_inflation = async ({ country, dateStart, dateEnd, amount }) => {
  console.log("get_inflation function was called");
  console.log(`Getting inflation value for ${amount} from ${dateStart} to ${dateEnd} in ${country}`);
  
  const url = new URL('https://www.statbureau.org/calculate-inflation-price-jsonp');
  const params = {
    jsoncallback: '?',
    country: country,
    start: dateStart,
    end: dateEnd,
    amount: amount,
    format: true
  };
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  try {
    const response = await fetch(url);
    const text = await response.text();
    const jsonpData = text.match(/^\?\((.*)\)$/)[1];
    const result = JSON.parse(jsonpData);
    console.log(result);
    return result;
  }
  catch (error) {
    console.error("Error in get_inflation:", error);
    return { error: error.message };
  }
}

module.exports = { get_inflation };

/*
{
  "name": "get_inflation",
  "description": "Retrieves inflation data from the Inflation API. Useful when asked about differences in the values of a currency in a period of years.",
  "parameters": {
    "type": "object",
    "properties": {
      "country": {
        "type": "string",
        "description": "The country.",
        "enum": [
          "belarus",
          "brazil",
          "canada",
          "european-union",
          "eurozone",
          "france",
          "germany",
          "greece",
          "india",
          "japan",
          "kazakhstan",
          "mexico",
          "russia",
          "spain",
          "turkey",
          "ukraine",
          "united-kingdom",
          "united-states"
        ],
        "default": "united-states"
      },
      "dateStart": {
        "type": "string",
        "description": "The oldest date in a range. Format: YYYY/MM/DD",
        "format": "date"
      },
      "dateEnd": {
        "type": "string",
        "description": "The newest recent date in a range. Format: YYYY/MM/DD. Default: today's date.",
        "format": "date"
      },
      "amount": {
        "type": "number",
        "description": "The amount of currency. Does not require the currency symbol."
      }
    },
    "required": [
      "country",
      "dateStart",
      "dateEnd",
      "amount"
    ]
  }
}
*/