const Repository = require("../Repository.js");

module.exports = class GuildRepository extends Repository {
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
        guildID: entity.guildID,
        guildName: entity.guildName,
        // ... outros campos da guilda
      };
    } else {
      return null; // ou um objeto vazio, dependendo da preferência
    }
  }

  add(projection) {
    return this.model.create(projection).then(this.parse);
  }

  findOne(guildID, projection) {
    return this.model.findOne({ guildID }, projection).then(this.parse);
  }

  findByGuildName(guildName, projection) {
    return this.model.findOne({ guildName }, projection).then(this.parse);
  }

  get size() {
    return this.model.find({}).then((e) => e.length);
  }

  async getOrCreate(guildID, projection) {
    const existingGuild = await this.findOne(guildID, projection);

    if (existingGuild) {
      return existingGuild;
    } else {
      const newGuild = {guildID, projection};
      return this.add(newGuild);
    }
  }

  getAllUniqueAttributes() {
    return this.model.distinct("guildID").exec();
  }

  remove(guildID) {
    return this.model.findOneAndDelete({ guildID }).then(this.parse);
  }

  update(guildID, entity, options = { upsert: true }) {
    return this.model.updateOne({ guildID }, { $set: entity }, options);
  }

  async verify(guildID) {
    return !!(await this.model.findOne({ guildID }));
  }

  findAll(projection) {
    return this.model.find({}, projection).then((e) => e.map(this.parse));
  }
};
