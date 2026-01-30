const { Schema } = require("mongoose");

module.exports = new Schema({
  codigouser: { type: String },
  username: { type: String }, // O ID do usuário
  voiceTime: { type: Number, default: 0 }, // Tempo total gasto em chamadas de voz (em minutos)
  totalMessages: { type: Number, default: 0 },
  idguild: { type: String }, // Número total de mensagens enviadas
  money: { type: Number, default: 0 }, // Saldo do usuário
  lastDaily: { type: Number, default: 0 }, // Timestamp do último daily
  welcomeClaimed: { type: Boolean, default: false }, // Se já pegou o bônus inicial
  background: { type: String, default: "default" }, // Background equipado
  ownedBackgrounds: { type: [String], default: ["default"] }, // Backgrounds comprados
  energy: { type: Number, default: 50 }, // Energia para jogar (Max 50)
  lastEnergyUpdate: { type: Number, default: Date.now() }, // Para regeneração

  // New Economy Fields
  bank: { type: Number, default: 0 }, // Dinheiro no banco (Seguro)
  dailyStreak: { type: Number, default: 0 }, // Dias seguidos de daily
  lastWork: { type: Number, default: 0 }, // Cooldown de trabalho
  lastRob: { type: Number, default: 0 }, // Cooldown de roubo

  // Inventory & Protection
  inventory: { type: [String], default: [] }, // Itens comprados (ids)
  protectionExpires: { type: Number, default: 0 }, // Timestamp pro fim das algemas

  // Advanced RPG (Jobs & Pets)
  job: { type: String, default: "Desempregado" }, // Hacker, Police, Banker, Miner
  pets: { type: [String], default: [] }, // Pets owned
  activePet: { type: String, default: "" }, // Currently equipped pet
});
