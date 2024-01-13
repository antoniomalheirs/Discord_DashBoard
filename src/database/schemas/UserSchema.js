const { Schema } = require("mongoose");

module.exports = new Schema({
  codigouser: { type: String },
  username: { type: String }, // O ID do usuário
  voiceTime: { type: Number, default: 0 }, // Tempo total gasto em chamadas de voz (em minutos)
  totalMessages: { type: Number, default: 0 },
  idguild: { type: String, default: "implementando" }, // Número total de mensagens enviadas
});
