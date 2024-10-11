// function_fetch.js

const fetch = require('node-fetch');

const function_fetch = async (url, options) => {
  console.log("function_fetch function was called");
  try {
    const response = await fetch(url, options);
    if(!response) { throw new Error('No data returned.'); }
    return await response.json();
  }
  catch (error) {
    console.error("Error in function_fetch:", error);
    return { error: error.message };
  }
}

module.exports = { function_fetch };