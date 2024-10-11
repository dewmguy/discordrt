// get_summary.js

const { function_article } = require('./function_article');

const get_summary = async ({ url, request }) => {
  console.log("get_summary function was called");
  console.log(`getting summary for ${url}`);

  try {
    const directive = `You are a professional copy editor, please strip and summarize the contents of the article.`;
    const summary = await function_article({ url, directive: request ? `${directive} ${request}` : directive });
    return summary;
  }
  catch (error) {
    console.error("Error in get_summary:", error);
    return { error: error.message };
  }
}

module.exports = { get_summary };

/*
{
  "name": "get_summary",
  "description": "Retrieves a summarized scrape of data from a given URL. Useful if asked to look at the contents of a provided website url.",
  "parameters": {
    "type": "object",
    "properties": {
      "url": {
        "type": "string",
        "description": "The URL"
      },
      "request": {
        "type": "string",
        "description": "special request for what kind of data the user is looking for"
      }
    },
    "required": [
      "url"
    ]
  }
}
*/