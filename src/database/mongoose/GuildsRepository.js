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
        youtubenotify: entity.youtubenotify,
        channelytb: entity.channelytb,
        channeltch: entity.channeltch,
        twitchnotify: entity.twitchnotify,
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

  async verifyTwitchNotify(query = {}) {
    // Adiciona a condição de que YOUTUBENOTIFY deve ser verdadeiro
    const conditions = { ...query, twitchnotify: true };
    console.log("Condições de Filtragem:", conditions); // Adicione esta linha
    const guildas = await this.model.find(conditions);

    return guildas.map((guild) => ({
      twitchnotify: guild.twitchnotify,
      channeltch: guild.channeltch,
      guildID: guild.guildID, // Modificado para refletir o nome correto da propriedade
    }));
  }

  async verifyYouTubeNotify(query = {}) {
    // Adiciona a condição de que YOUTUBENOTIFY deve ser verdadeiro
    const conditions = { ...query, youtubenotify: true };
    console.log("Condições de Filtragem:", conditions); // Adicione esta linha
    const guildas = await this.model.find(conditions);

    return guildas.map((guild) => ({
      youtubenotify: guild.youtubenotify,
      channelytb: guild.channelytb,
      guildID: guild.guildID, // Modificado para refletir o nome correto da propriedade
    }));
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
      const newGuild = { guildID, projection };
      return this.add(newGuild);
    }
  }

  getAllUniqueAttributes() {
    return this.model.distinct("guildID").exec();
  }

  remove(guildID) {
    return this.model.findOneAndDelete({ guildID }).then(this.parse);
  }

  async update(guildID, entity, options = { upsert: true }) {
    return this.model.updateOne({ guildID }, { $set: entity }, options);
  }

  async verify(guildID) {
    return !!(await this.model.findOne({ guildID }));
  }

  findAll(projection) {
    return this.model.find({}, projection).then((e) => e.map(this.parse));
  }
};
