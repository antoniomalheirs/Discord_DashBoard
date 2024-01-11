const { Schema } = require("mongoose");

module.exports = new Schema({
  youtube: {
    type: String,
    required: true,
  },
  channel: { type: String },
  lastVideo: {
    type: String,
    unique: true,
  },
  lastPublish: { type: String },
  message: { type: String },
});
