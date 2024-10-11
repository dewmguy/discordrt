// get_weather_today.js

const fetch = require('node-fetch');
const { function_coords } = require('../function_coords');
const OPENWEATHER_APIKEY = process.env.OPENWEATHER_APIKEY;

const get_weather_today = async ({ location, start, end }) => {
  console.log("get_weather_today was called");
  try {
    console.log(`getting weather data for ${location} from ${start} to ${end}`);

    console.log(`getting coordinates for ${location}`);
    let coordinates = await function_coords({ location });
    if (coordinates.error) throw new Error(coordinates.error);
    let { latitude, longitude } = coordinates;

    let excluded = "alerts,current,minutely,daily";
    // includes hourly

    const weatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&exclude=${excluded}&units=imperial&appid=${OPENWEATHER_APIKEY}`;
    const response = await fetch(weatherUrl);
    const weatherData = await response.json();
    //console.log(weatherData);
    
    let weatherAlert = {};
    if(weatherData.alerts) { weatherAlert = weatherData.alerts; }

    const now = new Date();
    const currentHour = now.getHours();

    start = start !== undefined ? start : currentHour;
    end = end !== undefined ? end : 23;

    const currentDate = now.toISOString().split('T')[0];
    const startTimestamp = new Date(`${currentDate}T${String(start).padStart(2, '0')}:00:00Z`).getTime() / 1000;
    
    let endDate = currentDate;
    if (end < start) { endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]; }
    const endTimestamp = new Date(`${endDate}T${String(end).padStart(2, '0')}:00:00Z`).getTime() / 1000;

    const filteredHourly = weatherData.hourly.filter(hourData => { return hourData.dt >= startTimestamp && hourData.dt <= endTimestamp; });

    console.log(filteredHourly);
    return {
      alerts: weatherAlert,
      filteredHourly
    };
  }
  catch (error) {
    console.error("Error in get_weather_today:", error);
    return { error: error.message };
  }
};

module.exports = { get_weather_today };

/*
{
  "name": "get_weather_today",
  "description": "Retrieves weather data from OpenWeather API. Useful when asked about what weather will be like throughout the next 48 hours. Write your response in the style of a meteoroligist weather report, refine the information based on the user request. Round all numerical points of data to the nearest whole digit.",
  "parameters": {
    "type": "object",
    "properties": {
      "location": {
        "type": "string",
        "description": "The city and state. Required. Ask if not provided."
      },
      "start": {
        "type": "number",
        "description": "The start of a range of time. Optional. Required when a user requests weather for a specific time or period of time. Expressed as a two digit number in military time: 00-23. (e.g. if '9pm' or 'from 9pm to 3am' set 21)"
      },
      "end": {
        "type": "number",
        "description": "The end of a range of time. Required. Useful when a user requests weather for a specific time or period of time. Expressed as a two digit number in military time: 00-23. If specific time, set to one hour past start time. If range, set appropriately. If open ended, set to 12 hours past time requested."
      }
    },
    "required": [
      "location",
      "end"
    ]
  }
}
*/