const DBWrapper = require("../DBWrapper");

const mongoose = require("mongoose");
const {
  GuildRepository,
  UserRepository,
  VideoRepository,
  UserAPIRepository,
  TwitchRepository,
} = require("./repositories");

module.exports = class MongoDB extends DBWrapper {
  constructor(options = {}) {
    super(options);
    this.mongoose = mongoose;
  }

  async connect() {
    
    return mongoose.connect(process.env.DATABASE_CONNECT).then((m) => {
      this.guilds = new GuildRepository(m);
      this.users = new UserRepository(m);
      this.videos = new VideoRepository(m);
      this.APIUsers = new UserAPIRepository(m);
      this.twitchs = new TwitchRepository(m);
    });
  }
};
