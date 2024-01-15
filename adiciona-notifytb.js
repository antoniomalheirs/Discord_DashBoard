const { SlashCommandBuilder } = require("discord.js");
const mongoose = require("mongoose");
const VideoSchema = require("../database/schemas/VideoSchema.js");
const VideosRepository = require("../database/mongoose/VideosRepository.js");
const YTBCHANNELTOID = require("../utils/YTBCHANNELTOID.js");
const RegistradorYTBVideo = require("../functions/RegistradorYTBVideo.js");
mongoose.model("Videos", VideoSchema);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("adicionaryoutube")
    .setDescription(
      "Adiciona um canal do YouTube para receber notificações no canal de vídeos"
    )
    .addStringOption((option) =>
      option
        .setName("canal")
        .setDescription("Nome do canal do YouTube")
        .setRequired(true)
    ),
  // Define a permissão padrão como 'false'

  async execute(interaction) {
    // Obter o valor do parâmetro 'canal' fornecido pelo usuário
    const channelInput = interaction.options.getString("canal");

    const videoRepository = new VideosRepository(mongoose, "Videos");

    if (channelInput != null) {
      const videoId = channelInput;
      const projection = {
        youtube: 1,
        channel: 1,
        lastVideo: 1,
        lastPublish: 1,
        message: 1,
        notifyGuild: 1,
      };

      const noBanco = await videoRepository.findByChannel(videoId, projection);
      const guildId = interaction.guild?.id;

      if (noBanco != null) {
        return interaction.reply(
          "Esse canal já foi adicionado anteriormente, Por favor, informe outro canal!"
        );
      } else {
        const result = await YTBCHANNELTOID.bind(this)(videoId);
        console.log(result);
        result.notifyGuild = guildId;
        await RegistradorYTBVideo.bind(this)(result);
        return interaction.reply(
          `O canal ${result.channel} foi listado. Fica suave, vamos tocar no radin quando sair videozao novo!`
        ); // Retorna false quando não existe
      }
    }
  },
};
