require("dotenv").config();

const config = {
  port: parseInt(process.env.PORT, 10) || 3006,
  ambient: process.env.AMBIENT || "dev",
  isProduction: process.env.AMBIENT === "production",
  
  // Discord Bot
  token: process.env.TOKEN || "",
  
  // Discord OAuth2
  clientId: process.env.CLIENT_ID || "",
  clientSecret: process.env.CLIENT_SECRET || "",
  callbackUrl: process.env.CALLBACK_URL || "http://localhost:3006/auth/discord/callback",
  secretKey: process.env.SECRET_KEY || "change_me_in_env_file",

  // Database
  mongoUri: process.env.MONGODB_URI || "",

  // External APIs
  youtubeApiKey: process.env.YOUTUBE_API || "",
  twitchClientId: process.env.TWITCH_CLIENTID || "",
  twitchClientSecret: process.env.TWITCH_SECRETID || "",
};

// Validate crucial environment variables at startup
const requiredKeys = [
  { key: "TOKEN", value: config.token },
  { key: "MONGODB_URI", value: config.mongoUri },
  { key: "CLIENT_ID", value: config.clientId },
  { key: "CLIENT_SECRET", value: config.clientSecret },
];

for (const { key, value } of requiredKeys) {
  if (!value) {
    console.warn(`[CONFIG WARNING] Variável de ambiente "${key}" não está definida no arquivo .env!`);
  }
}

if (config.secretKey === "change_me_in_env_file") {
  console.warn(`[SECURITY WARNING] A variável SECRET_KEY está usando o valor padrão inseguro! Configure uma chave secreta forte no arquivo .env.`);
}

module.exports = config;
