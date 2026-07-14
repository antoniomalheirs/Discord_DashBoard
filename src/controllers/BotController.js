const ejs = require("ejs");
const path = require("path");
const DiscordService = require("../services/DiscordService");
const DatabaseService = require("../services/DatabaseService");
const YTBCHANNELTOID = require("../utils/YTBCHANNELTOID.js");
const RegistradorYTBVideo = require("../utils/RegistradorYTBVideo.js");
const TwitchToken = require("../utils/TwitchToken.js");
const TwitchID = require("../utils/TwitchID.js");
const discordBot = require("../Client");

class BotController {
  async getGuildIcon(req, res) {
    try {
      const guildId = req.params.guildId;
      const guild = req.user.guilds.find((guild) => guild.id === guildId);

      if (!guild) {
        return res.status(404).json({ error: "Guilda não encontrada" });
      }
      if (!guild.icon) {
        return res.status(404).json({ error: "O servidor não tem um ícone" });
      }

      const iconURL = `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`;
      res.send({ iconURL });
    } catch (error) {
      console.error("Erro ao obter ícone da guilda:", error);
      res.status(500).json({ error: "Erro ao obter ícone da guilda" });
    }
  }

  async botInfo(req, res) {
    try {
      const selectedGuildId = req.body.guilds;
      const guildName = req.body.nameofGuild;
      const botInfo = await DiscordService.getGuildData(selectedGuildId);
      
      // Permissões já foram validadas pelo middleware hasGuildPermission
      res.render("mainpage.ejs", { info: botInfo, user: req.user, guildName: guildName });
    } catch (error) {
      res.render("error.ejs", { error: error.message });
    }
  }

  async renderPage(req, res) {
    const page = req.params.page;
    const guildId = req.params.param2;
    
    try {
      const botInfo = await DiscordService.getGuildData(guildId);
      const videoinfo = await DatabaseService.getVideos(guildId);
      const lives = await DatabaseService.getTwitch(guildId);
      const guildinfo = await DatabaseService.getGuilds(guildId);
      const userinfo = await DatabaseService.getUsers(guildId);
      
      let chanelytb = "";
      let chaneltch = "";

      switch (page) {
        case "server":
          return res.send(await ejs.renderFile(path.join(__dirname, "../views/serverinfo.ejs"), { info: botInfo }));
        case "status":
          return res.send(await ejs.renderFile(path.join(__dirname, "../views/botstatus.ejs"), { info: botInfo }));
        case "funcyoutube":
          return res.send(await ejs.renderFile(path.join(__dirname, "../views/youtubefunc.ejs"), { info: botInfo, info2: videoinfo, info5: guildinfo }));
        case "functwitch":
          return res.send(await ejs.renderFile(path.join(__dirname, "../views/twitchfunc.ejs"), { info: botInfo, info3: lives, info5: guildinfo }));
        case "ytbchannelupdate":
          chanelytb = await DiscordService.getChannelName(guildinfo.channelytb);
          return res.send(await ejs.renderFile(path.join(__dirname, "../views/updatenotytb.ejs"), { info: botInfo, info5: guildinfo, channelytb: chanelytb }));
        case "tchchannelupdate":
          chaneltch = await DiscordService.getChannelName(guildinfo.channeltch);
          return res.send(await ejs.renderFile(path.join(__dirname, "../views/updatenottch.ejs"), { info: botInfo, info5: guildinfo, channeltch: chaneltch }));
        case "statesinfo":
          return res.send(await ejs.renderFile(path.join(__dirname, "../views/serverfuncstate.ejs"), { info: botInfo, info4: guildinfo }));
        case "viewytbchannels":
          return res.send(await ejs.renderFile(path.join(__dirname, "../views/ytbviewinfo.ejs"), { info: botInfo, info2: videoinfo }));
        case "deleteytbchannels":
          return res.send(await ejs.renderFile(path.join(__dirname, "../views/ytbdeleteinfo.ejs"), { info: botInfo, info2: videoinfo }));
        case "addytbchannel":
          return res.send(await ejs.renderFile(path.join(__dirname, "../views/addytbchannel.ejs"), { info: botInfo }));
        case "viewtchchannel":
          return res.send(await ejs.renderFile(path.join(__dirname, "../views/tchviewinfo.ejs"), { info: botInfo, info3: lives }));
        case "deletetchchannel":
          return res.send(await ejs.renderFile(path.join(__dirname, "../views/tchdeleteinfo.ejs"), { info: botInfo, info2: lives }));
        case "addtchchannel":
          return res.send(await ejs.renderFile(path.join(__dirname, "../views/addtchchannel.ejs"), { info: botInfo }));
        case "memberinfo":
          return res.send(await ejs.renderFile(path.join(__dirname, "../views/membersinfo.ejs"), { info: botInfo, info1: userinfo }));
        case "economyinfo":
          return res.send(await ejs.renderFile(path.join(__dirname, "../views/economyinfo.ejs"), { info: botInfo, info1: userinfo }));
        case "funcpoker":
          const guildObj = discordBot.guilds.cache.get(guildId);
          const channels = guildObj ? guildObj.channels.cache : [];
          return res.send(await ejs.renderFile(path.join(__dirname, "../views/pokerfunc.ejs"), { info: guildinfo, info4: channels }));
        case "youtube":
          chanelytb = await DiscordService.getChannelName(guildinfo.channelytb);
          return res.send(await ejs.renderFile(path.join(__dirname, "../views/updatenotytb.ejs"), { info: botInfo, info5: guildinfo, channelytb: chanelytb }));
        default:
          return res.status(404).send("Página não encontrada");
      }
    } catch (error) {
      console.error("Erro no renderPage:", error);
      res.status(404).send("Página não encontrada ou erro.");
    }
  }

