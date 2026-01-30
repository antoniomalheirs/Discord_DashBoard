const { Schema } = require("mongoose");

module.exports = new Schema({
  guildID: { type: String },
  guildName: { type: String },
  channelytb: { type: String, default: "" },
  channeltch: { type: String, default: "" },
  youtubenotify: { type: Boolean, default: false },
  twitchnotify: { type: Boolean, default: false },
  logging: {
    message_delete: { channel: { type: String, default: "" }, state: { type: Boolean, default: false } },
    message_update: { channel: { type: String, default: "" }, state: { type: Boolean, default: false } },
    voice_update: { channel: { type: String, default: "" }, state: { type: Boolean, default: false } },
    member_join: { channel: { type: String, default: "" }, state: { type: Boolean, default: false } },
    member_leave: { channel: { type: String, default: "" }, state: { type: Boolean, default: false } },
    channel_update: { channel: { type: String, default: "" }, state: { type: Boolean, default: false } },
    role_update: { channel: { type: String, default: "" }, state: { type: Boolean, default: false } },
    user_update: { channel: { type: String, default: "" }, state: { type: Boolean, default: false } },
    server_update: { channel: { type: String, default: "" }, state: { type: Boolean, default: false } },
    member_ban: { channel: { type: String, default: "" }, state: { type: Boolean, default: false } },
    invite_update: { channel: { type: String, default: "" }, state: { type: Boolean, default: false } },
    economy_log: { channel: { type: String, default: "" }, state: { type: Boolean, default: false } }, // NEW
  },
  poker: { channel: { type: String, default: "" }, state: { type: Boolean, default: false } }, // Moved to Root
});
