// get_weather_forecast.js

const fetch = require('node-fetch');
const { function_coords } = require('../function_coords');
const OPENWEATHER_APIKEY = process.env.OPENWEATHER_APIKEY;

const get_weather_forecast = async ({ location }) => {
  console.log("get_weather_forecast was called");
  try {
    console.log(`getting coordinates for ${location}`);

    let coordinates = await function_coords({ location });
    if (coordinates.error) throw new Error(coordinates.error);
    let { latitude, longitude } = coordinates;

    let excluded = "current,minutely,hourly";
    // includes alerts, daily

    const weatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&exclude=${excluded}&units=imperial&appid=${OPENWEATHER_APIKEY}`;
    const response = await fetch(weatherUrl);
    const weatherData = await response.json();
    return weatherData;
  }
  catch (error) {
    console.error("Error in get_weather_forecast:", error);
    return { error: error.message };
  }
};

module.exports = { get_weather_forecast };

/*
{
  "name": "get_weather_forecast",
  "description": "Retrieves weather data from OpenWeather API. Useful when asked about what weather will be like throughout the next 7 days. Write your response in the style of a meteoroligist weather report, refine the information based on the user request. Round all numerical points of data to the nearest whole digit.",
  "parameters": {
    "type": "object",
    "properties": {
      "location": {
        "type": "string",
        "description": "The city and state. Required. Ask if not provided."
      }
    },
    "required": [
      "location"
    ]
  }
}
*/