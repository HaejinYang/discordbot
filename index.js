// 1. 주요 클래스 가져오기
const { Client, Events, GatewayIntentBits } = require("discord.js");
const { DISCORD_BOT_TOKEN, OPENAPI_KEY } = require("./config.json");
const { joinVoiceChannel, EndBehaviorType } = require("@discordjs/voice");
const { convertPcmToWav } = require("./pcm-to-wav.js");
const { transcribeWithWhisper } = require("./call-whisper.js");
const { askGpt, extractGptCommand } = require("./call-gpt.js");
const { speakTextInVoiceChannel } = require("./speak-text.js");
const prism = require("prism-media");
const fs = require("fs");
const path = require("path");

// 2. 클라이언트 객체 생성 (Guilds관련, 메시지관련 인텐트 추가)
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// 3. 봇이 준비됐을때 한번만(once) 표시할 메시지
client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on("messageCreate", async (message) => {
  // 헬스 체크
  if (message.content == "!ping") {
    message.reply("pong");
  }

  if (message.content === "!join") {
    const voiceChannel = message.member?.voice.channel;
    if (!voiceChannel) return message.reply("음성 채널에 먼저 들어가 주세요!");

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    message.reply("음성 채널에 입장했어요!");

    // 수신기 꺼내기
    const receiver = connection.receiver;

    // 음성 인식 후 처리
    receiver.speaking.on("start", (userId) => {
      const user = client.users.cache.get(userId);
      if (!user || user.bot) return;

      console.log(`🎙️ ${user.tag} is speaking`);

      // 음성 인식
      const audioStream = receiver.subscribe(userId, {
        end: {
          behavior: EndBehaviorType.AfterSilence,
          duration: 2000, // 2초 이상 침묵 시 종료
        },
      });

      const recordingPath = path.join(__dirname, `./recordings/${userId}.pcm`);
      const writer = fs.createWriteStream(recordingPath);

      const pcmStream = new prism.opus.Decoder({
        rate: 48000,
        channels: 2,
        frameSize: 960,
      });

      // 인식한 음성을 저장
      audioStream.pipe(pcmStream).pipe(writer);

      // 저장 완료 후 처리
      writer.on("finish", async () => {
        console.log(`💾 ${user.tag}의 오디오 저장됨: ${recordingPath}`);
        const filePath = recordingPath;

        if (!fs.existsSync(filePath)) {
          return message.reply(`파일을 찾을 수 없어요: ${filePath}`);
        }

        const pcmPath = recordingPath;
        const wavPath = path.join(__dirname, `./recordings/${userId}.wav`);

        // pcm -> wav로 변환후, whiser api를 이용하여 텍스트 추출, gpt에 물어보고, 응답 반환까지
        async function handleVoiceTranscription() {
          const wavFile = await convertPcmToWav(pcmPath, wavPath);
          const resultText = await transcribeWithWhisper(wavFile, OPENAPI_KEY);
          console.log("📝 Whisper 인식 결과:", resultText);

          const command = extractGptCommand(resultText);
          if (command) {
            const gptResponse = await askGpt(command);
            console.log(gptResponse);
            speakTextInVoiceChannel(gptResponse, voiceChannel);
          }
        }

        await handleVoiceTranscription();
      });
    });
  }
});

// 5. 시크릿키(토큰)을 통해 봇 로그인 실행
client.login(DISCORD_BOT_TOKEN);
