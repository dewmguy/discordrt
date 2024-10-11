// get_propertysearch.js

const fetch = require('node-fetch');

const get_propertysearch = async ({ location, status_type, home_type, sort, minPrice, maxPrice, bathsMin, bathsMax, bedsMin, bedsMax, sqftMin, sqftMax, buildYearMin, buildYearMax, isBasementUnfinished, isNewConstruction, lotSizeMin, lotSizeMax, hasAirConditioning, hasGarage }) => {
  console.log("get_propertysearch function was called");

  try {
    let link = `https://zillow-com1.p.rapidapi.com/rentEstimate?`;

    const queryParams = [
      `location=${encodeURIComponent(location)}`,
      `status_type=${status_type}`,
      `sort=${sort}`
    ];

    if (home_type) queryParams.push(`home_type=${home_type}`);
    if (minPrice) queryParams.push(`minPrice=${minPrice}`);
    if (maxPrice) queryParams.push(`maxPrice=${maxPrice}`);
    if (bathsMin) queryParams.push(`bathsMin=${bathsMin}`);
    if (bathsMax) queryParams.push(`bathsMax=${bathsMax}`);
    if (bedsMin) queryParams.push(`bedsMin=${bedsMin}`);
    if (bedsMax) queryParams.push(`bedsMax=${bedsMax}`);
    if (sqftMin) queryParams.push(`sqftMin=${sqftMin}`);
    if (sqftMax) queryParams.push(`sqftMax=${sqftMax}`);
    if (buildYearMin) queryParams.push(`buildYearMin=${buildYearMin}`);
    if (buildYearMax) queryParams.push(`buildYearMax=${buildYearMax}`);
    if (isBasementUnfinished) queryParams.push(`isBasementUnfinished=${isBasementUnfinished}`);
    if (isNewConstruction) queryParams.push(`isNewConstruction=${isNewConstruction}`);
    if (lotSizeMin) queryParams.push(`lotSizeMin=${lotSizeMin}`);
    if (lotSizeMax) queryParams.push(`lotSizeMax=${lotSizeMax}`);
    if (hasAirConditioning) queryParams.push(`hasAirConditioning=${hasAirConditioning}`);
    if (hasGarage) queryParams.push(`hasGarage=${hasGarage}`);

    link += queryParams.join('&');

    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': `${process.env.RAPIDAPI_APIKEY}`,
        'X-RapidAPI-Host': 'zillow-com1.p.rapidapi.com'
      }
    };

    const response = await fetch(link, options);
    const result = await response.json();
    return {
      "searchParams": {
        "description": "these are the search values that returned your results",
        "location": `${location}`,
        "status_type": `${status_type}`,
        "home_type": `${home_type}`,
        "minPrice": `${minPrice}`,
        "maxPrice": `${maxPrice}`,
        "bathsMin": `${bathsMin}`,
        "bathsMax": `${bathsMax}`,
        "bedsMin": `${bedsMin}`,
        "bedsMax": `${bedsMax}`,
        "sqftMin": `${sqftMin}`,
        "sqftMax": `${sqftMax}`,
        "buildYearMin": `${buildYearMin}`,
        "buildYearMax": `${buildYearMax}`,
        "isBasementUnfinished": `${isBasementUnfinished}`,
        "isNewConstruction": `${isNewConstruction}`,
        "lotSizeMin": `${lotSizeMin}`,
        "lotSizeMax": `${lotSizeMax}`,
        "hasAirConditioning": `${hasAirConditioning}`,
        "hasGarage": `${hasGarage}`
      },
      result
    };
  }
  catch (error) {
    console.error("Error in get_propertysearch:", error);
    return { error: error.message };
  }
}

module.exports = { get_propertysearch };

/*
{
  "name": "get_propertysearch",
  "description": "Retrieves property results from Zillow API. Useful when asked for availability or prices of homes for rent or sale near a particular area.",
  "parameters": {
    "type": "object",
    "properties": {
      "location": {
        "type": "string",
        "description": "The full address or zip code to search around. Required. Ask if not provided."
      },
      "status_type": {
        "type": "string",
        "description": "The status of the property (e.g., ForSale, ForRent). Optional.",
        "enum": [
          "ForSale",
          "ForRent"
        ],
        "default": "ForSale"
      },
      "home_type": {
        "type": "string",
        "description": "The type of home for the specified status_type. Optional.",
        "enum": [
          "Townhomes",
          "Houses",
          "Apartments_Condos_Co-ops",
          "Multi-family",
          "Apartments",
          "Houses",
          "Manufactured",
          "Condos",
          "LotsLand",
          "Townhomes"
        ],
        "default": "Houses"
      },
      "sort": {
        "type": "string",
        "description": "Sort order for the results. Optional.",
        "enum": [
          "Price_High_Low",
          "Price_Low_High",
          "Newest",
          "Square_Feet"
        ],
        "default": "Price_Low_High"
      },
      "minPrice": {
        "type": "number",
        "description": "The minimum price of the property. Optional."
      },
      "maxPrice": {
        "type": "number",
        "description": "The maximum price of the property. Optional."
      },
      "bathsMin": {
        "type": "number",
        "description": "The minimum number of bathrooms. Optional."
      },
      "bathsMax": {
        "type": "number",
        "description": "The maximum number of bathrooms. Optional."
      },
      "bedsMin": {
        "type": "number",
        "description": "The minimum number of bedrooms. Optional."
      },
      "bedsMax": {
        "type": "number",
        "description": "The maximum number of bedrooms. Optional."
      },
      "sqftMin": {
        "type": "number",
        "description": "The minimum square footage. Optional."
      },
      "sqftMax": {
        "type": "number",
        "description": "The maximum square footage. Optional."
      },
      "buildYearMin": {
        "type": "number",
        "description": "The minimum build year of the property. Optional."
      },
      "buildYearMax": {
        "type": "number",
        "description": "The maximum build year of the property. Optional."
      },
      "isBasementUnfinished": {
        "type": "number",
        "description": "Filter for properties with an unfinished basement. Set to '1' if needed. Optional."
      },
      "isNewConstruction": {
        "type": "number",
        "description": "Filter for properties with new construction status. Set to '1' if needed. Optional."
      },
      "lotSizeMin": {
        "type": "string",
        "description": "The minimum lot size in square feet. Optional.",
        "enum": [
          "1000",
          "2000",
          "3000",
          "4000",
          "5000",
          "7500",
          "10890",
          "21780",
          "43560",
          "87120",
          "217800",
          "435600",
          "871200",
          "2178000",
          "4356000"
        ]
      },
      "lotSizeMax": {
        "type": "string",
        "description": "The maximum lot size in square feet. Optional.",
        "enum": [
          "1000",
          "2000",
          "3000",
          "4000",
          "5000",
          "7500",
          "10890",
          "21780",
          "43560",
          "87120",
          "217800",
          "435600",
          "871200",
          "2178000",
          "4356000"
        ]
      },
      "hasAirConditioning": {
        "type": "boolean",
        "description": "Filter for properties with air conditioning. Optional."
      },
      "includeHomesWithNoHoaData": {
        "type": "boolean",
        "description": "whether to include listings without HOA data.",
        "default": "true"
      },
      "hasGarage": {
        "type": "boolean",
        "description": "Filter for properties with a garage. Optional."
      }
    },
    "required": [
      "location"
    ]
  }
}
*/
// "enum": ["1,000 sqft", "2,000 sqft", "3,000 sqft", "4,000 sqft", "5,000 sqft", "7,500 sqft", "1/4 acre/10,890 sqft", "1/2 acre/21,780 sqft", "1 acre/43,560 sqft"]