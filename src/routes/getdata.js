const express = require("express");
const ejs = require("ejs");
const path = require("path");
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

router.get("/obter-icone-guilda/:guildId", isAuthenticated, async (req, res) => {
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
});

router.post("/botinfo", isAuthenticated, async (req, res) => {
  try {
    const selectedGuildId = req.body.guilds;
    const botInfo = await getGuildData(selectedGuildId);
    res.render("teste.ejs", { info: botInfo, user: req.user });
  } catch (error) {
    res.render("error.ejs");
  }
});

router.get("/pagina/:page/:param2", isAuthenticated, async (req, res) => {
  const page = req.params.page;
  const guildId = req.params.param2;
  const botInfo = await getGuildData(guildId);
  const videoinfo = await getVideos(guildId);
  const lives = await getTwitch(guildId);
  const guildinfo = await getGuilds(guildId);
  const userinfo = await getUsers(guildId);
  console.log(page, guildId);

  // Use uma estrutura de controle, como um switch, para determinar qual página renderizar
  switch (page) {
    case "server":
      // Renderize a página 1 com o segundo parâmetro
      const server = await ejs.renderFile(
        path.join(__dirname, "../views/serverinfo.ejs"),
        { info: botInfo }
      );
      res.send(server);
      break;
    case "status":
      // Renderize a página 1 com o segundo parâmetro
      const status = await ejs.renderFile(
        path.join(__dirname, "../views/botstatus.ejs"),
        { info: botInfo }
      );
      res.send(status);
      break;
    case "funcyoutube":
      // Renderize a página 1 com o segundo parâmetro
      const funcyoutube = await ejs.renderFile(
        path.join(__dirname, "../views/youtubefunc.ejs"),
        { info: botInfo, info2: videoinfo }
      );
      res.send(funcyoutube);
      break;
    case "functwitch":
      // Renderize a página 1 com o segundo parâmetro
      const functwitch = await ejs.renderFile(
        path.join(__dirname, "../views/twitchfunc.ejs"),
        { info: botInfo, info3: lives }
      );
      res.send(functwitch);
      break;
    case "ytbchannelupdate":
      // Renderize a página 1 com o segundo parâmetro
      const ytbchannelupdate = await ejs.renderFile(
        path.join(__dirname, "../views/updatenotytb.ejs"),
        { info: botInfo }
      );
      res.send(ytbchannelupdate);
      break;
    case "tchchannelupdate":
      // Renderize a página 1 com o segundo parâmetro
      const tchchannelupdate = await ejs.renderFile(
        path.join(__dirname, "../views/updatenottch.ejs"),
        { info: botInfo }
      );
      res.send(tchchannelupdate);
      break;
    case "statesinfo":
      // Renderize a página 1 com o segundo parâmetro
      const statesinfo = await ejs.renderFile(
        path.join(__dirname, "../views/serverfuncstate.ejs"),
        { info: botInfo, info4: guildinfo }
      );
      res.send(statesinfo);
      break;
    case "viewytbchannels":
      // Renderize a página 1 com o segundo parâmetro
      const viewytbchannels = await ejs.renderFile(
        path.join(__dirname, "../views/ytbviewinfo.ejs"),
        { info: botInfo, info2: videoinfo }
      );
      res.send(viewytbchannels);
      break;
    case "deleteytbchannels":
      // Renderize a página 1 com o segundo parâmetro
      const viewytbchanne = await ejs.renderFile(
        path.join(__dirname, "../views/ytbdeleteinfo.ejs"),
        { info: botInfo, info2: videoinfo }
      );
      res.send(viewytbchanne);
      break;
    case "addytbchannel":
      // Renderize a página 1 com o segundo parâmetro
      const addytbchannel = await ejs.renderFile(
        path.join(__dirname, "../views/addytbchannel.ejs"),
        { info: botInfo }
      );
      res.send(addytbchannel);
      break;
    case "viewtchchannel":
      // Renderize a página 1 com o segundo parâmetro
      const viewtchchannel = await ejs.renderFile(
        path.join(__dirname, "../views/tchviewinfo.ejs"),
        { info: botInfo, info3: lives }
      );
      res.send(viewtchchannel);
      break;
    case "deletetchchannel":
      // Renderize a página 1 com o segundo parâmetro
      const viewtchhchanne = await ejs.renderFile(
        path.join(__dirname, "../views/tchdeleteinfo.ejs"),
        { info: botInfo, info2: lives }
      );
      res.send(viewtchhchanne);
      break;
    case "addtchchannel":
      // Renderize a página 1 com o segundo parâmetro
      const addtchchannel = await ejs.renderFile(
        path.join(__dirname, "../views/addtchchannel.ejs"),
        { info: botInfo }
      );
      res.send(addtchchannel);
      break;
    case "memberinfo":
      // Renderize a página 1 com o segundo parâmetro
      const memberinfo = await ejs.renderFile(
        path.join(__dirname, "../views/membersinfo.ejs"),
        { info: botInfo, info1: userinfo }
      );
      res.send(memberinfo);
      break;
    default:
      // Se o parâmetro não corresponder a nenhuma página conhecida, retorne um erro 404
      res.status(404).send("Página não encontrada");
  }
});

