// get_tmdb_lists.js

const { function_fetch } = require('../function_fetch.js');

const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${process.env.THEMOVIEDB_APIKEY}`
  }
};

const get_tmdb_lists = async ({ mediaType, listType }) => {
  try {
    console.log("get_tmdb_lists function was called");

    const baseUrl = 'https://api.themoviedb.org/3';
    const langUrl = 'language=en-US';
    const url = listType === 'trending' 
      ? `${baseUrl}/${listType}/${mediaType}/week?${langUrl}` 
      : `${baseUrl}/${mediaType}/${listType}?${langUrl}&page=1`;
    console.log(url);

    const result = await function_fetch(url, options);
    let results;
    
    const isTv = mediaType === 'tv';
    const isTop = listType === 'top_rated';
    results = result.results
      .map(item => ({
        id: item.id,
        title: isTv ? item.name : item.title,
        date: isTv ? item.first_air_date : item.release_date,
        popularity: isTop ? item.vote_average : item.popularity
      }))
      .sort((a, b) => b.popularity - a.popularity) // descending
      .slice(0, 10);

    return results;
  }
  catch (error) {
    console.error("Error in get_tmdb_lists:", error);
    return { error: error.message };
  }
}

module.exports = { get_tmdb_lists };

/*
{
  "name": "get_tmdb_lists",
  "description": "Retrieves data from The Movie Database API. Useful when asked about what tv shows or movies are top rated, most popular, trending, now playing in theaters, or will be released in theaters.",
  "parameters": {
    "type": "object",
    "properties": {
      "mediaType": {
        "type": "string",
        "description": "The type of media to retrieve.",
        "enum": [
          "movie",
          "tv"
        ]
      },
      "listType": {
        "type": "string",
        "description": "The type of list to retrieve. 'nowPlaying' and 'upcoming' are movie only lists.",
        "enum": [
          "now_playing",
          "popular",
          "top_rated",
          "upcoming",
          "trending"
        ]
      }
    },
    "required": [
      "mediaType",
      "listType"
    ]
  }
}
*/