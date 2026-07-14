const discordBot = require("../Client");
const { ChannelType } = require("discord.js");

const getBotUptime = () => {
  const uptimeMilliseconds = discordBot.uptime;
  if (!uptimeMilliseconds) return "0h 0m 0s";
  const uptimeSeconds = Math.floor(uptimeMilliseconds / 1000);
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
};

const getChannelName = async (channelId) => {
  try {
    if (!channelId) {
      console.warn("A função getChannelName foi chamada sem um ID de canal.");
      return null;
    }
    const channel = await discordBot.channels.fetch(channelId);
    return channel ? channel.name : null;
  } catch (error) {
    console.error(`Erro ao obter o nome do canal com ID ${channelId}:`, error.message);
    return null;
  }
};

const getGuildData = async (guildId) => {
  try {
    let guild = discordBot.guilds.cache.get(guildId);
    if (!guild) {
      guild = await discordBot.guilds.fetch(guildId);
    }
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

module.exports = { getGuildData, getChannelName, getBotUptime };
