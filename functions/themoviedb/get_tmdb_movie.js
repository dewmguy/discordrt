// get_tmdb_movie.js

const { function_tmdb_search } = require('./function_tmdb_search.js');
const { function_fetch } = require('../function_fetch.js');

const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${process.env.THEMOVIEDB_APIKEY}`
  }
};

const get_tmdb_movie = async ({ id, query, year, credits, member, position }) => {
  try {
    console.log("get_tmdb_movie function was called");

    if (!id && !query) { throw new Error('Either id or query must be provided'); }

    const endpoint = 'movie';
    let baseUrl = 'https://api.themoviedb.org/3';
    let url = `${baseUrl}/${endpoint}/`;
    let movieID = id || await function_tmdb_search(endpoint, query, year, options);
    url += `${movieID}/credits?language=en-US`;

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

    return results;
  }
  catch (error) {
    console.error("Error in get_tmdb_movie:", error);
    return { error: error.message };
  }
}

module.exports = { get_tmdb_movie };

/*
{
  "name": "get_tmdb_movie",
  "description": "Retrieves data from The Movie Database API. Useful when asked about who the cast or crew of a movie is or whether someone is in the cast or crew of a movie.",
  "parameters": {
    "type": "object",
    "properties": {
      "id": {
        "type": "number",
        "description": "The id of the movie. Optional. A relevant id number may be defined by previous interactions with the API."
      },
      "query": {
        "type": "string",
        "description": "The name of the movie. Required."
      },
      "year": {
        "type": "number",
        "description": "The release year of the movie. Required. Query the user or make your best educated guess."
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