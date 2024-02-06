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
const guildsrepository = require("../database/mongoose/GuildsRepository");
const GuildSchema = require("../database/schemas/GuildSchema");
mongoose.model("Guilds", GuildSchema);
const twitchsrepository = require("../database/mongoose/TwitchsRepository");
const TwitchSchema = require("../database/schemas/TwitchSchema");
mongoose.model("Twitchs", TwitchSchema);
const TwitchToken = require("../utils/TwitchToken.js");
const TwitchID = require("../utils/TwitchID.js");
const { Result } = require("postcss");

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
};

const getVideos = async (guildId) => {
  try {
    const videos = new videosrepository(mongoose, "Videos");
    const ls = videos.findAllByGuildId(guildId);
    return ls;
  } catch (error) {
    console.error("Erro ao obter dados da guilda:", error);
    throw error;
  }
};

const getGuilds = async (guildId) => {
  try {
    const guilds = new guildsrepository(mongoose, "Guilds");
    const ls = guilds.findOne(guildId);
    return ls;
  } catch (error) {
    console.error("Erro ao obter dados da guilda:", error);
    throw error;
  }
};

const getGuilds = async (guildId) => {
  try {
    const guilds = new guildsrepository(mongoose, "Guilds");
    const ls = guilds.findOne(guildId);
    return ls;
  } catch (error) {
    console.error("Erro ao obter dados da guilda:", error);
    throw error;
  }
};

const getTwitch = async (guildId) => {
  try {
    const channels = new twitchsrepository(mongoose, "Twitchs");
    const ls = channels.findAllByGuildId(guildId);
    return ls;
  } catch (error) {
    console.error("Erro ao obter dados da guilda:", error);
    throw error;
  }
};

const getUsers = async (guildId) => {
  try {
    const users = new usersrepository(mongoose, "Users");
    const ls = users.findAllByGuildId(guildId);
    return ls;
  } catch (error) {
    console.error("Erro ao obter dados da guilda:", error);
    throw error;
  }
};

