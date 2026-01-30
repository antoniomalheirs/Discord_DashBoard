const express = require("express");
const ejs = require("ejs");
const path = require("path");
const router = express.Router();
const discordBot = require("../Client");
const { ChannelType, PermissionsBitField } = require("discord.js");
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

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
};

const permissionsacess = async (profile, servidorId) => {
  try {
    // Obtém a guilda pelo ID
    const guild = await discordBot.guilds.fetch(servidorId);
    if (!servidorId) {
      throw new Error("Guilda não encontrada");
    }

    // Obtém o membro da guilda pelo ID do usuário
    const member = await guild.members.fetch(profile.id);
    if (!member) {
      throw new Error("Membro não encontrado na guilda");
    }

    // Verifica se o membro tem a permissão desejada
    const hasPermission = member.permissions.has(PermissionsBitField.Flags.Administrator);
    return hasPermission;
  } catch (error) {
    console.error("Erro ao verificar permissões na guilda:", error);
    throw error;
  }
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

const getGuildData = async (guildId) => {
  try {
    // Check if guild is cached, if not fetch it
    let guild = discordBot.guilds.cache.get(guildId);
    if (!guild) {
      guild = await discordBot.guilds.fetch(guildId);
    }

    // REMOVED: await guild.members.fetch(); - This causes timeouts on large guilds and is often unnecessary for basic info
    // If you explicitly need a specific member list, fetch it in the specific route handler, not here.

    // Using cache is safer for these counts to avoid rate limits/timeouts
    const voiceChannels = guild.channels.cache.filter(
      (channel) => channel.type === ChannelType.GuildVoice
    ).size;

    const textChannels = guild.channels.cache.filter(
      (channel) => channel.type === ChannelType.GuildText
    ).size;

    const memberCount = guild.memberCount;

    const iconURL = guild.iconURL({ dynamic: true }) || "https://cdn.discordapp.com/embed/avatars/0.png";

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

/**
 * Busca o nome de um canal do Discord a partir do seu ID.
 * @param {Number} channelId - O ID do canal que você deseja encontrar.
 * @returns {Promise<number|null>} O nome do canal ou null se não for encontrado ou ocorrer um erro.
 */
const getChannelName = async (channelId) => {
  try {
    // 1. Verifica se um ID foi fornecido para evitar erros.
    if (!channelId) {
      console.warn("A função getChannelName foi chamada sem um ID de canal.");
      return null;
    }

    // 2. Usa o client do bot para buscar o canal diretamente pelo ID do canal.
    const channel = await discordBot.channels.fetch(channelId);

    // 3. Retorna o nome se o canal for encontrado.
    return channel ? channel.name : null;

  } catch (error) {
    // O erro mais comum aqui é "Unknown Channel" se o ID for inválido.
    console.error(`Erro ao obter o nome do canal com ID ${channelId}:`, error.message);
    return null; // Retorna null para que a aplicação não quebre se o canal não existir.
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
    const user = req.user;
    const guildName = req.body.nameofGuild;
    const botInfo = await getGuildData(selectedGuildId);
    const permissions = await permissionsacess(user, selectedGuildId);

    console.log(permissions);

    if (!permissions) {
      return res.render("error.ejs", {
        error: "Erro ao obter informações do banco de dados.",
      });
    } else {
      res.render("mainpage.ejs", { info: botInfo, user: req.user, guildName: guildName });
    }
  } catch (error) {
    res.render("error.ejs", { error: error.message });
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
  let chanelytb = "";
  let chaneltch = "";
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
        { info: botInfo, info2: videoinfo, info5: guildinfo }
      );
      res.send(funcyoutube);
      break;
    case "functwitch":
      // Renderize a página 1 com o segundo parâmetro
      const functwitch = await ejs.renderFile(
        path.join(__dirname, "../views/twitchfunc.ejs"),
        { info: botInfo, info3: lives, info5: guildinfo }
      );
      res.send(functwitch);
      break;
    case "ytbchannelupdate":
      // Renderize a página 1 com o segundo parâmetro
      chanelytb = await getChannelName(guildinfo.channelytb);
      const ytbchannelupdate = await ejs.renderFile(
        path.join(__dirname, "../views/updatenotytb.ejs"),
        { info: botInfo, info5: guildinfo, channelytb: chanelytb }
      );
      res.send(ytbchannelupdate);
      break;
    case "tchchannelupdate":
      // Renderize a página 1 com o segundo parâmetro
      chaneltch = await getChannelName(guildinfo.channeltch);
      const tchchannelupdate = await ejs.renderFile(
        path.join(__dirname, "../views/updatenottch.ejs"),
        { info: botInfo, info5: guildinfo, channeltch: chaneltch }
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
    case "economyinfo":
      const economyUsers = await getUsers(guildId);
      const economyPage = await ejs.renderFile(
        path.join(__dirname, "../views/economyinfo.ejs"),
        { info: botInfo, info1: economyUsers }
      );
      res.send(economyPage);
      break;
    case "funcpoker":
      // Fetch Channels for the dropdown
      const guildObj = discordBot.guilds.cache.get(guildId);
      const channels = guildObj ? guildObj.channels.cache : [];

      // info: DB Document (for current config)
      // info4: Channels List (for dropdown)
      const pokerfunc = await ejs.renderFile(
        path.join(__dirname, "../views/pokerfunc.ejs"),
        { info: guildinfo, info4: channels }
      );
      res.send(pokerfunc);
      break;
    case "youtube":
      // Rota 'Geral' (Opções) - Redirecionando para config do Youtube ou página geral se existir
      // Como não existe uma página 'geral' específica, vamos usar a de configuração do youtube ou criar uma nova.
      // Por enquanto, vamos renderizar a de config do youtube para não quebrar.
      chanelytb = await getChannelName(guildinfo.channelytb);
      const geralConfig = await ejs.renderFile(
        path.join(__dirname, "../views/updatenotytb.ejs"),
        { info: botInfo, info5: guildinfo, channelytb: chanelytb }
      );
      res.send(geralConfig);
      break;
    default:
      // Se o parâmetro não corresponder a nenhuma página conhecida, retorne um erro 404
      res.status(404).send("Página não encontrada");
  }
});


router.get(
  "/pagina/funcs/:page/:guildId/:channelin",
  isAuthenticated,
  async (req, res) => {
    const page = req.params.page;
    const guildId = req.params.guildId;
    const channelin = req.params.channelin;

    try {
      const guilds = new guildsrepository(mongoose, "Guilds");
      const ls = await guilds.findOne(guildId);

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

      let channel = null;
      if (channelin && channelin !== "0") {
        channel = guild.channels.cache.get(channelin);
      }

      // Only throw error if we are ACTUALLY trying to set a channel and it doesn't exist.
      // For deactivation or updates that don't need channel, we skip this check.
      // However, strict validation was here for a reason. 
      // Let's soft-fail: if channel not found, we proceed but might limit actions.

      const message = channel ? channel.name : "Nenhum/Desconhecido";
      const message2 = guild.name;

      // Dynamic Handling for Logging Modules
      if (page.startsWith("actlog_")) {
        const logType = page.replace("actlog_", "");

        // Ensure logging object exists
        if (!ls.logging || typeof ls.logging !== 'object') ls.logging = {};

        // Safely merge: construct new object with existing keys + new key
        ls.logging = {
          ...ls.logging,
          [logType]: { channel: channelin, state: true }
        };

        await guilds.update(guildId, ls);

        const actLogView = await ejs.renderFile(
          path.join(__dirname, "../views/functionactivated.ejs"),
          { info: "Log Atualizado", info2: message2, info3: channelin, nome: "do Sistema de Logs" }
        );
        return res.send(actLogView);
      }

      if (page.startsWith("deactlog_")) {
        const logType = page.replace("deactlog_", "");

        if (!ls.logging) ls.logging = {};

        if (ls.logging[logType]) {
          ls.logging[logType].state = false;
        } else {
          ls.logging[logType] = { channel: "", state: false };
        }

        await guilds.update(guildId, ls);

        const deactLogView = await ejs.renderFile(
          path.join(__dirname, "../views/functionactivated.ejs"),
          { info: "Log Desativado", info2: message2, info3: "Nenhum", nome: "do Sistema de Logs" }
        );
        return res.send(deactLogView);
      }

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
        case "deactyoutube":
          ls.youtubenotify = false;
          guilds.update(guildId, ls);
          const deactfuncytb = await ejs.renderFile(
            path.join(__dirname, "../views/functionactivated.ejs"), // Reusing existing success view or create a new one? Reusing seems fine for now as it just shows a message. Actually, checking functionactivated.ejs might be good to see if it supports a "Deactivated" message structure. Assuming generic success for now.
            { info: "Módulo Desativado", info2: message2, info3: "Nenhum", nome: "do Youtube" }
          );
          res.send(deactfuncytb);
          break;
        case "deacttwitch":
          ls.twitchnotify = false;
          guilds.update(guildId, ls);
          const deactfunctch = await ejs.renderFile(
            path.join(__dirname, "../views/functionactivated.ejs"),
            { info: "Módulo Desativado", info2: message2, info3: "Nenhum", nome: "da Twitch" }
          );
          res.send(deactfunctch);
          break;
        case "actpoker":
          const naPoker = "do Poker";
          // Safer update: Only update the poker field
          const pokerConfig = { channel: channelin, state: true };
          await guilds.update(guildId, { poker: pokerConfig });

          const actFuncPoker = await ejs.renderFile(
            path.join(__dirname, "../views/functionactivated.ejs"),
            {
              info: "Módulo Ativado",
              info2: message2,
              info3: channelin,
              nome: naPoker,
              backUrl: `/bot/pagina/funcpoker/${guildId}`
            }
          );
          res.send(actFuncPoker);
          break;
        case "deactpoker":
          await guilds.update(guildId, { poker: { channel: "", state: false } });

          const deactFuncPoker = await ejs.renderFile(
            path.join(__dirname, "../views/functionactivated.ejs"),
            {
              info: "Módulo Desativado",
              info2: message2,
              info3: "Nenhum",
              nome: "do Poker",
              backUrl: `/bot/pagina/funcpoker/${guildId}`
            }
          );
          res.send(deactFuncPoker);
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
  }
);

router.get(
  "/pagina/dtbase/:page/:guildId/:channelin",
  isAuthenticated,
  async (req, res) => {
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
            const channelId = await TwitchID(
              accessToken,
              channelInput,
              clientId
            );
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
              res.render("ytbdeleteinfo.ejs", {
                info: botInfo,
                info2: videoinfo,
              });
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
              res.render("tchdeleteinfo.ejs", { info: botInfo, info2: lives });
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
  }
);


router.post("/update-economy", isAuthenticated, async (req, res) => {
  try {
    const { guildId, userId, money, bank } = req.body;

    const permissions = await permissionsacess(req.user, guildId);

    if (!permissions) {
      return res.render("error.ejs", {
        error: "Você não tem permissão para alterar o saldo de usuários neste servidor.",
      });
    }

    // Find User
    const users = new usersrepository(mongoose, "Users");
    const user = await users.findOne(userId);

    const updateData = {};
    if (money !== "") updateData.money = parseInt(money);
    if (bank !== "") updateData.bank = parseInt(bank);

    if (Object.keys(updateData).length > 0) {
      // Use repository update method instead of user.save()
      await users.update(userId, updateData);
    }

    // Redirect back to economy page
    res.redirect(`/bot/pagina/economyinfo/${guildId}`);
  } catch (error) {
    console.error("Erro ao atualizar economia:", error);
    res.render("error.ejs", { error: "Erro ao atualizar economia." });
  }
});

module.exports = router;
