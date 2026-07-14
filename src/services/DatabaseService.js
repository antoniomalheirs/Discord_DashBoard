const mongoose = require("mongoose");
const usersrepository = require("../database/mongoose/UsersRepository");
const UserSchema = require("../database/schemas/UserSchema");
const videosrepository = require("../database/mongoose/VideosRepository");
const VideoSchema = require("../database/schemas/VideoSchema");
const guildsrepository = require("../database/mongoose/GuildsRepository");
const GuildSchema = require("../database/schemas/GuildSchema");
const twitchsrepository = require("../database/mongoose/TwitchsRepository");
const TwitchSchema = require("../database/schemas/TwitchSchema");

// Ensure models are registered (safe for multiple requires)
if (!mongoose.models["Users"]) mongoose.model("Users", UserSchema);
if (!mongoose.models["Videos"]) mongoose.model("Videos", VideoSchema);
if (!mongoose.models["Guilds"]) mongoose.model("Guilds", GuildSchema);
if (!mongoose.models["Twitchs"]) mongoose.model("Twitchs", TwitchSchema);

const getVideos = async (guildId) => {
  const videos = new videosrepository(mongoose, "Videos");
  return await videos.findAllByGuildId(guildId);
};

const getGuilds = async (guildId) => {
  const guilds = new guildsrepository(mongoose, "Guilds");
  return await guilds.findOne(guildId);
};

const getTwitch = async (guildId) => {
  const channels = new twitchsrepository(mongoose, "Twitchs");
  return await channels.findAllByGuildId(guildId);
};

const getUsers = async (guildId) => {
  const users = new usersrepository(mongoose, "Users");
  return await users.findAllByGuildId(guildId);
};

const saveGuildData = async (guildId, data) => {
  const guilds = new guildsrepository(mongoose, "Guilds");
  return await guilds.update(guildId, data);
};

module.exports = {
  getVideos,
  getGuilds,
  getTwitch,
  getUsers,
  saveGuildData,
  videosRepository: videosrepository,
  guildsRepository: guildsrepository,
  twitchsRepository: twitchsrepository,
  usersRepository: usersrepository,
};
