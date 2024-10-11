// get_vision.js

const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_APIKEY });

const get_vision = async ({ prompt, imageURLs }) => {
  try {
    console.log(`get_vision function was called`);

    const content = [
      { type: "text", text: prompt },
      ...imageURLs.map(url => ({ type: "image_url", image_url: { url: url } }))
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "user",
        content: content
      }]
    });
    const result = response.choices[0].message.content;
    return result;
  }
  catch (error) {
    console.error("Error in get_vision:", error);
    return { error: error.message };
  }
};

module.exports = { get_vision };

/* function call
{
  "name": "get_vision",
  "description": "Retrieves image analysis from ChatGPT Vision API. Useful when asked about the contents of an image.",
  "parameters": {
    "type": "object",
    "properties": {
      "prompt": {
        "type": "string",
        "description": "The image query."
      },
      "imageURLs": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "The image urls to analyze."
      }
    },
    "required": [
      "prompt",
      "imageURLs"
    ]
  }
}
*/