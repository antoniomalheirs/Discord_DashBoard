const { Schema } = require("mongoose");

const TwitchSchema = new Schema({
  twitch: {
    type: String,
    required: true,
  },
  channel: { type: String },
  guildID: { type: String },
  isLive: { type: Boolean, default: false }, // Rastreia o estado da ultima verificação
});

// Índice composto para consultas O(1) de streamers por guilda
TwitchSchema.index({ guildID: 1, twitch: 1 });

module.exports = TwitchSchema;
