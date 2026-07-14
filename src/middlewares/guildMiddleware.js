const discordBot = require("../Client");
const { PermissionsBitField } = require("discord.js");

const permissionsacess = async (profile, servidorId) => {
  try {
    const guild = await discordBot.guilds.fetch(servidorId);
    if (!servidorId) {
      throw new Error("Guilda não encontrada");
    }

    const member = await guild.members.fetch(profile.id);
    if (!member) {
      throw new Error("Membro não encontrado na guilda");
    }

    const hasPermission = member.permissions.has(PermissionsBitField.Flags.Administrator);
    return hasPermission;
  } catch (error) {
    console.error("Erro ao verificar permissões na guilda:", error);
    throw error;
  }
};

const hasGuildPermission = async (req, res, next) => {
  try {
    // The guild ID might be in req.params.param2, req.body.guilds, or req.params.guildId
    const guildId = req.params.param2 || req.body?.guilds || req.params.guildId;
    
    if (!guildId) {
      return res.status(400).render("error.ejs", { error: "ID da Guilda não fornecido." });
    }

    const permissions = await permissionsacess(req.user, guildId);
    if (!permissions) {
      return res.status(403).render("error.ejs", {
        error: "Você não tem permissão de Administrador para acessar esta configuração.",
      });
    }

    next();
  } catch (error) {
    console.error("Erro no middleware hasGuildPermission:", error);
    return res.status(500).render("error.ejs", { error: error.message });
  }
};

module.exports = { permissionsacess, hasGuildPermission };
