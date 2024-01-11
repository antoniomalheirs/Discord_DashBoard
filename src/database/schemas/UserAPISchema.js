const { Schema } = require("mongoose");

module.exports = new Schema({
  codigouser: { type: String },
  username: { type: String },// O ID do usuário
});
