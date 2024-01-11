const { MongoDB } = require("../database");
const discordBot = require("../Client");

module.exports = class DatabaseLoader {
  constructor(client) {
    this.client = client;
    this.database = false;
  }

  async call() {
    this.client.database = this.database;

    this.LoaderDatabase().then(() => {
      console.log(
        `\x1b[1m\x1b[95m[BANCO DE DADOS]\x1b[0m`,
        `Bancos de Dados Operando.`
      );
    });
  }

  LoaderDatabase(DBWrapper = MongoDB, options = {}) {
    this.client.database = new DBWrapper(options, this.client);

    return this.client.database.connect().catch((err) => {
      throw console.log(
        `\x1b[1m\x1b[33m[BANCO DE DADOS]\x1b[0m`,
        `Erro ao conectar o Banco de Dados.\n${err}`
      );
    });
  }
};
