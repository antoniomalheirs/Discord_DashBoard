const { Schema } = require("mongoose");

const VideoSchema = new Schema({
  youtube: {
    type: String,
    required: true,
  },
  channel: { type: String },
  lastVideo: {
    type: String,
  },
  lastPublish: { type: String },
  message: { type: String },
  notifyGuild: { type: String },
});

// Índice composto para consultas O(1) de canais monitorados por guilda
VideoSchema.index({ notifyGuild: 1, youtube: 1 });

module.exports = VideoSchema;
