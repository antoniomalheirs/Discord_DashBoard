const { Client, Collection, GatewayIntentBits } = require("discord.js");
const DatabaseLoader = require("./loaders/DatabaseLoader");
const config = require("./config/env");

class DiscordBot extends Client {
  constructor() {
    super({
      failIfNotExists: false,
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
      ],
    });

    this.commands = new Collection();
  }
  // Iniciando aplicação e outras funções no Servidor
  async start() {
    await new DatabaseLoader(this).call();
    if (config.token) {
      this.login(config.token);
    } else {
      console.warn("[BOT WARNING] TOKEN do Discord não fornecido. O bot não inicializará o login.");
    }
  }
  // Funções internas da aplicação
  setCommands(commands) {
    this.commands = commands;
  }

  getCommands() {
    return this.commands;
  }
}

const discordBot = new DiscordBot();

module.exports = discordBot;
