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
        idguild: entity.idguild || "nada encontrado",
        money: entity.money || 0,
        bank: entity.bank || 0,
      };
    } else {
      return null; // ou um objeto vazio, dependendo da preferência
    }
  }

  add(entity) {
    return this.model.create(entity).then(this.parse);
  }

  findOne(codigouser, projection) {
    return this.model.findOne({ codigouser: { $eq: String(codigouser) } }, projection).then(this.parse);
  }

  findByUsername(username, projection) {
    return this.model.findOne({ username: { $eq: String(username) } }, projection).then(this.parse);
  }

  findByGuildId(idguild, projection) {
    return this.model
      .findOne({ idguild: { $eq: String(idguild) } }, projection)
      .then((result) => (result ? this.parse(result) : false));
  }

  get size() {
    return this.model.find({}).then((e) => e.length);
  }

  get(codigouser, projection) {
    const sanitizedCode = String(codigouser);
    return this.model
      .findOne({ codigouser: { $eq: sanitizedCode } }, projection)
      .then((entity) =>
        entity ? this.parse(entity) : this.add({ codigouser: sanitizedCode })
      );
  }

  getByUserIdAndGuildId(codigouser, idguild, projection) {
    const sanitizedCode = String(codigouser);
    const sanitizedGuild = String(idguild);
    return this.model
      .findOne({ codigouser: { $eq: sanitizedCode }, idguild: { $eq: sanitizedGuild } }, projection)
      .then((entity) =>
        entity ? this.parse(entity) : this.add({ codigouser: sanitizedCode, idguild: sanitizedGuild })
      );
  }


  getAllUniqueYoutubeAttributes() {
    return this.model.distinct("codigouser").exec();
  }

  remove(codigouser) {
    return this.model.findOneAndDelete({ codigouser: { $eq: String(codigouser) } }).then(this.parse);
  }

  update(codigouser, entity, options = { upsert: true }) {
    const sanitizedId = String(codigouser);
    const safeUpdate = { $set: entity };
    return this.model.updateOne({ codigouser: { $eq: sanitizedId } }, safeUpdate, options);
  }

  updateByUserIdAndGuildId(codigouser, idguild, entity, options = { upsert: true }) {
    const sanitizedUserId = String(codigouser);
    const sanitizedGuildId = String(idguild);
    const safeUpdate = { $set: entity };
    return this.model.updateOne({ codigouser: { $eq: sanitizedUserId }, idguild: { $eq: sanitizedGuildId } }, safeUpdate, options);
  }


  async verify(codigouser) {
    return !!(await this.model.findOne({ codigouser: { $eq: String(codigouser) } }));
  }

  findAll(projection) {
    return this.model.find({}, projection).then((e) => e.map(this.parse));
  }

  findAllByGuildId(guildId, projection) {
    return this.model
      .find({ idguild: { $eq: String(guildId) } }, projection)
      .then((results) => results.map(this.parse));
  }
};
