// get_tmdb_tvshow.js

const { function_tmdb_search } = require('./function_tmdb_search.js');
const { function_fetch } = require('../function_fetch.js');

const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${process.env.THEMOVIEDB_APIKEY}`
  }
};

const get_tmdb_tvshow = async ({ id, query, year, credits, member, position, season, episode }) => {
  try {
    console.log("get_tmdb_tvshow function was called");

    if (!id && !query) { throw new Error('Either id or query must be provided'); }

    const endpoint = 'tv';
    const baseUrl = 'https://api.themoviedb.org/3';
    const showID = id || await function_tmdb_search(endpoint, query, year, options);
    let url = `${baseUrl}/${endpoint}/${showID}/`;
    if (season) {
      url += `season/${season}/`;
      if (episode) { url += `episode/${episode}/`; }
    }
    url += `credits?language=en-US`;
    console.log(url);

    const result = await function_fetch(url, options);
    if(!result) { throw new Error(`Something is wrong with the API call`); }
    let results;

    console.log(`retrieving ${credits} credits`);
    if (credits === 'cast') {
      results = result.cast
        .filter(item => {
          if (member) { return item.name.toLowerCase().includes(member.toLowerCase()); }
          return true;
        })
        .map(item => ({
          id: item.id,
          name: item.name,
          as: item.character,
          popularity: item.popularity
        }))
        .sort((a, b) => b.popularity - a.popularity) // descending
        .slice(0, 10);
    }
    else if (credits === 'crew') {
      results = result.crew
        .filter(item => {
          if (member && position) { return item.job.toLowerCase().includes(position.toLowerCase()); }
          else if (member) { return item.name.toLowerCase().includes(member.toLowerCase()); }
          return true;
        })
        .map(item => ({
          id: item.id,
          name: item.name,
          job: item.job,
          popularity: item.popularity
        }))
        .sort((a, b) => b.popularity - a.popularity) // descending
        .slice(0, 10);
    }

    return {
      "note": credits === 'crew' && (!season && !episode || (season && !episode)) ? "crew is more accurately described when an episode is specified." : "",
      results
    };
  }
  catch (error) {
    console.error("Error in get_tmdb_tvshow:", error);
    return { error: error.message };
  }
}

module.exports = { get_tmdb_tvshow };

/*
{
  "name": "get_tmdb_tvshow",
  "description": "Retrieves data from The Movie Database API. Useful when asked about who the cast or crew of a tv show is or whether someone is in the cast or crew of a tv show, season, or episode.",
  "parameters": {
    "type": "object",
    "properties": {
      "id": {
        "type": "number",
        "description": "The id of the tv show. Optional. A relevant id number may be defined by previous interactions with the API."
      },
      "query": {
        "type": "string",
        "description": "The name of the tv show. Required."
      },
      "year": {
        "type": "number",
        "description": "The release year of the tv show. Required. Query the user or make your best educated guess."
      },
      "credits": {
        "type": "string",
        "description": "The category of credits to retrieve.",
        "enum": [
          "cast",
          "crew"
        ]
      },
      "member": {
        "type": "string",
        "description": "The name of the cast or crew member to find. Optional."
      },
      "position": {
        "type": "string",
        "description": "The job title of the crew member to find. Optional, but required if member is set."
      },
      "season": {
        "type": "number",
        "description": "The season number of the tv show. Optional."
      },
      "episode": {
        "type": "number",
        "description": "The episode number of the tv show. Optional, but required if season is set."
      }
    },
    "required": [
      "query",
      "year",
      "credits"
    ]
  }
}
*/