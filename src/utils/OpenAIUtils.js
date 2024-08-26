const { Configuration, OpenAIApi } = require("openai");
const config = require('../config/config');

const configuration = new Configuration({
  apiKey: config.openaiApiKey,
});
const openai = new OpenAIApi(configuration);

async function askOpenAI(prompt) {
  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      max_tokens: 50,
    });
    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error("Error with OpenAI API:", error.message);
    return null;
  }
}

async function identifySelector(page, description) {
    const prompt = `Identify the CSS selector for the ${description} on the current web page.`;
    const selector = await askOpenAI(prompt);
    if (!selector) {
        throw new Error(`Failed to identify selector for ${description}`);
    }
    return selector;
}

module.exports = { askOpenAI, identifySelector };
