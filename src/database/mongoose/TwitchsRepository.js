const Repository = require("../Repository.js");

module.exports = class TwitchRepository extends Repository {
  constructor(mongoose, model) {
    super();

    if (!mongoose || !model)
      throw new Error("O modelo de guilda não pode ser nulo.");
    this.mongoose = mongoose;

    this.model = typeof model === "string" ? mongoose.model(model) : model;
  }

  parse(entity) {
    if (entity) {
      return {
        twitch: entity.twitch,
        channel: entity.channel,
        guildID: entity.guildID,
        // ... outros campos da guilda
      };
    } else {
      return null; // ou um objeto vazio, dependendo da preferência
    }
  }

  add(projection) {
    return this.model.create(projection).then(this.parse);
  }

  findOne(twitch, projection) {
    return this.model.findOne({ twitch: String(twitch) }, projection).then(this.parse);
  }

  findByGuildName(channel, projection) {
    return this.model.findOne({ channel }, projection).then(this.parse);
  }

  get size() {
    return this.model.find({}).then((e) => e.length);
  }

  async getOrCreate(twitch, projection) {
    const existingGuild = await this.findOne(twitch, projection);

    if (existingGuild) {
      return existingGuild;
    } else {
      const newGuild = { twitch, projection };
      return this.add(newGuild);
    }
  }

  getAllUniqueAttributes() {
    return this.model.distinct("twitch").exec();
  }

  remove(twitch) {
    return this.model.findOneAndDelete({ twitch: String(twitch) }).then(this.parse);
  }

  update(twitch, entity, options = { upsert: true }) {
    return this.model.updateOne({ twitch: String(twitch) }, { $set: entity }, options);
  }

  async verify(twitch) {
    return !!(await this.model.findOne({ twitch: String(twitch) }));
  }

  findAll(projection) {
    return this.model.find({}, projection).then((e) => e.map(this.parse));
  }

  verifyByTwitchAndGuildId(tchId, guildId) {
    return this.model.exists({ twitch: String(tchId), guildID: String(guildId) });
  }

  deletar(id, guildId) {
    const query = { twitch: String(id), guildID: String(guildId) };
    return this.model.deleteOne(query).then(result => {
      if (result.deletedCount === 1) {
        return { success: true };
      } else {
        return { success: false, message: "Documento não encontrado" };
      }
    }).catch(error => {
      console.error("Erro ao deletar:", error);
      throw error;
    });
  }

  findByTwitchAndGuildId(twitchId, guildId, projection) {
    return this.model
      .findOne({ twitch: String(twitchId), guildID: String(guildId) }, projection)
      .then(this.parse);
  }

  findAllByGuildId(guildId, projection) {
    return this.model
      .find({ guildID: String(guildId) }, projection)
      .then((results) => results.map(this.parse));
  }
};
