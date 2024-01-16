const axios = require("axios");

module.exports = async function (client_id, client_secret) {
  try {
    const response = await axios.post(
      "https://id.twitch.tv/oauth2/token",
      null,
      {
        params: {
          client_id: client_id,
          client_secret: client_secret,
          grant_type: "client_credentials",
        },
      }
    );
    //console.log("Token obtido:", response.data.access_token);
    return response.data.access_token;
  } catch (error) {
    console.error(`Erro ao buscar informações do canal: ${error.message}`);
    throw error;
  }
};
