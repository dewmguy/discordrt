// get_wikipedia.js

const { function_search } = require('./function_search');
const { function_article } = require('./function_article');
const fetch = require('node-fetch');

const get_wikipedia = async ({ query }) => {
  console.log("get_wikipedia was called");
  console.log(`query: "${query}"`);

  try {
    query = `wikipedia ${query}`;
    const searchType = 'web';
    const searchResults = await function_search({ query, searchType });

    let url;
    for (let result of searchResults) {
      console.log(result.link);
      if (result.link.includes('wikipedia.org')) {
        url = result.link;
        console.log('article found');
        break;
      }
    }
    if (!url) { throw new Error(`No relevant Wikipedia article found for query "${query}"`); }
    
    const directive = `You are a professional copy editor, strip and summarize the contents of the article provided leaving the most important and relevant content related to the query "${query}."`;
    const scrape = await function_article({ url, directive });

    // Fetch the summary from Wikipedia's API
    const title = url.split('/').pop();
    console.log(title);
    const summaryURL = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const response = await fetch(summaryURL);
    const result = await response.json();

    if (result || scrape) {
      return {
        link: url,
        excerpt: result.extract,
        summary: scrape
      };
    }
    else { throw new Error("There is something wrong with the response from Wikipedia."); }
  }
  catch (error) {
    console.error("Error in get_wikipedia:", error);
    return { error: error.message };
  }
};

module.exports = { get_wikipedia };

/*
{
  "name": "get_wikipedia",
  "description": "Retrieves articles from Wikipedia. Useful when asked about retrieving information for a specific topic in a search or for research.",
  "parameters": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "The topic."
      }
    },
    "required": [
      "query"
    ]
  }
}
*/