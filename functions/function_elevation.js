// function_elevation.js

const function_elevation = async ({ latitude, longitude }) => {
  console.log("function_elevation function was called");

  try {
    const elevationURL = `https://api.open-elevation.com/api/v1/lookup?locations=${latitude},${longitude}`;
    const response = await fetch(elevationURL);
    const elevationResponse = await response.json();
    const elevation = elevationResponse.results[0].elevation;
    console.log(`elevation at ${latitude}, ${longitude} is ${elevation} meters`);
    return elevation;
  }
  catch (error) {
    console.error("Error in function_elevation:", error);
    return { error: error.message };
  }
}

module.exports = { function_elevation };