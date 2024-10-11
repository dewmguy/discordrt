// function_article.js

const fetch = require('node-fetch');
const { function_gpt } = require('./function_gpt');
const TurndownService = require('turndown');
const turndownService = new TurndownService();

const function_article = async ({ url, directive }) => {
  console.log("function_article function was called");
  console.log(`pulling data from article ${url}`);
  try {
    
    const link = `https://article-extractor2.p.rapidapi.com/article/parse?url=${encodeURIComponent(url)}`;
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': `${process.env.RAPIDAPI_APIKEY}`,
        'X-RapidAPI-Host': 'article-extractor2.p.rapidapi.com'
      }
    };
    const response = await fetch(link, options);
    const data = await response.text();
    markdown = await turndownService.turndown(data);
    const summary = await function_gpt(directive,markdown);
    return summary;
  }
  catch (error) {
    console.error("Error in function_article:", error);
    return { error: error.message };
  }
}

module.exports = { function_article };