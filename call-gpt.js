const { OpenAI } = require("openai");
const { OPENAPI_KEY } = require("./config.json");
const openai = new OpenAI({ apiKey: OPENAPI_KEY });

async function askGpt(prompt) {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo", // 또는 gpt-4
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: prompt },
    ],
  });

  return response.choices[0].message.content.trim();
}

function extractGptCommand(text) {
  const lower = text.toLowerCase().trim();
  const trigger = "안녕 보이스봇";
  if (lower.startsWith(trigger)) {
    return lower.slice(trigger.length).trim();
  }
  return null;
}

module.exports = {
  askGpt,
  extractGptCommand,
};
