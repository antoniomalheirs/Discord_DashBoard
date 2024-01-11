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

  async start() {
    await new DatabaseLoader(this).call(); // Carrega a Database
    // Adicione outros inicializadores aqui, se necessário
    this.login(process.env.TOKEN);
  }

  setCommands(commands) {
    this.commands = commands;
  }

  getCommands() {
    return this.commands;
  }
}

const discordBot = new DiscordBot();

module.exports = discordBot;
