const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

async function transcribeWithWhisper(wavPath, openaiApiKey) {
  const form = new FormData();
  form.append("file", fs.createReadStream(wavPath));
  form.append("model", "whisper-1");

  const response = await axios.post(
    "https://api.openai.com/v1/audio/transcriptions",
    form,
    {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${openaiApiKey}`,
      },
    }
  );

  return response.data.text;
}

module.exports = {
  transcribeWithWhisper,
};
