const ejs = require("ejs");
const path = require("path");
const DiscordService = require("../services/DiscordService");
const DatabaseService = require("../services/DatabaseService");
const YTBCHANNELTOID = require("../utils/YTBCHANNELTOID.js");
const RegistradorYTBVideo = require("../utils/RegistradorYTBVideo.js");
const TwitchToken = require("../utils/TwitchToken.js");
const TwitchID = require("../utils/TwitchID.js");
const discordBot = require("../Client");
const config = require("../config/env");
const {
  isValidSnowflake,
  isValidChannelParam,
  isValidLogType,
  sanitizeEconomyValue,
  sanitizeString,
} = require("../utils/securityValidators");

class BotController {
  async getGuildIcon(req, res) {
    try {
      const guildId = req.params.guildId;
      if (!isValidSnowflake(guildId)) {
        return res.status(400).json({ error: "ID da Guilda inválido" });
      }

      const guild = req.user?.guilds?.find((g) => g.id === guildId);
      if (!guild) {
        return res.status(404).json({ error: "Guilda não encontrada" });
      }
      if (!guild.icon) {
        return res.status(404).json({ error: "O servidor não tem um ícone" });
      }

      const iconURL = `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`;
      res.send({ iconURL });
    } catch (error) {
      console.error("[SECURITY] Erro ao obter ícone da guilda:", error);
      res.status(500).json({ error: "Erro interno ao processar ícone." });
    }
  }

  async botInfo(req, res) {
    try {
      const selectedGuildId = req.guildId || req.params.guildId || req.body?.guilds || req.query?.guildId || req.session?.selectedGuildId;
      
      if (!selectedGuildId) {
        return res.redirect("/dashboard");
      }

      if (!isValidSnowflake(selectedGuildId)) {
        return res.status(400).render("error.ejs", { error: "ID da Guilda inválido." });
      }

      const botInfo = await DiscordService.getGuildData(selectedGuildId);
      const guildinfo = await DatabaseService.getGuilds(selectedGuildId);
      const guildName = req.body?.nameofGuild || req.session?.guildName || botInfo.name;

      if (req.session) {
        req.session.selectedGuildId = selectedGuildId;
        req.session.guildName = guildName;
      }

      // Permissões já foram validadas pelo middleware hasGuildPermission
      res.render("mainpage.ejs", { info: botInfo, user: req.user, guildName: guildName, guildinfo: guildinfo });
    } catch (error) {
      console.error("[SECURITY] Erro em botInfo:", error);
      res.status(500).render("error.ejs", { error: "Não foi possível carregar as informações do servidor." });
    }
  }

