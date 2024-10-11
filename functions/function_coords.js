// function_coords.js

const fetch = require('node-fetch');
const { function_gpt } = require('./function_gpt');

const function_coords = async ({ location }) => {
  console.log("function_coords function was called");

  try {
    const directive = `Your objective is to validate the accuracy of, or correct location data in the form of, a city name. If the input does not appear to be a city name, determine the city a stated point of interest is located within or is nearest to. Your output will not be read by a human, simply return the city name. The state or other information is not required. Thanks.`;
    let city = await function_gpt(directive, location);
    console.log(`validated ${location} to ${city}`);
    const url = `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${process.env.OPENWEATHER_APIKEY}`;
    let response = await fetch(url);
    const data = await response.json();
    const result = data[0];
    console.log(`latitude: ${result.lat}, longitude: ${result.lon}`);
    return { latitude: result.lat, longitude: result.lon };
  }
  catch (error) {
    console.error("Error in function_coords:", error);
    return { error: error.message };
  }
}

module.exports = { function_coords };