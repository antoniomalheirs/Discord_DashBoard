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
    return this.model.findOne({ twitch }, projection).then(this.parse);
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
    return this.model.findOneAndDelete({ twitch }).then(this.parse);
  }

  update(twitch, entity, options = { upsert: true }) {
    return this.model.updateOne({ twitch }, { $set: entity }, options);
  }

  async verify(twitch) {
    return !!(await this.model.findOne({ twitch }));
  }

  findAll(projection) {
    return this.model.find({}, projection).then((e) => e.map(this.parse));
  }

  verifyByTwitchAndGuildId(tchId, guildId) {
    return this.model.exists({ twitch: tchId, guildID: guildId });
  }

  deletar(id, guildId) {
    const query = { twitch: id, guildID: guildId }; // Adicionando a condição do guildId
    return this.model.deleteOne(query).then(result => {
      if (result.deletedCount === 1) {
        // Documento removido com sucesso
        return { success: true };
      } else {
        // Nenhum documento foi removido (possivelmente não encontrado)
        return { success: false, message: "Documento não encontrado" };
      }
    }).catch(error => {
      console.error("Erro ao deletar:", error);
      throw error; // Rejeita a promessa com o erro
    });
  }

  findByTwitchAndGuildId(twitchId, guildId, projection) {
    return this.model
      .findOne({ twitch: twitchId, guildID: guildId }, projection)
      .then(this.parse);
  }

  findAllByGuildId(guildId, projection) {
    return this.model
      .find({ guildID: guildId }, projection)
      .then((results) => results.map(this.parse));
  }
};
