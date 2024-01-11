const DBWrapper = require("../DBWrapper");

const mongoose = require("mongoose");
const {
  GuildRepository,
  UserRepository,
  VideoRepository,
  UserAPIRepository,
} = require("./repositories");

module.exports = class MongoDB extends DBWrapper {
  constructor(options = {}) {
    super(options);
    this.mongoose = mongoose;
  }

  async connect() {
    const OPTIONS = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    return mongoose.connect(process.env.DATABASE_CONNECT, OPTIONS).then((m) => {
      this.guilds = new GuildRepository(m);
      this.users = new UserRepository(m);
      this.videos = new VideoRepository(m);
      this.usersAPI = new UserAPIRepository(m);
    });
  }
};
