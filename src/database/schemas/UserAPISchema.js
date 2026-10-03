const { Schema } = require("mongoose");

const UserAPISchema = new Schema({
  codigouser: { type: String, required: true, unique: true },
  username: { type: String }, // O ID do usuário
  acesstk: { type: String },
  refreshtk: { type: String },
});

// Índice para busca e atualização rápida de tokens de OAuth do usuário
UserAPISchema.index({ codigouser: 1 });

module.exports = UserAPISchema;