  async renderPage(req, res) {
    const page = String(req.params.page || "").replace(/[^a-zA-Z0-9_]/g, "");
    const guildId = req.guildId || req.params.param2;

    if (!isValidSnowflake(guildId)) {
      return res.status(400).render("error.ejs", { error: "ID da Guilda inválido." });
    }

    // Se o usuário acessar a URL de sub-página diretamente na barra de endereços (navegação completa de documento),
    // redireciona para a casca completa do dashboard com a sidebar e o hash correto
    const isDirectBrowserNav = req.headers["sec-fetch-dest"] === "document" && !req.xhr && !req.headers["x-requested-with"];
    if (isDirectBrowserNav) {
      return res.redirect(`/bot/botinfo/${guildId}#${page || "server"}`);
    }
    
    try {
      const botInfo = await DiscordService.getGuildData(guildId);
      const videoinfo = await DatabaseService.getVideos(guildId);
      const lives = await DatabaseService.getTwitch(guildId);
      const guildinfo = (await DatabaseService.getGuilds(guildId)) || {
        guildID: guildId, logging: {}, youtubenotify: false, twitchnotify: false,
        channelytb: "", channeltch: "", poker: { channel: "", state: false }
      };
      const userinfo = await DatabaseService.getUsers(guildId);
      const channels = await DiscordService.getGuildChannels(guildId);
      
      let chanelytb = "";
      let chaneltch = "";

      if (page.startsWith("actlog_") || page.startsWith("deactlog_")) {
        return res.send(await ejs.renderFile(path.join(__dirname, "../views/serverfuncstate.ejs"), { info: botInfo, info4: guildinfo, channels }));
      }

      switch (page) {
        case "server":
          return res.send(await ejs.renderFile(path.join(__dirname, "../views/serverinfo.ejs"), { info: botInfo, guildinfo, videoinfo, lives, userinfo, channels }));
        case "status":
          return res.send(await ejs.renderFile(path.join(__dirname, "../views/botstatus.ejs"), { info: botInfo }));
        case "statesinfo":
          return res.send(await ejs.renderFile(path.join(__dirname, "../views/serverfuncstate.ejs"), { info: botInfo, info4: guildinfo, channels }));
        case "funcyoutube":
        case "actyoutube":
        case "deactyoutube":
        case "ytbchannelupdate":
        case "updtyoutube":
        case "youtube":
        case "viewytbchannels":
        case "deleteytbchannels":
        case "delytb":
        case "delyoutubech":
        case "addytbchannel":
        case "addytb":
          return res.send(await ejs.renderFile(path.join(__dirname, "../views/youtubefunc.ejs"), { info: botInfo, info2: videoinfo, info5: guildinfo, channels }));
        case "functwitch":
        case "acttwitch":
        case "deacttwitch":
        case "tchchannelupdate":
        case "updttwitch":
        case "viewtchchannel":
        case "deletetchchannel":
        case "deltch":
        case "deltwitchch":
        case "addtchchannel":
        case "addtch":
        case "addtwitchch":
          return res.send(await ejs.renderFile(path.join(__dirname, "../views/twitchfunc.ejs"), { info: botInfo, info3: lives, info5: guildinfo, channels }));
        case "memberinfo":
        case "membersinfo":
          return res.send(await ejs.renderFile(path.join(__dirname, "../views/membersinfo.ejs"), { info: botInfo, info1: userinfo }));
        case "economyinfo":
          return res.send(await ejs.renderFile(path.join(__dirname, "../views/economyinfo.ejs"), { info: botInfo, info1: userinfo }));
        case "funcpoker":
        case "actpoker":
        case "deactpoker":
          const guildObj = discordBot.guilds.cache.get(guildId);
          const pokerChannels = channels.length > 0 ? channels : (guildObj ? Array.from(guildObj.channels.cache.values()) : []);
          return res.send(await ejs.renderFile(path.join(__dirname, "../views/pokerfunc.ejs"), { info: botInfo, info4: pokerChannels, info5: guildinfo, botInfo: botInfo, guildinfo: guildinfo, channels: pokerChannels }));
        default:
          return res.status(404).send("Página não encontrada");
      }
    } catch (error) {
      console.error("Erro no renderPage:", error);
      res.status(404).send("Página não encontrada ou erro.");
    }
  }

