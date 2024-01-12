const { Schema } = require("mongoose");

module.exports = new Schema({
  codigouser: { type: String, required: true },
  username: { type: String }, // O ID do usuário
});
