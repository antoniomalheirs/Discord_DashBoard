const { Client, Collection, GatewayIntentBits } = require("discord.js");
const  DatabaseLoader  = require("../src/loaders/DatabaseLoader");

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
    this.login(process.env.TOKEN);
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
