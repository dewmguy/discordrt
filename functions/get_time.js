// get_time.js

const fetch = require('node-fetch');

const get_time = async ({ area, location, region }) => {
  console.log("get_time function was called");
  try {
    if(!region) { region = ''; }
    const url = `http://worldtimeapi.org/api/timezone/${area}/${location}/${region}`;
    console.log(url);
    const response = await fetch(url);
    const result = await response.json();
    console.log(result);
    
    if (result) {
      const timeData = {
        zone: result.timezone,
        region: result.abbreviation,
        time: result.datetime,
        dst_start: result.dst_from,
        dst_stop: result.dst_until
      };
      console.log(timeData);
      return timeData;
    }
    else {
      if(!area) { area = '<missing>'; }
      if(!location) { location = '<missing>'; }
      if(!region) { region = '<region>'; }
      throw new Error(`No data found for ${area}/${location}/${region}`);
    }
  }
  catch (error) {
    console.error("Error in get_time:", error);
    return { error: error.message };
  }
};

module.exports = { get_time };

/*
{
  "name": "get_time",
  "description": "Retrieves time data from the World Time API. Useful when asked about the time in any location.",
  "parameters": {
    "type": "object",
    "properties": {
      "area": {
        "type": "string",
        "description": "The timezone area; continent or a generic area name.",
        "enum": [
          "Africa",
          "America",
          "Antarctica",
          "Asia",
          "Atlantic",
          "Australia",
          "Europe",
          "Indian",
          "Pacific",
          "CET",
          "EET",
          "EST",
          "ETC",
          "HST",
          "MET",
          "MST",
          "WET"
        ]
      },
      "location": {
        "type": "string",
        "description": "The time zone location. The city name, except for the following specific locations: Argentina, Indiana, Kentucky, and North_Dakota."
      },
      "region": {
        "type": "string",
        "description": "The time zone region. The city name for the exceptions in the location parameter."
      }
    },
    "required": [
      "area",
      "location"
    ]
  }
}
*/