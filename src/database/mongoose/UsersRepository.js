const Repository = require("../Repository.js");

module.exports = class UserRepository extends Repository {
  constructor(mongoose, model) {
    super();

    if (!mongoose || !model)
      throw new Error("O modelo de usuário não pode ser nulo.");
    this.mongoose = mongoose;

    this.model = typeof model === "string" ? mongoose.model(model) : model;
  }

  parse(entity) {
    if (entity) {
      return {
        codigouser: entity.codigouser ? String(entity.codigouser) : null,
        username: entity.username,
        voiceTime: entity.voiceTime || 0,
        totalMessages: entity.totalMessages || 0,
        idguild: entity.idguild || "nada encontrado"
        // ... outros campos do usuário
      };
    } else {
      return null; // ou um objeto vazio, dependendo da preferência
    }
  }

  add(entity) {
    return this.model.create(entity).then(this.parse);
  }

  findOne(codigouser, projection) {
    return this.model.findOne({ codigouser }, projection).then(this.parse);
  }

  findByUsername(username, projection) {
    return this.model.findOne({ username }, projection).then(this.parse);
  }

  get size() {
    return this.model.find({}).then((e) => e.length);
  }

  get(codigouser, projection) {
    return this.model
      .findOne({ codigouser }, projection)
      .then((entity) => entity ? this.parse(entity) : this.add({ codigouser }));
  }
  

  getAllUniqueYoutubeAttributes() {
    return this.model.distinct("codigouser").exec();
  }

  remove(codigouser) {
    return this.model.findOneAndDelete({ codigouser }).then(this.parse);
  }

  update(codigouser, entity, options = { upsert: true }) {
    return this.model.updateOne({ codigouser }, entity, options);
  }

  async verify(codigouser) {
    return !!(await this.model.findOne({ codigouser }));
  }

  findAll(projection) {
    return this.model.find({}, projection).then((e) => e.map(this.parse));
  }

  findAllByGuildId(guildId, projection) {
    return this.model.find({ idguild: guildId }, projection).then((results) => results.map(this.parse));
  }
};
