const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

module.exports = async function (channelName) {
  try {
    if (!process.env.YOUTUBE_API) {
      throw new Error("A chave da API do YouTube não está definida.");
    }

    // Pesquisar canal pelo nome
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(
        channelName
      )}&key=${process.env.YOUTUBE_API}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!searchResponse.ok) {
      throw new Error(
        `Erro ao pesquisar canal. Status: ${searchResponse.status}`
      );
    }

    const searchData = await searchResponse.json();

    // Verificar se há resultados para a pesquisa
    if (searchData.items.length === 0) {
      console.error("Nenhum canal encontrado.");
      return {};
    }

    const channelId = searchData.items[0].snippet.channelId;

    // Agora, com o ID do canal, você pode obter os detalhes do canal
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&id=${channelId}&key=${process.env.YOUTUBE_API}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!channelResponse.ok) {
      throw new Error(
        `Erro ao obter detalhes do canal. Status: ${channelResponse.status}`
      );
    }

    const channelData = await channelResponse.json();

    // Obter a playlist de uploads do canal
    const uploadsPlaylistId =
      channelData.items[0].contentDetails.relatedPlaylists.uploads;

    // Obter o último vídeo da playlist de uploads
    const playlistItemsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=1&key=${process.env.YOUTUBE_API}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!playlistItemsResponse.ok) {
      throw new Error(
        `Erro ao obter detalhes do vídeo mais recente. Status: ${playlistItemsResponse.status}`
      );
    }

    const playlistItemsData = await playlistItemsResponse.json();

    // Verificar se há resultados na playlist
    if (playlistItemsData.items.length === 0) {
      console.error("Nenhum vídeo encontrado na playlist.");
      return {};
    }

    // Extrair detalhes do vídeo mais recente
    const latestVideoDetails = playlistItemsData.items[0].snippet;

    // Retorne as informações do canal, incluindo o último vídeo como uma string concatenada
    return {
      youtube: channelId,
      channel: channelData.items[0].snippet.title,
      lastVideo: `${latestVideoDetails.title} || https://www.youtube.com/watch?v=${latestVideoDetails.resourceId.videoId}`,
      notifyGuild: "",
      // ... outros campos do canal
    };
  } catch (error) {
    console.error(`Erro ao buscar informações do canal: ${error.message}`);
    throw error;
  }
};
