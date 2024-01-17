const { Schema } = require("mongoose");

module.exports = new Schema({
  guildID: { type: String },
  guildName: { type: String },
  channelytb: {type: String, default: ""},
  channeltch: {type: String, default: ""},
  youtubenotify: { type: Boolean, default: false },
  twitchnotify: { type: Boolean, default: false },
});
