// function_search.js

const fetch = require('node-fetch');
const SERPAPI_APIKEY = process.env.SERPAPI_APIKEY;

const function_search = async ({ query, searchType }) => {
  try {
    console.log("function_search function was called");
    console.log(`query: "${query}" searchType: "${searchType}"`);

    let serpApiUrl;
    switch (searchType) {
      case 'news':
        serpApiUrl = `https://serpapi.com/search?engine=google_news&q=${encodeURIComponent(query)}&api_key=${SERPAPI_APIKEY}`;
        break;
      case 'sports':
      case 'web':
      case 'local_news':
      default:
        serpApiUrl = `https://serpapi.com/search?q=${encodeURIComponent(query)}&api_key=${SERPAPI_APIKEY}`;
        break;
    }

    const response = await fetch(serpApiUrl);
    const data = await response.json();
    let results = data.organic_results;

    if (searchType === 'news') { results = data.news_results; }
    else if (searchType === 'local_news') { results = data.local_news; }
    else if (searchType === 'sports') { results = data.sports_results || results; }
    
    console.log(`returning search results`);
    return results;
  }
  catch (error) {
    console.error("Error in function_search:", error);
    return { error: error.message };
  }
}

module.exports = { function_search };