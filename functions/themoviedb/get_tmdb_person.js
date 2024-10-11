// get_tmdb_person.js

const { function_tmdb_search } = require('./function_tmdb_search.js');
const { function_fetch } = require('../function_fetch.js');

const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${process.env.THEMOVIEDB_APIKEY}`
  }
};

const get_tmdb_person = async ({ infoType, id, query, year, startYear }) => {
  try {
    console.log("get_tmdb_person function was called");

    if (!id && !query) { throw new Error('Either id or query must be provided'); }

    const endpoint = 'person';
    let url = `https://api.themoviedb.org/3/${endpoint}/`;
    const personID = id || await function_tmdb_search(endpoint, query, null, options);
    console.log(url);

    switch (infoType) {
      case 'details':
        url += `${personID}`;
        break;
      case 'movie_credits':
      case 'tv_credits':
        url += `${personID}/${infoType}`;
        break;
      default:
        throw new Error('Invalid infoType provided');
    }
    
    console.log(url);
    const result = await function_fetch(url, options);
    let results;

    if (infoType === 'details') {
      results = {
        note: `Use id ${result.id} for ${result.name} in future requests to this endpoint to reduce api calls.`,
        id: result.id,
        name: result.name,
        bio: result.biography,
        birthday: result.birthday,
        deathday: result.deathday,
        birthplace: result.place_of_birth,
        knownfor: result.known_for_department
      };
    }
    else if (infoType === 'movie_credits') {
      results = result.cast
        .filter(item => {
          const releaseYear = new Date(item.release_date).getFullYear();
          if (year && !startYear) { return releaseYear === parseInt(year); }
          if (year && startYear) { return releaseYear >= parseInt(startYear) && releaseYear <= parseInt(year); }
          return true;
        })
        .map(item => ({
          id: item.id,
          title: item.title,
          date: item.release_date,
          as: item.character,
          popularity: item.popularity
        }))
        .sort((a, b) => b.popularity - a.popularity) // descending
        .slice(0, 10);
    }
    else if (infoType === 'tv_credits') {
      results = result.cast
        .filter(item => {
          const airYear = new Date(item.first_air_date).getFullYear();
          if (year && !startYear) { return airYear === parseInt(year); }
          if (year && startYear) { return airYear >= parseInt(startYear) && airYear <= parseInt(year); }
          return true;
        })
        .filter(item => !item.genre_ids.includes(10767))  // Exclude talk
        .filter(item => !item.genre_ids.includes(10763))  // Exclude news
        .filter(item => !item.genre_ids.includes(10762))  // Exclude kids
        .map(item => ({
          id: item.id,
          title: item.original_name,
          date: item.first_air_date,
          as: item.character,
          popularity: item.popularity
        }))
        .sort((a, b) => b.popularity - a.popularity) // descending
        .slice(0, 10);
    }

    return results;
  }
  catch (error) {
    console.error("Error in get_tmdb_person:", error);
    return { error: error.message };
  }
}

module.exports = { get_tmdb_person };

/*
{
  "name": "get_tmdb_person",
  "description": "Retrieves data from The Movie Database API. Useful when asked about cast or crew and the movies or tv shows they have worked on.",
  "parameters": {
    "type": "object",
    "properties": {
      "infoType": {
        "type": "string",
        "description": "The information to retrieve. 'details' retrieves personal profile and bio for a person. 'tv_credits' retrieves a list of all tv show credits that a person worked on. 'movie_credits' retrieves a list of all movie credits that a person worked on.",
        "enum": [
          "details",
          "tv_credits",
          "movie_credits"
        ]
      },
      "id": {
        "type": "number",
        "description": "The id number of the person, if known. Optional."
      },
      "query": {
        "type": "string",
        "description": "The full name of the person. Required if 'id' is not known."
      },
      "year": {
        "type": "string",
        "description": "The most recent year in a range. Optional."
      },
      "startYear": {
        "type": "string",
        "description": "The oldest year in a range. Optional."
      }
    },
    "required": [
      "infoType"
    ]
  }
}
*/

//const movieGenres = { 28:"Action", 12:"Adventure", 16:"Animation", 35:"Comedy", 80:"Crime", 99:"Documentary", 18:"Drama", 10751:"Family", 14:"Fantasy", 36:"History", 27:"Horror", 10402:"Music", 9648:"Mystery", 10749:"Romance", 878:"Science Fiction", 10770:"TVMovie", 53:"Thriller", 10752:"War", 37:"Western" };
//const tvGenres = { 10759:"Action", 16:"Animation", 35:"Comedy", 80:"Crime", 99:"Documentary", 18:"Drama", 10751:"Family", 10762:"Kids", 9648:"Mystery", 10763:"News", 10764:"Reality", 10765:"Fantasy", 10766:"Soap", 10767:"Talk", 10768:"War & Politics", 37:"Western" };