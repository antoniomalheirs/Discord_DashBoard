const VideosRepository = require("../VideosRepository");
const VideoSchema = require("../../schemas/VideoSchema.js");

module.exports = class VideoRepository extends VideosRepository {
  constructor(mongoose) {
    super(mongoose, mongoose.model("Videos", VideoSchema));
  }

  parse(entity) {
    return {
      youtube: null,
      channel: null,
      lastVideo: null,
      lastPublish: null,
      message: null,
      ...(super.parse(entity) || {}),
    };
  }
};
