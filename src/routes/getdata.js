const express = require("express");
const router = express.Router();
const discordBot = require("../Client");

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
};

router.post("/selecionar-guilda", isAuthenticated, (req, res) => {
  const selectedGuildId = req.body.guilds;
  res.redirect(`/openbot?guildId=${selectedGuildId}`);
});

// Função para obter informações da guilda
router.get("/openbot", isAuthenticated, async (req, res) => {
  const guildId = req.query.guildId;

  // Verifique se guildId está presente
  if (!guildId) {
    return res.status(400).send("Guild ID não fornecido");
  }

  // Obtenha informações da guilda
  const info = await getGuildInfo(guildId);

  if (info) {
    res.render("guildcontentmain.ejs", { info });
  } else {
    res.status(500).send("Erro ao obter informações da guilda");
  }
});

// Rota para obter dados gerais do bot
// Rota para obter dados gerais do bot
router.get("/botinfo/:guildId", isAuthenticated, async (req, res) => {
  try {
    const guildId = req.params.guildId;

    // Aguarde a inicialização do cliente Discord.js
    await discordBot.client.guilds.fetch(guildId);

    // Obtenha a guilda
    const guild = await discordBot.guilds.cache.get(guildId);

    // Obtenha membros, canais de voz e canais de texto
    await guild.members.fetch();
    await guild.channels.fetch();

    // Realize fetch dos canais de voz e texto
    const voiceChannels = guild.channels.cache.filter(
      (channel) => channel.type === "GUILD_VOICE"
    ).size;
    const textChannels = guild.channels.cache.size;

    const memberCount = guild.memberCount;

    // Adicione informações adicionais do bot
    const botInfo = {
      name: guild.name,
      id: guild.id,
      description: guild.description || "Sem descrição disponível",
      memberCount: memberCount,
      voiceChannels: voiceChannels,
      textChannels: textChannels,
      guildCount: discordBot.guilds.cache.size,
      botStatus: discordBot.presence.status,
      uptime: getBotUptime(),
    };

    // Função para obter o tempo de atividade do bot
    function getBotUptime() {
      const uptimeMilliseconds = discordBot.uptime;
      const uptimeSeconds = Math.floor(uptimeMilliseconds / 1000);
      const hours = Math.floor(uptimeSeconds / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      const seconds = uptimeSeconds % 60;
      return `${hours}h ${minutes}m ${seconds}s`;
    }

    res.render("guildcontentmain.ejs", { guildInfo: botInfo });
  } catch (error) {
    console.error("Erro ao obter dados da guilda:", error);
    res.status(500).send("Erro ao obter informações da guilda");
  }
});

module.exports = router;