const getDatabase2 = async () => {
  try {
    const servers = new guildsrepository(mongoose, "Guilds");
    const projection = {
      guildID: 1,
      guildName: 1,
      youtubenotify: 1,
      channelytb: 1,
      channeltch: 1,
      twitchnotify: 1,
    };
    const ls = servers.findAll(projection);
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

router.post("/botinfo", isAuthenticated, async (req, res) => {
  try {
    const selectedGuildId = req.body.guilds;
    const botInfo = await getGuildData(selectedGuildId);
    res.render("guildcontentmain.ejs", { info: botInfo });
  } catch (error) {
    res.render("error.ejs");
  }
});

router.get("/infoguilds", isAuthenticated, async (req, res) => {
  const serversInfo = await getDatabase2();
  res.render("guildsinfo.ejs", {
    info: serversInfo,
  });
});

router.get("/functions-guilda", isAuthenticated, async (req, res) => {
  try {
    const guildId = req.query.guildId;
    const botInfo = await getGuildData(guildId);
    const guildinfo = await getGuilds(guildId);
    const videoinfo = await getVideos(guildId);
    const twicthinfo = await getTwitch(guildId);

    res.render("functionmanager.ejs", {
      info: botInfo,
      info2: videoinfo,
      info3: twicthinfo,
      info4: guildinfo,
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao obter informações da guilda" });
  }
});

router.get("/database-guilda", isAuthenticated, async (req, res) => {
  try {
    const guildId = req.query.guildId;
    const botInfo = await getGuildData(guildId);
    const userinfo = await getUsers(guildId);
    const videoinfo = await getVideos(guildId);
    const twicthinfo = await getTwitch(guildId);

    res.render("databasemanager.ejs", {
      info: botInfo,
      info1: userinfo,
      info2: videoinfo,
      info3: twicthinfo,
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao obter informações da guilda" });
  }
});

router.post("/adicionar-dados-youtube", isAuthenticated, async (req, res) => {
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

      const noBanco = await videoRepository.findByYoutubeAndGuildId(
        channelInput,
        guildId,
        projection
      );

      if (noBanco != null) {
        res.render("dataadderror.ejs", {});
      } else {
        const result = await YTBCHANNELTOID.bind(this)(videoId);
        console.log(result);

        if (!result) {
          res.status(200).json({
            success: false,
            message: "Nada encontrado.",
          });
        } else {
          const guildId = req.body.guildId;
          const guild = await discordBot.guilds.cache.get(guildId);

          result.notifyGuild = guildId;
          let canal = result.channel;
          let id = result.youtube;
          await RegistradorYTBVideo.bind(this)(result);
          res.render("datafuncadd.ejs", {
            info: canal,
            info1: guild.name,
            info2: id,
            nome: req.body.nome,
          });
        }
      }
    }
  } catch (error) {
    console.error("Erro ao adicionar dados ao banco de dados:", error);
    res.render("dataadderror.ejs", {});
  }
});

router.post("/adicionar-dados-twitch", isAuthenticated, async (req, res) => {
  try {
    // Adicione lógica para validar e processar os dados conforme necessário
    const channelInput = req.body.newData;
    const guildId = req.body.guildId;

    const twitchRepository = new twitchsrepository(mongoose, "Twitchs");

    if (channelInput != null) {
      const clientId = process.env.TWITCH_CLIENTID;
      const clientSecret = process.env.TWITCH_SECRETID;
      const accessToken = await TwitchToken(clientId, clientSecret);
      const channelId = await TwitchID(accessToken, channelInput, clientId);
      const guild = await discordBot.guilds.cache.get(guildId);

      const projection = {
        twitch: channelId,
        channel: channelInput,
        guildID: guildId,
      };

      const noBanco = await twitchRepository.findByTwitchAndGuildId(
        channelId,
        guildId,
        projection
      );

      if (noBanco != null) {
        res.render("dataadderror.ejs", {});
      } else {
        if (channelId == null) {
          res.status(200).json({
            success: false,
            message: "Dados do canal não encontrados.",
          });
        } else {
          await twitchRepository.add(projection);
          console.log(projection);
          res.render("datafuncadd.ejs", {
            info: channelInput,
            info1: guild.name,
            info2: channelId,
            nome: req.body.nome,
          });
        }
      }
    }
  } catch (error) {
    console.error("Erro ao adicionar dados ao banco de dados:", error);
    res.render("dataadderror.ejs", {});
  }
});

router.post("/ativar/funcytb", isAuthenticated, async (req, res) => {
  try {
    const guildId = req.body.guildId;

    const guilds = new guildsrepository(mongoose, "Guilds");
    const ls = guilds.findOne(guildId);

    if (!ls) {
      throw new Error(
        "ID da guilda não fornecido ou a Guilda nao gerenciavel."
      );
    }

    ls.youtubenotify = true;

    const channelInput = req.body.newDat5;
    const chan = req.body.ytb;
    const func = req.body.nome;

    await discordBot.guilds.fetch(guildId);

    const guild = await discordBot.guilds.cache.get(guildId);
    const channel = await guild.channels.fetch(channelInput);

    if (!guild && !channel) {
      throw new Error("Guilda não encontrada ou Canal não encontrado.");
    }
    ls.channelytb = channelInput;
    const message = channel.name;
    const message2 = channelInput;

    guilds.update(guildId, ls);

    res.render("functionactivated.ejs", {
      info: message,
      info2: guild.name,
      info3: message2,
      nome: func,
    });
  } catch (error) {
    console.error("Erro na rota /bot/ativar/funcytb:", error);
    res.render("activefuncerror.ejs");
  }
});

router.post("/ativar/functch", isAuthenticated, async (req, res) => {
  try {
    const guildId = req.body.guildId;
    const func = req.body.nome;
    const guilds = new guildsrepository(mongoose, "Guilds");
    const ls = guilds.findOne(guildId);

    if (!ls) {
      throw new Error(
        "ID da guilda não fornecido ou a Guilda nao gerenciavel."
      );
    }

    ls.twitchnotify = true;

    const channelInput = req.body.newDat6;
    const chan = req.body.tch;

    await discordBot.guilds.fetch(guildId);

    const guild = await discordBot.guilds.cache.get(guildId);
    const channel = await guild.channels.fetch(channelInput);

    if (!guild && !channel) {
      throw new Error("Guilda não encontrada ou Canal não encontrado.");
    }
    ls.channeltch = channelInput;
    const message = channel.name;
    const message2 = channelInput;

    guilds.update(guildId, ls);

    res.render("functionactivated.ejs", {
      info: message,
      info2: guild.name,
      info3: message2,
      nome: func,
    });
  } catch (error) {
    console.error("Erro na rota /bot/ativar/funcytb:", error);
    res.render("activefuncerror.ejs");
  }
});

module.exports = router;
