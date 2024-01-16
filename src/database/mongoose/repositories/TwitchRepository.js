const TwitchsRepository = require("../TwitchsRepository.js");
const TwitchSchema = require("../../schemas/TwitchSchema.js");

module.exports = class TwitchRepository extends TwitchsRepository {
  constructor(mongoose) {
    super(mongoose, mongoose.model("twitchs", TwitchSchema));
  }

  parse(entity) {
    return {
      twitch: null,
      channel: null,
      guildID: null,
      twitchnotify: null,
      ...(super.parse(entity) || {}),
    };
  }
};