  async editFuncs(req, res) {
    const isJson = Boolean(
      req.xhr ||
      req.query?.format === "json" ||
      req.headers["accept"]?.includes("application/json") ||
      req.headers["x-requested-with"] === "XMLHttpRequest"
    );
    const page = String(req.params.page || "").replace(/[^a-zA-Z0-9_]/g, "");
    const guildId = req.guildId || req.params.guildId || req.body?.guildId;
    const channelin = req.params.channelin || req.body?.channelin || req.query?.channelin || "0";

    if (!isValidSnowflake(guildId) || !isValidChannelParam(channelin)) {
      if (isJson) return res.status(400).json({ success: false, message: "Parâmetros inválidos para alteração de módulo." });
      return res.status(400).render("error.ejs", { error: "Parâmetros inválidos para alteração de módulo." });
    }

    try {
      let ls = await DatabaseService.getGuilds(guildId);
      if (!ls) {
        ls = {
          guildID: guildId, logging: {}, youtubenotify: false, twitchnotify: false,
          channelytb: "", channeltch: "", poker: { channel: "", state: false }
        };
      }

      const guild = discordBot.guilds.cache.get(guildId) || await discordBot.guilds.fetch(guildId);
      if (!guild) throw new Error("Guilda não encontrada.");

      let channel = null;
      if (channelin && channelin !== "0") {
        channel = guild.channels.cache.get(channelin) || await guild.channels.fetch(channelin).catch(() => null);
      }

      const message = channel ? channel.name : "Nenhum/Desconhecido";
      const message2 = guild.name;

      if (page.startsWith("actlog_")) {
        const logType = page.replace("actlog_", "");
        if (!isValidLogType(logType)) {
          if (isJson) return res.status(400).json({ success: false, message: "Tipo de log inválido ou não suportado." });
          return res.status(400).render("error.ejs", { error: "Tipo de log inválido ou não suportado." });
        }

        // Validação estrita: para ativar é obrigatório fornecer um canal de texto Discord válido
        if (!channelin || channelin === "0" || !isValidSnowflake(channelin)) {
          if (isJson) return res.status(400).json({ success: false, message: "Para ativar este log, é obrigatório selecionar um canal de texto do Discord." });
          return res.status(400).render("error.ejs", { error: "Para ativar este log, é obrigatório selecionar um canal de texto do Discord." });
        }

        if (!channel) {
          if (isJson) return res.status(404).json({ success: false, message: "O canal selecionado não foi encontrado no servidor." });
          return res.status(404).render("error.ejs", { error: "O canal selecionado não foi encontrado no servidor." });
        }

        if (!ls.logging || typeof ls.logging !== 'object') ls.logging = {};
        ls.logging = { ...ls.logging, [logType]: { channel: channelin, state: true } };
        await DatabaseService.saveGuildData(guildId, ls);
        if (isJson) {
          return res.json({ success: true, message: `Log "${logType}" ativado com sucesso no canal #${message}!`, logType, channel: channelin, state: true });
        }
        const actLogView = await ejs.renderFile(path.join(__dirname, "../views/functionactivated.ejs"), { info: "Log Atualizado", info2: message2, info3: channelin, nome: "do Sistema de Logs" });
        return res.send(actLogView);
      }

      if (page.startsWith("deactlog_")) {
        const logType = page.replace("deactlog_", "");
        if (!isValidLogType(logType)) {
          if (isJson) return res.status(400).json({ success: false, message: "Tipo de log inválido ou não suportado." });
          return res.status(400).render("error.ejs", { error: "Tipo de log inválido ou não suportado." });
        }
        if (!ls.logging || typeof ls.logging !== 'object') ls.logging = {};
        // Desativação sem exigência de dados: desliga o evento e limpa o canal
        ls.logging[logType] = { channel: "", state: false };
        await DatabaseService.saveGuildData(guildId, ls);
        if (isJson) {
          return res.json({ success: true, message: `Log "${logType}" desativado com sucesso!`, logType, channel: "", state: false });
        }
        const deactLogView = await ejs.renderFile(path.join(__dirname, "../views/functionactivated.ejs"), { info: "Log Desativado", info2: message2, info3: "Nenhum", nome: "do Sistema de Logs" });
        return res.send(deactLogView);
      }

      switch (page) {
        case "actyoutube":
          if (!channelin || channelin === "0" || !isValidSnowflake(channelin)) {
            if (isJson) return res.status(400).json({ success: false, message: "Para ativar os alertas do YouTube, é obrigatório selecionar um canal de texto do Discord." });
            return res.status(400).render("error.ejs", { error: "Para ativar os alertas do YouTube, é obrigatório selecionar um canal de texto do Discord." });
          }
          ls.youtubenotify = true;
          ls.channelytb = channelin;
          await DatabaseService.saveGuildData(guildId, ls);
          if (isJson) return res.json({ success: true, message: `Notificações do YouTube ativadas no canal #${message}!`, channel: channelin, state: true });
          return res.send(await ejs.renderFile(path.join(__dirname, "../views/functionactivated.ejs"), { info: message, info2: message2, info3: channelin, nome: "do Youtube" }));
        case "acttwitch":
          if (!channelin || channelin === "0" || !isValidSnowflake(channelin)) {
            if (isJson) return res.status(400).json({ success: false, message: "Para ativar os alertas da Twitch, é obrigatório selecionar um canal de texto do Discord." });
            return res.status(400).render("error.ejs", { error: "Para ativar os alertas da Twitch, é obrigatório selecionar um canal de texto do Discord." });
          }
          ls.twitchnotify = true;
          ls.channeltch = channelin;
          await DatabaseService.saveGuildData(guildId, ls);
          if (isJson) return res.json({ success: true, message: `Notificações da Twitch ativadas no canal #${message}!`, channel: channelin, state: true });
          return res.send(await ejs.renderFile(path.join(__dirname, "../views/functionactivated.ejs"), { info: message, info2: message2, info3: channelin, nome: "da Twitch" }));
        case "updtyoutube":
          if (!channelin || channelin === "0" || !isValidSnowflake(channelin)) {
            if (isJson) return res.status(400).json({ success: false, message: "É obrigatório selecionar um canal de texto válido do Discord." });
            return res.status(400).render("error.ejs", { error: "É obrigatório selecionar um canal de texto válido do Discord." });
          }
          ls.channelytb = channelin;
          await DatabaseService.saveGuildData(guildId, ls);
          if (isJson) return res.json({ success: true, message: `Canal de notificações do YouTube alterado para #${message}!`, channel: channelin });
          return res.send(await ejs.renderFile(path.join(__dirname, "../views/functionactivated.ejs"), { info: message, info2: message2, info3: channelin, nome: "do Youtube" }));
        case "updttwitch":
          if (!channelin || channelin === "0" || !isValidSnowflake(channelin)) {
            if (isJson) return res.status(400).json({ success: false, message: "É obrigatório selecionar um canal de texto válido do Discord." });
            return res.status(400).render("error.ejs", { error: "É obrigatório selecionar um canal de texto válido do Discord." });
          }
          ls.channeltch = channelin;
          await DatabaseService.saveGuildData(guildId, ls);
          if (isJson) return res.json({ success: true, message: `Canal de notificações da Twitch alterado para #${message}!`, channel: channelin });
          return res.send(await ejs.renderFile(path.join(__dirname, "../views/functionactivated.ejs"), { info: message, info2: message2, info3: channelin, nome: "da Twitch" }));
        case "deactyoutube":
          ls.youtubenotify = false;
          await DatabaseService.saveGuildData(guildId, ls);
          if (isJson) return res.json({ success: true, message: "Notificações do YouTube desativadas!", state: false });
          return res.send(await ejs.renderFile(path.join(__dirname, "../views/functionactivated.ejs"), { info: "Módulo Desativado", info2: message2, info3: "Nenhum", nome: "do Youtube" }));
        case "deacttwitch":
          ls.twitchnotify = false;
          await DatabaseService.saveGuildData(guildId, ls);
          if (isJson) return res.json({ success: true, message: "Notificações da Twitch desativadas!", state: false });
          return res.send(await ejs.renderFile(path.join(__dirname, "../views/functionactivated.ejs"), { info: "Módulo Desativado", info2: message2, info3: "Nenhum", nome: "da Twitch" }));
        case "actpoker":
          if (!channelin || channelin === "0" || !isValidSnowflake(channelin)) {
            if (isJson) return res.status(400).json({ success: false, message: "Para ativar o Texas Hold'em, é obrigatório selecionar um canal de texto do Discord." });
            return res.status(400).render("error.ejs", { error: "Para ativar o Texas Hold'em, é obrigatório selecionar um canal de texto do Discord." });
          }
          await DatabaseService.saveGuildData(guildId, { poker: { channel: channelin, state: true } });
          if (isJson) return res.json({ success: true, message: `Mesa de Poker ativada no canal #${message}!`, channel: channelin, state: true });
          return res.send(await ejs.renderFile(path.join(__dirname, "../views/functionactivated.ejs"), { info: "Módulo Ativado", info2: message2, info3: channelin, nome: "do Poker", backUrl: `/bot/pagina/funcpoker/${guildId}` }));
        case "deactpoker":
          await DatabaseService.saveGuildData(guildId, { poker: { channel: "", state: false } });
          if (isJson) return res.json({ success: true, message: "Mesa de Poker desativada!", channel: "", state: false });
          return res.send(await ejs.renderFile(path.join(__dirname, "../views/functionactivated.ejs"), { info: "Módulo Desativado", info2: message2, info3: "Nenhum", nome: "do Poker", backUrl: `/bot/pagina/funcpoker/${guildId}` }));
        default:
          if (isJson) return res.status(400).json({ success: false, message: "Ação de módulo não reconhecida." });
          return res.status(400).render("error.ejs", { error: "Ação de módulo não reconhecida." });
      }
    } catch (error) {
      console.error("[SECURITY] Erro ao editar função:", error);
      if (isJson) return res.status(500).json({ success: false, message: error.message || "Erro interno ao processar alteração." });
      res.status(500).send(await ejs.renderFile(path.join(__dirname, "../views/activefuncerror.ejs")));
    }
  }

