// get_flight.js

const fetch = require('node-fetch');
const { get_weather_today } = require('./weather/get_weather_today');

const get_flight = async ({ flightICAO }) => {
  console.log("get_flight function was called");
  try {
    if (!flightICAO) { throw new Error('Function Call formatting failure. Please ensure the flight ICAO number is provided.'); }
    
    const url = `https://aerodatabox.p.rapidapi.com/flights/number/${flightICAO}`;
    console.log(url);
    
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': `${process.env.RAPIDAPI_APIKEY}`,
        'X-RapidApi-Host': 'aerodatabox.p.rapidapi.com'
      }
    };
    
    const response = await fetch(url, options);
    if (!response.ok) { throw new Error('API Call Failure.'); }
    const result = await response.json();
    if (!result) { return 'There were no results provided by the API.'; }
    console.log(result);

    const flightData = result[0];

    // Extract relevant times
    const departureTime = new Date(flightData.departure.scheduledTime.local).getHours();
    console.log(departureTime);
    const arrivalTime = new Date(flightData.arrival.scheduledTime.local).getHours();
    console.log(arrivalTime);

    // Fetch weather data for departure and arrival locations
    const weatherDeparture = await get_weather_today({
      location: flightData.departure.airport.municipalityName,
      start: departureTime - 1,
      end: departureTime
    });
    
    const weatherArrival = await get_weather_today({
      location: flightData.arrival.airport.municipalityName,
      start: arrivalTime - 1,
      end: arrivalTime
    });

    const remappedData = {
      airlineName: flightData.airline.name,
      flightNumber: flightData.callSign,
      status: flightData.status,
      statusUpdate: flightData.lastUpdatedUtc,
      departure: {
        airport: flightData.departure.airport.iata,
        city: flightData.departure.airport.municipalityName,
        timezone: flightData.departure.airport.timeZone,
        scheduled: flightData.departure.scheduledTime.local,
        revised: flightData.departure.revisedTime.local,
        terminal: flightData.departure.terminal,
        conditions: weatherDeparture
      },
      arrival: {
        airport: flightData.arrival.airport.iata,
        city: flightData.arrival.airport.municipalityName,
        timezone: flightData.arrival.airport.timeZone,
        scheduled: flightData.arrival.scheduledTime.local,
        revised: flightData.arrival.revisedTime.local,
        conditions: weatherArrival
      },
      flightDistance: flightData.greatCircleDistance.mile
    };

    console.log(remappedData);
    return remappedData;
  } catch (error) {
    console.error("Error in get_flight:", error);
    return { error: error.message };
  }
}

module.exports = { get_flight };

/*
{
  "name": "get_flight",
  "description": "Retrieves flight data from Aviation Stack API. Useful when asked about the status of a flight. Convert all UTC to relative times i.e. 5 minutes ago. Convert all military times to standard times. Write your response in the style of an airline captain giving a report over the intercom.",
  "parameters": {
    "type": "object",
    "properties": {
      "flightICAO": {
        "type": "string",
        "description": "The Flight ICAO identifier of the flight. (e.g. SWA1234)"
      }
    },
    "required": [
      "flightICAO"
    ]
  }
}
*/