const mongoose = require("mongoose");
const VideosRepository = require("../database/mongoose/VideosRepository.js");
const VideoSchema = require("../database/schemas/VideoSchema.js");
mongoose.model("Videos", VideoSchema);

module.exports = async function addOrUpdateVideo(channel) {
  // Criar a instância do VideosRepository
  const videoRepository = new VideosRepository(mongoose, "Videos");

  if (channel != null) {
    try {
      // Verificar se o vídeo já existe no banco de dados
      const videoExists = await videoRepository.verifyByYoutubeAndGuildId(channel.youtube, channel.notifyGuild);

      if (videoExists) {
        // Se o vídeo existir, atualize os dados
        const updateData = {
          channel: channel.channel,
          lastVideo: channel.lastVideo,
          lastPublish: channel.lastPublish,
          message: channel.message,
          //
          // ... outros campos do vídeo
        };

        const updatedVideo = await videoRepository.updateByYoutubeIdAndGuildId(channel.youtube, channel.notifyGuild, updateData);

        console.log("Vídeo atualizado com sucesso:", updatedVideo);
      } else {
        // Se o vídeo não existir, adicione-o ao banco de dados
        const newVideo = {
          youtube: channel.youtube,
          channel: channel.channel,
          lastVideo: channel.lastVideo,
          lastPublish: channel.lastPublish,
          message: channel.message,
          notifyGuild: channel.notifyGuild,
          // ... outros campos do vídeo
        };

        const addedVideo = await videoRepository.add(newVideo);

        console.log("Vídeo adicionado com sucesso:", addedVideo);
      }
    } catch (error) {
      console.error("Erro ao adicionar/atualizar vídeo:", error.message);
    }
  }
};
