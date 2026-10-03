const DBWrapper = require("../DBWrapper");

const mongoose = require("mongoose");
const {
  GuildRepository,
  UserRepository,
  VideoRepository,
  UserAPIRepository,
  TwitchRepository,
} = require("./repositories");

const config = require("../../config/env");

module.exports = class MongoDB extends DBWrapper {
  constructor(options = {}) {
    super(options);
    this.mongoose = mongoose;
  }

  async connect() {
    if (!config.mongoUri) {
      throw new Error("MONGODB_URI não foi definida nas variáveis de ambiente (.env)");
    }
    return mongoose.connect(config.mongoUri).then((m) => {
      this.guilds = new GuildRepository(m);
      this.users = new UserRepository(m);
      this.videos = new VideoRepository(m);
      this.APIUsers = new UserAPIRepository(m);
      this.twitchs = new TwitchRepository(m);
    });
  }
};
