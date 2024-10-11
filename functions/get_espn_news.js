// get_espn_news.js

const fetch = require('node-fetch');

const get_espn_news = async ({ sport, league }) => {
  console.log(`get_espn_news function was called`);
  try {
    const response = await fetch(`http://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/news`);
    const result = await response.json();
    const mappedArticles = result.articles.map(article => ({
      title: article.headline,
      desc: article.description,
      link: article.links.web.href
    }));
    return mappedArticles;
  }
  catch (error) {
    console.error("Error in get_espn_news:", error);
    return { error: error.message };
  }
}

module.exports = { get_espn_news };

/*
{
  "name": "get_espn_news",
  "description": "Retrieves data from the ESPN News API. Useful when asked about sports news.",
  "parameters": {
    "type": "object",
    "properties": {
      "sport": {
        "type": "string",
        "description": "The sport.",
        "enum": [
          "football",
          "baseball",
          "hockey",
          "basketball"
        ]
      },
      "league": {
        "type": "string",
        "description": "The league of the sport.",
        "enum": [
          "nfl",
          "mlb",
          "nhl",
          "nba",
          "wnba",
          "college-football",
          "college-basketball",
          "womens-college-basketball",
          "mens-college-basketball"
        ]
      }
    },
    "required": [
      "sport",
      "league"
    ]
  }
}
*/