  async editFuncs(req, res) {
    const page = req.params.page;
    const guildId = req.params.guildId;
    const channelin = req.params.channelin;

    try {
      const ls = await DatabaseService.getGuilds(guildId);
      if (!ls) throw new Error("Guilda não gerenciável no banco de dados.");

      const guild = discordBot.guilds.cache.get(guildId) || await discordBot.guilds.fetch(guildId);
      if (!guild) throw new Error("Guilda não encontrada.");

      let channel = null;
      if (channelin && channelin !== "0") {
        channel = guild.channels.cache.get(channelin);
      }

      const message = channel ? channel.name : "Nenhum/Desconhecido";
      const message2 = guild.name;

      if (page.startsWith("actlog_")) {
        const logType = page.replace("actlog_", "");
        if (!ls.logging || typeof ls.logging !== 'object') ls.logging = {};
        ls.logging = { ...ls.logging, [logType]: { channel: channelin, state: true } };
        await DatabaseService.saveGuildData(guildId, ls);
        const actLogView = await ejs.renderFile(path.join(__dirname, "../views/functionactivated.ejs"), { info: "Log Atualizado", info2: message2, info3: channelin, nome: "do Sistema de Logs" });
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
        await DatabaseService.saveGuildData(guildId, ls);
        const deactLogView = await ejs.renderFile(path.join(__dirname, "../views/functionactivated.ejs"), { info: "Log Desativado", info2: message2, info3: "Nenhum", nome: "do Sistema de Logs" });
        return res.send(deactLogView);
      }

      switch (page) {
        case "actyoutube":
          ls.youtubenotify = true;
          ls.channelytb = channelin;
          await DatabaseService.saveGuildData(guildId, ls);
          res.send(await ejs.renderFile(path.join(__dirname, "../views/functionactivated.ejs"), { info: message, info2: message2, info3: channelin, nome: "do Youtube" }));
          break;
        case "acttwitch":
          ls.twitchnotify = true;
          ls.channeltch = channelin;
          await DatabaseService.saveGuildData(guildId, ls);
          res.send(await ejs.renderFile(path.join(__dirname, "../views/functionactivated.ejs"), { info: message, info2: message2, info3: channelin, nome: "da Twitch" }));
          break;
        case "updtyoutube":
          ls.channelytb = channelin;
          await DatabaseService.saveGuildData(guildId, ls);
          res.send(await ejs.renderFile(path.join(__dirname, "../views/functionactivated.ejs"), { info: message, info2: message2, info3: channelin, nome: "do Youtube" }));
          break;
        case "updttwitch":
          ls.channeltch = channelin;
          await DatabaseService.saveGuildData(guildId, ls);
          res.send(await ejs.renderFile(path.join(__dirname, "../views/functionactivated.ejs"), { info: message, info2: message2, info3: channelin, nome: "da Twitch" }));
          break;
        case "deactyoutube":
          ls.youtubenotify = false;
          await DatabaseService.saveGuildData(guildId, ls);
          res.send(await ejs.renderFile(path.join(__dirname, "../views/functionactivated.ejs"), { info: "Módulo Desativado", info2: message2, info3: "Nenhum", nome: "do Youtube" }));
          break;
        case "deacttwitch":
          ls.twitchnotify = false;
          await DatabaseService.saveGuildData(guildId, ls);
          res.send(await ejs.renderFile(path.join(__dirname, "../views/functionactivated.ejs"), { info: "Módulo Desativado", info2: message2, info3: "Nenhum", nome: "da Twitch" }));
          break;
        case "actpoker":
          await DatabaseService.saveGuildData(guildId, { poker: { channel: channelin, state: true } });
          res.send(await ejs.renderFile(path.join(__dirname, "../views/functionactivated.ejs"), { info: "Módulo Ativado", info2: message2, info3: channelin, nome: "do Poker", backUrl: `/bot/pagina/funcpoker/${guildId}` }));
          break;
        case "deactpoker":
          await DatabaseService.saveGuildData(guildId, { poker: { channel: "", state: false } });
          res.send(await ejs.renderFile(path.join(__dirname, "../views/functionactivated.ejs"), { info: "Módulo Desativado", info2: message2, info3: "Nenhum", nome: "do Poker", backUrl: `/bot/pagina/funcpoker/${guildId}` }));
          break;
      }
    } catch (error) {
      console.error(error);
      res.send(await ejs.renderFile(path.join(__dirname, "../views/activefuncerror.ejs")));
    }
  }

