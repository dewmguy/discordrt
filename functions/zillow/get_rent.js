// get_rent.js

const fetch = require('node-fetch');

const get_rent = async ({ location, diameter = 0.5, property, beds, baths, sqftMin, sqftMax }) => {
  console.log("get_rent function was called");

  const searchParams = {
    address: location,
    areaDiameter: diameter,
    propertyType: property,
    bedrooms: beds,
    bathrooms: baths,
    sqftMin: sqftMin,
    sqftMax: sqftMax
  };

  try {
    const queryParams = new URLSearchParams({
      address: location,
      d: diameter,
      propertyType: property
    });

    if (beds) queryParams.append('beds', beds);
    if (baths) queryParams.append('baths', baths);
    if (sqftMin) queryParams.append('sqftMin', sqftMin);
    if (sqftMax) queryParams.append('sqftMax', sqftMax);

    const link = `https://zillow-com1.p.rapidapi.com/rentEstimate?${queryParams.toString()}`;

    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': `${process.env.RAPIDAPI_APIKEY}`,
        'X-RapidAPI-Host': 'zillow-com1.p.rapidapi.com'
      }
    };

    const response = await fetch(link, options);
    const result = await response.json();

    if (result.comparableRentals === 0) {
      return {
        message: 'No rental values are available for the provided search parameters.',
        searchParams
      };
    }

    return { searchParams, result };
  }
  catch (error) {
    console.error("Error in get_rent:", error);
    return { error: error.message };
  }
}

module.exports = { get_rent };

/*
{
  "name": "get_rent",
  "description": "Retrieves statistical rent data from Zillow API. Useful when asked about the average rent costs in an area.",
  "parameters": {
    "type": "object",
    "properties": {
      "location": {
        "type": "string",
        "description": "The full address around which to search: Street, City, State, Zip. Required. Ask of not provided."
      },
      "diameter": {
        "type": "number",
        "description": "The diameter in miles around the given location to search. 0.5 maximum. 0.05 minimum."
      },
      "property": {
        "type": "string",
        "description": "The type of property for rent. Optional.",
        "enum": [
          "Apartment",
          "Condo",
          "MultiFamily",
          "SingleFamily",
          "Townhouse"
        ],
        "default": "SingleFamily"
      },
      "beds": {
        "type": "number",
        "description": "The number of bedrooms. Optional."
      },
      "baths": {
        "type": "number",
        "description": "The number of bathrooms. Optional."
      },
      "sqftMin": {
        "type": "number",
        "description": "The minimum square footage. Optional."
      },
      "sqftMax": {
        "type": "number",
        "description": "The maximum square footage. Optional."
      }
    },
    "required": [
      "location"
    ]
  }
}
*/