  async dbActions(req, res) {
    const isJson = Boolean(
      req.xhr ||
      req.query?.format === "json" ||
      req.headers["accept"]?.includes("application/json") ||
      req.headers["x-requested-with"] === "XMLHttpRequest"
    );
    const page = String(req.params.page || "").replace(/[^a-zA-Z0-9_]/g, "");
    const guildId = req.guildId || req.params.guildId || req.body?.guildId;
    const rawInput = req.params.channelin || req.body?.channelin || req.query?.channelin || "";
    const channelInput = sanitizeString(rawInput, 100);

    if (!isValidSnowflake(guildId) || !channelInput) {
      if (isJson) return res.status(400).json({ success: false, message: "Parâmetros inválidos para ação no banco de dados." });
      return res.status(400).render("error.ejs", { error: "Parâmetros inválidos para ação no banco de dados." });
    }

    try {
      const botInfo = await DiscordService.getGuildData(guildId);

      if (page === "addyoutubech") {
        const videoRepository = new DatabaseService.videosRepository(require("mongoose"), "Videos");
        
        // 1. Resolução pelo ID ou Nome via YouTube API com tratamento resiliente
        let result = null;
        try {
          result = await YTBCHANNELTOID(channelInput);
        } catch (ytbErr) {
          if (isJson) return res.status(404).json({ success: false, message: ytbErr.message || `Canal "${channelInput}" não foi encontrado no YouTube.` });
          return res.status(404).render("error.ejs", { error: ytbErr.message || `Canal "${channelInput}" não foi encontrado no YouTube.` });
        }
        if (!result || !result.youtube) {
          if (isJson) return res.status(404).json({ success: false, message: `Canal "${channelInput}" não foi encontrado no YouTube.` });
          return res.status(404).render("error.ejs", { error: `Canal "${channelInput}" não foi encontrado no YouTube.` });
        }

        // 2. Verificação canônica de duplicata pelo ID único do YouTube no servidor
        const noBanco = await videoRepository.verifyByYoutubeAndGuildId(result.youtube, guildId, { youtube: 1, channel: 1 });
        if (noBanco != null) {
          if (isJson) return res.status(400).json({ success: false, message: `O canal "${result.channel || channelInput}" já está cadastrado neste servidor.` });
          return res.render("dataadderror.ejs", {});
        }

        const guild = discordBot.guilds.cache.get(guildId);
        result.notifyGuild = guildId;
        await RegistradorYTBVideo(result);
        if (isJson) return res.json({ success: true, message: `Canal "${result.channel || channelInput}" adicionado com sucesso!`, data: result });
        return res.render("datafuncadd.ejs", { info: result.channel, info1: guild ? guild.name : "Servidor", info2: result.youtube, nome: channelInput });
      }

      if (page === "addtwitchch") {
        const twitchRepository = new DatabaseService.twitchsRepository(require("mongoose"), "Twitchs");
        const clientId = config.twitchClientId;
        const clientSecret = config.twitchClientSecret;

        if (!clientId || !clientSecret) {
          if (isJson) return res.status(400).json({ success: false, message: "Credenciais da API da Twitch não configuradas no servidor." });
          return res.status(400).render("error.ejs", { error: "Credenciais da API da Twitch não configuradas no servidor." });
        }

        const accessToken = await TwitchToken(clientId, clientSecret);
        const cleanLogin = channelInput.toLowerCase().replace(/[^a-z0-9_]/g, "");
        if (!cleanLogin) {
          if (isJson) return res.status(400).json({ success: false, message: "Nome de usuário da Twitch inválido." });
          return res.status(400).render("error.ejs", { error: "Nome de usuário da Twitch inválido." });
        }
        const channelId = await TwitchID(accessToken, cleanLogin, clientId);
        
        if (!channelId) {
          if (isJson) return res.status(404).json({ success: false, message: `Streamer "${channelInput}" não foi encontrado na Twitch.` });
          return res.status(404).render("error.ejs", { error: `Streamer "${channelInput}" não foi encontrado na Twitch.` });
        }

        const guild = discordBot.guilds.cache.get(guildId);
        const projection = { twitch: channelId, channel: cleanLogin, guildID: guildId };
        const noBanco = await twitchRepository.findByTwitchAndGuildId(channelId, guildId, projection);
        
        if (noBanco != null) {
          if (isJson) return res.status(400).json({ success: false, message: `O streamer "${channelInput}" já está cadastrado neste servidor.` });
          return res.render("dataadderror.ejs", {});
        }
        
        await twitchRepository.add(projection);
        if (isJson) return res.json({ success: true, message: `Streamer "${channelInput}" adicionado com sucesso!`, data: projection });
        return res.render("datafuncadd.ejs", { info: channelInput, info1: guild ? guild.name : "Servidor", info2: channelId, nome: channelInput });
      }

      if (page === "delyoutubech") {
        const videoRepo = new DatabaseService.videosRepository(require("mongoose"), "Videos");
        const noBanco = await videoRepo.verifyByYoutubeAndGuildId(channelInput, guildId, { youtube: 1, channel: 1, notifyGuild: 1 });
        if (noBanco != null) {
          await videoRepo.deletar(channelInput, guildId);
          if (isJson) return res.json({ success: true, message: "Canal do YouTube removido com sucesso." });
          return res.redirect(`/bot/botinfo/${guildId}#funcyoutube`);
        }
        if (isJson) return res.status(404).json({ success: false, message: "Canal não encontrado no banco de dados." });
        return res.render("dataadderror.ejs", {});
      }

      if (page === "deltwitchch") {
        const twitchRepo = new DatabaseService.twitchsRepository(require("mongoose"), "Twitchs");
        const noBanco = await twitchRepo.verifyByTwitchAndGuildId(channelInput, guildId, { twitch: 1, channel: 1, guildID: 1 });
        if (noBanco != null) {
          await twitchRepo.deletar(channelInput, guildId);
          if (isJson) return res.json({ success: true, message: "Streamer da Twitch removido com sucesso." });
          return res.redirect(`/bot/botinfo/${guildId}#functwitch`);
        }
        if (isJson) return res.status(404).json({ success: false, message: "Streamer não encontrado no banco de dados." });
        return res.render("dataadderror.ejs", {});
      }

      if (isJson) return res.status(400).json({ success: false, message: "Ação de dados inválida ou não reconhecida." });
      return res.status(400).render("error.ejs", { error: "Ação de dados inválida ou não reconhecida." });
    } catch (error) {
      console.error("[SECURITY] Erro em dbActions:", error);
      if (isJson) return res.status(500).json({ success: false, message: error.message || "Erro interno ao processar ação no banco." });
      res.render("dataadderror.ejs", {});
    }
  }

