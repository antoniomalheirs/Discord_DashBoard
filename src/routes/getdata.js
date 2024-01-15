const express = require("express");
const router = express.Router();
const discordBot = require("../Client");
const { ChannelType } = require("discord.js");
const mongoose = require("mongoose");
const usersrepository = require("../database/mongoose/UsersRepository");
const UserSchema = require("../database/schemas/UserSchema");
mongoose.model("Users", UserSchema);
const videosrepository = require("../database/mongoose/VideosRepository");
const VideoSchema = require("../database/schemas/VideoSchema");
const YTBCHANNELTOID = require("../utils/YTBCHANNELTOID.js");
const RegistradorYTBVideo = require("../utils/RegistradorYTBVideo.js");
mongoose.model("Videos", VideoSchema);

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
};

const getDatabase1 = async (guildId) => {
  try {
    const videos = new videosrepository(mongoose, "Videos");
    const ls = videos.findAllByGuildId(guildId);
    return ls;
  } catch (error) {
    console.error("Erro ao obter dados da guilda:", error);
    throw error;
  }
};

const getDatabase = async (guildId) => {
  try {
    const users = new usersrepository(mongoose, "Users");
    const ls = users.findAllByGuildId(guildId);
    return ls;
  } catch (error) {
    console.error("Erro ao obter dados da guilda:", error);
    throw error;
  }
};

// Função para obter dados da guilda
const getGuildData = async (guildId) => {
  try {
    await discordBot.guilds.fetch(guildId);

    const guild = await discordBot.guilds.cache.get(guildId);
    await guild.members.fetch();
    await guild.channels.fetch();

    const voiceChannels = guild.channels.cache.filter(
      (channel) => channel.type === ChannelType.GuildVoice
    ).size;

    const textChannels = guild.channels.cache.filter(
      (channel) => channel.type === ChannelType.GuildText
    ).size;

    const memberCount = guild.memberCount;

    const iconURL = `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`;

    return {
      name: guild.name,
      id: guild.id,
      description: guild.description || "Sem descrição disponível",
      memberCount: memberCount,
      voiceChannels: voiceChannels,
      textChannels: textChannels,
      guildCount: discordBot.guilds.cache.size,
      botStatus: discordBot.presence.status,
      uptime: getBotUptime(),
      icon: iconURL,
    };
  } catch (error) {
    console.error("Erro ao obter dados da guilda:", error);
    throw error;
  }
};

const getBotUptime = () => {
  const uptimeMilliseconds = discordBot.uptime;
  const uptimeSeconds = Math.floor(uptimeMilliseconds / 1000);
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
};

router.post("/botinfo", isAuthenticated, async (req, res) => {
  try {
    const selectedGuildId = req.body.guilds;
    const botInfo = await getGuildData(selectedGuildId);
    res.render("guildcontentmain.ejs", { info: botInfo });
  } catch (error) {
    res.render("error.ejs");
  }
});

router.get("/botinfo/:guildId", isAuthenticated, async (req, res) => {
  try {
    const guildId = req.params.guildId;
    const botInfo = await getGuildData(guildId);
    res.render("guildcontentmain.ejs", { info: botInfo });
  } catch (error) {
    res.status(500).send("Erro ao obter informações da guilda");
  }
});

router.get("/recarregar-guilda/:guildId", isAuthenticated, async (req, res) => {
  try {
    const guildId = req.params.guildId;
    const guildInfo = await getGuildData(guildId);
    res.json(guildInfo);
  } catch (error) {
    res.status(500).json({ error: "Erro ao recarregar informações da guilda" });
  }
});

router.get("/database-guilda", isAuthenticated, async (req, res) => {
  try {
    const guildId = req.query.guildId;
    const botInfo = await getGuildData(guildId);
    const userinfo = await getDatabase(guildId);
    const videoinfo = await getDatabase1(guildId);
    res.render("databasemanager.ejs", {
      info: botInfo,
      info1: userinfo,
      info2: videoinfo,
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao obter informações da guilda" });
  }
});

router.get("/database-guilda/:guildId", isAuthenticated, async (req, res) => {
  try {
    const guildId = req.params.guildId;
    const botInfo = await getGuildData(guildId);

    //res.render("databasemanager.ejs", { info: botInfo });
    res.json(botInfo);
  } catch (error) {
    res.status(500).json({ error: "Erro ao recarregar informações da guilda" });
  }
});

router.get(
  "/obter-icone-guilda/:guildId",
  isAuthenticated,
  async (req, res) => {
    try {
      const guildId = req.params.guildId;
      const guild = req.user.guilds.find((guild) => guild.id === guildId);

      if (!guild) {
        return res.status(404).json({ error: "Guilda não encontrada" });
      }

      if (!guild.icon) {
        return res.status(404).json({ error: "O servidor não tem um ícone" });
      }

      // Retorna diretamente a URL como uma string
      const iconURL = `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`;
      res.send({ iconURL });
    } catch (error) {
      console.error("Erro ao obter ícone da guilda:", error);
      res.status(500).json({ error: "Erro ao obter ícone da guilda" });
    }
  }
);

router.post("/adicionar-dados", isAuthenticated, async (req, res) => {
  try {
    // Adicione lógica para validar e processar os dados conforme necessário
    const channelInput = req.body.newData;
    const guildId = req.body.guildId;

    const videoRepository = new videosrepository(mongoose, "Videos");

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

      const noBanco = await videoRepository.findByYoutubeAndGuildId(channelInput,guildId, projection);

      if (noBanco != null) {
        res.status(200).json({
          success: false,
          message: "Canal já existe no banco de dados.",
        });
      } else {
        const result = await YTBCHANNELTOID.bind(this)(videoId);
        result.notifyGuild = guildId;
        await RegistradorYTBVideo.bind(this)(result);

        res.status(200).json({
          success: true,
          message: "Dados adicionados com sucesso ao banco de dados.",
        });
      }
    }
  } catch (error) {
    console.error("Erro ao adicionar dados ao banco de dados:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao adicionar dados ao banco de dados.",
    });
  }
});

module.exports = router;
