const Repository = require("../Repository.js");

module.exports = class VideosRepository extends Repository {
  constructor(mongoose, model) {
    super();

    if (!mongoose || !model)
      throw new Error("O modelo de video não pode ser nulo.");
    this.mongoose = mongoose;

    this.model = typeof model === "string" ? mongoose.model(model) : model;
  }

  parse(entity) {
    if (entity) {
      return {
        youtube: entity.youtube ? String(entity.youtube) : null,
        channel: entity.channel,
        lastVideo: entity.lastVideo,
        lastPublish: entity.lastPublish,
        message: entity.message,
        notifyGuild: entity.notifyGuild,
        // ... outros campos do vídeo
      };
    } else {
      return null; // ou um objeto vazio, dependendo da preferência
    }
  }

  add(entity) {
    return this.model.create(entity).then(this.parse);
  }

  // Pesquisa por Id
  /*findOne(id, projection) {
    return this.model.findById(id, projection).then(this.parse);
  }*/

  // Pesquisa por Data de Upoload
  findOne(lastVideo, projection) {
    return this.model.findOne({ lastVideo }, projection).then(this.parse);
  }

  findByChannel(channel, projection) {
    return this.model.findOne({ channel }, projection).then(this.parse);
  }

  getAllUniqueYoutubeAttributes() {
    return this.model.distinct("youtube").exec();
  }

  get size() {
    return this.model.find({}).then((e) => e.length);
  }

  get(id, projection) {
    return this.model
      .findById(id, projection)
      .then((e) => (e && this.parse(e)) || this.add({ youtube: id }));
  }

  remove(id) {
    return this.model.findOneAndDelete({ youtube: id }).then(this.parse);
  }

  update(id, entity, options = { upsert: true }) {
    return this.model.updateOne({ youtube: id }, entity, options);
  }

  updateByYoutubeIdAndGuildId(youtubeId, guildId, options = { new: true }) {
    return this.model
      .findOneAndUpdate({ youtube: youtubeId, notifyGuild: guildId }, options)
      .then(this.parse);
  }

  async verify(id) {
    return (await this.model.findOne({ youtube: id }).then((e) => {
      return e;
    }))
      ? true
      : false;
  }

  verifyByYoutubeAndGuildId(youtubeId, guildId) {
    return this.model.exists({ youtube: youtubeId, notifyGuild: guildId });
  }
  

  findAll(projection) {
    return this.model.find({}, projection).then((e) => e.map(this.parse));
  }

  findAllByGuildId(guildId, projection) {
    return this.model
      .find({ notifyGuild: guildId }, projection)
      .then((results) => results.map(this.parse));
  }

  async getChannelsWithVideosByGuildId(guildId) {
    try {
      const videos = await this.model.find({ notifyGuild: guildId });
    
      // Retorna um array de objetos contendo youtube e lastVideo
      return videos.map((video) => ({
        youtube: video.youtube,
        lastVideo: video.lastVideo,
      }));
    } catch (error) {
      console.error("Erro ao obter canais com vídeos para a guilda:", error);
      throw error;
    }
  }
  

  findByYoutubeAndGuildId(channelId, guildId, projection) {
    return this.model
      .findOne({ channel: channelId, notifyGuild: guildId }, projection)
      .then(this.parse);
  }

  async findByLastVideoAndGuildId(lastVideo, guildId, projection) {
    try {
      const video = await this.model.findOne({ lastVideo, notifyGuild: guildId }, projection);
      return video ? this.parse(video) : null;
    } catch (error) {
      console.error("Erro ao consultar dados por lastVideo e guildId:", error);
      throw error;
    }
  }
  
};
