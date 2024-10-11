// get_stockprice.js

const fetch = require('node-fetch');

const get_stockprice = async ({ ticker }) => {
  console.log("get_stockprice function was called");
  console.log(`Fetching stock price for ${ticker}`);
  
  const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${process.env.STOCKMARKETAPI_APIKEY}`;

  try {
    const response = await fetch(url);
    const result = await response.json();
    if (!result) { throw new Error(`API Call Issue`); }
    
    const data = result.results[0];
    const stockData = {
      ticker: result.ticker,
      volume: data.v,
      volumeWeighted: data.vw,
      open: data.o,
      close: data.c,
      high: data.h,
      low: data.l,
      timestamp: data.t,
      transactions: data.n
    };

    return stockData;
  }
  catch (error) {
    console.error("Error in get_stockprice:", error);
    return { error: error.message };
  }
};

module.exports = { get_stockprice };

/*
{
  "name": "get_stockprice",
  "description": "Retrieves stock data from the Stock Market API. Useful when asked about the value of a stock.",
  "parameters": {
    "type": "object",
    "properties": {
      "ticker": {
        "type": "string",
        "description": "The stock ticker symbol."
      }
    },
    "required": [
      "ticker"
    ]
  }
}
*/