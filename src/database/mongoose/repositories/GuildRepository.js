const GuildsRepository = require("../GuildsRepository.js");
const GuildSchema = require("../../schemas/GuildSchema.js");

module.exports = class GuildRepository extends GuildsRepository {
  constructor(mongoose) {
    super(mongoose, mongoose.model("Guilds", GuildSchema));
  }

  parse(entity) {
    return {
      guildID: null,
      guildName: null,
      channelytb: null,
      channeltch: null,
      youtubenotify: null,
      twitchnotify: null,
      ...(super.parse(entity) || {}),
    };
  }
};
