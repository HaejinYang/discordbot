const ffmpeg = require("fluent-ffmpeg");
const path = require("path");

function convertPcmToWav(pcmPath, wavPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(pcmPath)
      .inputOptions(["-f s16le", "-ar 48000", "-ac 2"])
      .outputOptions(["-ar 16000"]) // Whisper가 잘 받아들이는 설정
      .toFormat("wav")
      .save(wavPath)
      .on("end", () => resolve(wavPath))
      .on("error", reject);
  });
}

module.exports = {
  convertPcmToWav,
};
