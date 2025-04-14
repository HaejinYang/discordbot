const {
  createAudioResource,
  createAudioPlayer,
  joinVoiceChannel,
  StreamType,
} = require("@discordjs/voice");
const googleTTS = require("google-tts-api");
const axios = require("axios");

async function speakTextInVoiceChannel(text, voiceChannel) {
  const url = googleTTS.getAudioUrl(text.slice(0, 200), {
    lang: "ko",
    slow: false,
    host: "https://translate.google.com",
  });

  const response = await axios.get(url, {
    responseType: "stream",
  });

  const resource = createAudioResource(response.data, {
    inputType: StreamType.Arbitrary,
  });

  const player = createAudioPlayer();
  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
  });

  connection.subscribe(player);
  player.play(resource);

  //   player.on("idle", () => {
  //     connection.destroy();
  //   });
}

module.exports = {
  speakTextInVoiceChannel,
};
