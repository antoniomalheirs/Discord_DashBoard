const { Schema } = require("mongoose");

module.exports = new Schema({
  twitch: {
    type: String,
    required: true,
  },
  channel: { type: String },
  guildID: { type: String },
  twitchnotify: { type: String },
});