  async dbActions(req, res) {
    const page = req.params.page;
    const guildId = req.params.guildId;
    const channelInput = req.params.channelin;
    const botInfo = await DiscordService.getGuildData(guildId);
    
    try {
      if (page === "addyoutubech") {
        const videoRepository = new DatabaseService.videosRepository(require("mongoose"), "Videos");
        const noBanco = await videoRepository.findByYoutubeAndGuildId(channelInput, guildId, { youtube: 1, channel: 1, lastVideo: 1, lastPublish: 1, message: 1, notifyGuild: 1 });
        if (noBanco != null) {
          return res.render("dataadderror.ejs", {});
        } else {
          // Requer um mock function contexto ou fix do bind
          const result = await YTBCHANNELTOID(channelInput);
          if (!result) return res.status(200).json({ success: false, message: "Nada encontrado." });
          const guild = discordBot.guilds.cache.get(guildId);
          result.notifyGuild = guildId;
          await RegistradorYTBVideo(result);
          return res.render("datafuncadd.ejs", { info: result.channel, info1: guild.name, info2: result.youtube, nome: channelInput });
        }
      }

      if (page === "addtwitchch") {
        const twitchRepository = new DatabaseService.twitchsRepository(require("mongoose"), "Twitchs");
        const clientId = process.env.TWITCH_CLIENTID;
        const clientSecret = process.env.TWITCH_SECRETID;
        const accessToken = await TwitchToken(clientId, clientSecret);
        const channelId = await TwitchID(accessToken, channelInput, clientId);
        const guild = discordBot.guilds.cache.get(guildId);
        
        const projection = { twitch: channelId, channel: channelInput, guildID: guildId };
        const noBanco = await twitchRepository.findByTwitchAndGuildId(channelId, guildId, projection);
        
        if (noBanco != null) return res.render("dataadderror.ejs", {});
        if (channelId == null) return res.status(200).json({ success: false, message: "Dados do canal não encontrados." });
        
        await twitchRepository.add(projection);
        return res.render("datafuncadd.ejs", { info: channelInput, info1: guild.name, info2: channelId, nome: channelInput });
      }

      if (page === "delyoutubech") {
        const videoRepo = new DatabaseService.videosRepository(require("mongoose"), "Videos");
        const noBanco = await videoRepo.verifyByYoutubeAndGuildId(channelInput, guildId, { youtube: 1, channel: 1, notifyGuild: 1 });
        if (noBanco != null) {
          await videoRepo.deletar(channelInput, guildId);
          return res.render("ytbdeleteinfo.ejs", { info: botInfo, info2: await DatabaseService.getVideos(guildId) });
        }
        return res.render("dataadderror.ejs", {});
      }

      if (page === "deltwitchch") {
        const twitchRepo = new DatabaseService.twitchsRepository(require("mongoose"), "Twitchs");
        const noBanco = await twitchRepo.verifyByTwitchAndGuildId(channelInput, guildId, { twitch: 1, channel: 1, guildID: 1 });
        if (noBanco != null) {
          await twitchRepo.deletar(channelInput, guildId);
          return res.render("tchdeleteinfo.ejs", { info: botInfo, info2: await DatabaseService.getTwitch(guildId) });
        }
        return res.render("dataadderror.ejs", {});
      }
    } catch (error) {
      console.error(error);
      res.render("dataadderror.ejs", {});
    }
  }

  async updateEconomy(req, res) {
    try {
      const { guildId, userId, money, bank } = req.body;
      const users = new DatabaseService.usersRepository(require("mongoose"), "Users");
      
      const updateData = {};
      if (money !== "") updateData.money = parseInt(money);
      if (bank !== "") updateData.bank = parseInt(bank);
      if (Object.keys(updateData).length > 0) {
        await users.update(userId, updateData);
      }
      res.redirect(`/bot/pagina/economyinfo/${guildId}`);
    } catch (error) {
      console.error("Erro ao atualizar economia:", error);
      res.render("error.ejs", { error: "Erro ao atualizar economia." });
    }
  }
}

module.exports = new BotController();
