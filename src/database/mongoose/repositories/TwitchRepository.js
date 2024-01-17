const TwitchsRepository = require("../TwitchsRepository.js");
const TwitchSchema = require("../../schemas/TwitchSchema.js");

module.exports = class TwitchRepository extends TwitchsRepository {
  constructor(mongoose) {
    super(mongoose, mongoose.model("Twitchs", TwitchSchema));
  }

  parse(entity) {
    return {
      twitch: null,
      channel: null,
      guildID: null,
      ...(super.parse(entity) || {}),
    };
  }
};