router.get("/pagina/funcs/:page/:guildId/:channelin", isAuthenticated, async (req, res) => {
  const page = req.params.page;
  const guildId = req.params.guildId;
  const channelin = req.params.channelin;

  try {
    const guilds = new guildsrepository(mongoose, "Guilds");
    const ls = guilds.findOne(guildId);

    if (!ls) {
      throw new Error(
        "ID da guilda não fornecido ou a Guilda nao gerenciavel."
      );
    }

    await discordBot.guilds.fetch(guildId);

    const guild = discordBot.guilds.cache.get(guildId);

    if (!guild) {
      throw new Error("Guilda não encontrada.");
    }

    const channel = guild.channels.cache.get(channelin);

    if (!channel) {
      throw new Error("Canal não encontrado na guilda.");
    }

    const message = channel.name;
    const message2 = guild.name;

    // Use um switch case para decidir o que fazer com base no valor de 'page'
    switch (page) {
      case "actyoutube":
        const na = "do Youtube";
        ls.youtubenotify = true;
        ls.channelytb = channelin;
        guilds.update(guildId, ls);
        // Aqui, você usa sendFile para enviar o arquivo EJS específico para 'youtube'
        const actfuncytb = await ejs.renderFile(
          path.join(__dirname, "../views/functionactivated.ejs"),
          { info: message, info2: message2, info3: channelin, nome: na }
        );
        res.send(actfuncytb);
        break;
      // Adicione mais casos conforme necessário
      case "acttwitch":
        const nan = "da Twitch";
        ls.twitchnotify = true;
        ls.channeltch = channelin;
        guilds.update(guildId, ls);
        // Aqui, você usa sendFile para enviar o arquivo EJS específico para 'youtube'
        const actfunctch = await ejs.renderFile(
          path.join(__dirname, "../views/functionactivated.ejs"),
          { info: message, info2: message2, info3: channelin, nome: nan }
        );
        res.send(actfunctch);
        break;
      case "updtyoutube":
        const nana = "do Youtube";
        ls.channelytb = channelin;
        guilds.update(guildId, ls);
        // Aqui, você usa sendFile para enviar o arquivo EJS específico para 'youtube'
        const updtfuncytb = await ejs.renderFile(
          path.join(__dirname, "../views/functionactivated.ejs"),
          { info: message, info2: message2, info3: channelin, nome: nana }
        );
        res.send(updtfuncytb);
        break;
      case "updttwitch":
        const nanan = "da Twitch";
        ls.channeltch = channelin;
        guilds.update(guildId, ls);
        // Aqui, você usa sendFile para enviar o arquivo EJS específico para 'youtube'
        const updtfunctch = await ejs.renderFile(
          path.join(__dirname, "../views/functionactivated.ejs"),
          { info: message, info2: message2, info3: channelin, nome: nanan }
        );
        res.send(updtfunctch);
        break;
    }
  } catch (error) {
    console.error("Erro na rota /pagina/funcs/youtube:", error);

    // Aqui, você usa sendFile para enviar o arquivo EJS de erro
    const errorView = await ejs.renderFile(
      path.join(__dirname, "../views/activefuncerror.ejs")
    );
    res.send(errorView);
  }
});

router.get("/pagina/dtbase/:page/:guildId/:channelin", isAuthenticated, async (req, res) => {
  const page = req.params.page;
  const guildId = req.params.guildId;
  const channelInput = req.params.channelin;
  const botInfo = await getGuildData(guildId);
  const videoinfo = await getVideos(guildId);
  const lives = await getTwitch(guildId);

  try {
    // Adicione lógica para validar e processar os dados conforme necessário
    switch (page) {
      case "addyoutubech":
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
              const guild = await discordBot.guilds.cache.get(guildId);

              result.notifyGuild = guildId;
              let canal = result.channel;
              let id = result.youtube;
              await RegistradorYTBVideo.bind(this)(result);
              res.render("datafuncadd.ejs", {
                info: canal,
                info1: guild.name,
                info2: id,
                nome: channelInput,
              });
            }
          }
        }
        break;
      case "addtwitchch":
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
                nome: channelInput,
              });
            }
          }
        }
        break;
      case "delyoutubech":
        const videoRepo = new videosrepository(mongoose, "Videos");
        
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
  
          const noBanco = await videoRepo.verifyByYoutubeAndGuildId(
            channelInput,
            guildId,
            projection
          );
          
          if (noBanco != null) {
            console.log(await videoRepo.deletar(videoId, guildId));
            res.render("ytbdeleteinfo.ejs", {info: botInfo, info2: videoinfo});
          } else {
            res.render("dataadderror.ejs", {});
          }
        }
        break; 
      case "deltwitchch":
        const twitchRepo = new twitchsrepository(mongoose, "Twitchs");
        
        if (channelInput != null) {
          const videoId = channelInput;
          const projection = {
            twitch: 1,
            channel: 1,
            guildID: 1,
          };
  
          const noBanco = await twitchRepo.verifyByTwitchAndGuildId(
            channelInput,
            guildId,
            projection
          );
          
          if (noBanco != null) {
            console.log(await twitchRepo.deletar(videoId, guildId));
            res.render("tchdeleteinfo.ejs", {info: botInfo, info2: lives});
          } else {
            res.render("dataadderror.ejs", {});
          }
        }
        break;
    }
  } catch (error) {
    console.error("Não foi possivel excluir os dados:", error);
    res.render("dataadderror.ejs", {});
  }
});

router.get("/infoguilds", isAuthenticated, async (req, res) => {
  const serversInfo = await getDatabase2();
  res.render("guildsinfo.ejs", {
    info: serversInfo,
  });
});

module.exports = router;