  async updateEconomy(req, res) {
    const isJson = Boolean(
      req.xhr ||
      req.query?.format === "json" ||
      req.headers["accept"]?.includes("application/json") ||
      req.headers["x-requested-with"] === "XMLHttpRequest"
    );
    try {
      const targetGuildId = req.guildId || req.body?.guildId;
      const { userId, money, bank } = req.body || {};

      if (!isValidSnowflake(targetGuildId) || !isValidSnowflake(userId)) {
        if (isJson) return res.status(400).json({ success: false, message: "Identificadores inválidos fornecidos." });
        return res.status(400).render("error.ejs", { error: "Identificadores inválidos fornecidos." });
      }

      const users = new DatabaseService.usersRepository(require("mongoose"), "Users");
      
      const updateData = {};
      if (money !== undefined && money !== null && money !== "") {
        const sanitizedMoney = sanitizeEconomyValue(money);
        if (sanitizedMoney === null) {
          if (isJson) return res.status(400).json({ success: false, message: "Valor de dinheiro inválido (deve ser um número inteiro entre 0 e 1.000.000.000)." });
          return res.status(400).render("error.ejs", { error: "Valor de dinheiro inválido (deve ser um número inteiro entre 0 e 1.000.000.000)." });
        }
        updateData.money = sanitizedMoney;
      }
      if (bank !== undefined && bank !== null && bank !== "") {
        const sanitizedBank = sanitizeEconomyValue(bank);
        if (sanitizedBank === null) {
          if (isJson) return res.status(400).json({ success: false, message: "Valor de banco inválido (deve ser um número inteiro entre 0 e 1.000.000.000)." });
          return res.status(400).render("error.ejs", { error: "Valor de banco inválido (deve ser um número inteiro entre 0 e 1.000.000.000)." });
        }
        updateData.bank = sanitizedBank;
      }

      if (Object.keys(updateData).length === 0) {
        if (isJson) return res.status(400).json({ success: false, message: "Nenhum valor válido informado para atualização." });
        return res.status(400).render("error.ejs", { error: "Nenhum valor válido informado para atualização." });
      }

      // IDOR FIX: Atualização restrita estritamente ao userId E targetGuildId validado
      await users.updateByUserIdAndGuildId(userId, targetGuildId, updateData);

      if (isJson) {
        return res.json({ success: true, message: "Economia atualizada com sucesso." });
      }

      res.redirect(`/bot/botinfo/${targetGuildId}#economyinfo`);
    } catch (error) {
      console.error("[SECURITY] Erro ao atualizar economia:", error);
      if (isJson) return res.status(500).json({ success: false, message: "Erro interno ao processar atualização de economia." });
      res.status(500).render("error.ejs", { error: "Erro interno ao processar atualização de economia." });
    }
  }
}

module.exports = new BotController();
