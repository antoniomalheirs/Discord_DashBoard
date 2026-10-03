const discordBot = require("../Client");
const { PermissionsBitField } = require("discord.js");
const { isValidSnowflake } = require("../utils/securityValidators");

const permissionsacess = async (profile, servidorId) => {
  try {
    if (!servidorId || !isValidSnowflake(servidorId)) {
      return false;
    }

    const guild = discordBot.guilds.cache.get(servidorId) || await discordBot.guilds.fetch(servidorId).catch(() => null);
    if (!guild) {
      return false;
    }

    if (!profile || !profile.id) {
      return false;
    }

    const member = guild.members.cache.get(profile.id) || await guild.members.fetch(profile.id).catch(() => null);
    if (!member) {
      return false;
    }

    return member.permissions.has(PermissionsBitField.Flags.Administrator);
  } catch (error) {
    console.error("[SECURITY] Erro ao verificar permissões na guilda:", error);
    return false;
  }
};

const isJsonRequest = (req) => Boolean(
  req.xhr ||
  req.query?.format === "json" ||
  req.headers["accept"]?.includes("application/json") ||
  req.headers["x-requested-with"] === "XMLHttpRequest"
);

const hasGuildPermission = async (req, res, next) => {
  const isJson = isJsonRequest(req);
  try {
    // The guild ID might be in req.params.param2, req.params.guildId, req.body.guildId, req.body.guilds, req.query.guildId, or req.session.selectedGuildId
    // CRITICAL: req.body.guildId MUST have precedence over session fallback to prevent IDOR parameter desync
    const guildId = req.params.param2 || req.params.guildId || req.body?.guildId || req.body?.guilds || req.query?.guildId || req.session?.selectedGuildId;
    
    if (!guildId) {
      if (req.method === 'GET' && (req.path === '/botinfo' || req.baseUrl === '/bot')) {
        return res.redirect('/dashboard');
      }
      if (isJson) return res.status(400).json({ success: false, message: "ID da Guilda não fornecido." });
      return res.status(400).render("error.ejs", { error: "ID da Guilda não fornecido." });
    }

    if (!isValidSnowflake(guildId)) {
      if (isJson) return res.status(400).json({ success: false, message: "Formato de ID da Guilda inválido." });
      return res.status(400).render("error.ejs", { error: "Formato de ID da Guilda inválido." });
    }

    const hasAdmin = await permissionsacess(req.user, guildId);
    if (!hasAdmin) {
      if (isJson) return res.status(403).json({ success: false, message: "Acesso negado: Você não possui permissão de Administrador nesta guilda." });
      return res.status(403).render("error.ejs", {
        error: "Acesso negado: Você não possui permissão de Administrador nesta guilda ou o bot não está presente no servidor.",
      });
    }

    // Attach validated and authorized guildId directly to request object
    req.guildId = guildId;

    next();
  } catch (error) {
    console.error("[SECURITY] Exceção no middleware hasGuildPermission:", error);
    if (isJson) return res.status(500).json({ success: false, message: "Ocorreu uma falha ao validar suas permissões de acesso." });
    return res.status(500).render("error.ejs", { error: "Ocorreu uma falha ao validar suas permissões de acesso." });
  }
};

module.exports = { permissionsacess, hasGuildPermission };
