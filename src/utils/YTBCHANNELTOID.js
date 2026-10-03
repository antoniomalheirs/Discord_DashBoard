const config = require("../config/env");

module.exports = async function (channelInput) {
  try {
    if (!config.youtubeApiKey) {
      throw new Error("A chave da API do YouTube (YOUTUBE_API) não está configurada.");
    }

    const trimmedInput = (channelInput || "").trim();
    if (!trimmedInput) {
      throw new Error("Nome ou ID do canal do YouTube não informado.");
    }

    let channelData = null;
    let channelId = null;

    // ESTRATÉGIA 1 (1 Cota): Se já for um Channel ID direto do YouTube (começa com UC e tem 24 chars)
    if (/^UC[\w-]{22}$/.test(trimmedInput)) {
      const idResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&id=${encodeURIComponent(trimmedInput)}&key=${config.youtubeApiKey}`,
        { method: "GET", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(10000) }
      ).catch(e => { throw new Error(`Tempo limite ou falha ao consultar YouTube: ${e.message}`); });

      if (idResponse.ok) {
        const idData = await idResponse.json();
        if (idData.items && idData.items.length > 0) {
          channelData = idData;
          channelId = trimmedInput;
        }
      }
    }

    // ESTRATÉGIA 2 (1 Cota): Se for um @handle ou começar com @
    if (!channelId) {
      const handle = trimmedInput.startsWith("@") ? trimmedInput : `@${trimmedInput}`;
      const handleResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&forHandle=${encodeURIComponent(handle)}&key=${config.youtubeApiKey}`,
        { method: "GET", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(10000) }
      ).catch(() => null);

      if (handleResponse && handleResponse.ok) {
        const handleData = await handleResponse.json();
        if (handleData.items && handleData.items.length > 0) {
          channelData = handleData;
          channelId = handleData.items[0].id;
        }
      }
    }

    // ESTRATÉGIA 3 (100 Cotas): Fallback para busca textual tradicional se não encontrou por ID ou Handle
    if (!channelId) {
      const searchResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(trimmedInput)}&key=${config.youtubeApiKey}`,
        { method: "GET", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(10000) }
      ).catch(e => { throw new Error(`Tempo limite ao pesquisar no YouTube: ${e.message}`); });

      if (!searchResponse.ok) {
        if (searchResponse.status === 403) {
          throw new Error("A cota da API do YouTube foi atingida ou a chave é inválida. Use o ID direto do canal (UC...).");
        }
        throw new Error(`Erro ao pesquisar canal no YouTube. Status: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      if (!searchData.items || searchData.items.length === 0) {
        throw new Error(`Nenhum canal encontrado no YouTube para: "${trimmedInput}"`);
      }

      channelId = searchData.items[0].snippet.channelId;

      // Buscar detalhes do canal encontrado na busca
      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&id=${channelId}&key=${config.youtubeApiKey}`,
        { method: "GET", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(10000) }
      ).catch(e => { throw new Error(`Tempo limite ao obter detalhes do canal: ${e.message}`); });

      if (!channelResponse.ok) {
        throw new Error(`Erro ao obter detalhes do canal. Status: ${channelResponse.status}`);
      }
      channelData = await channelResponse.json();
    }

    if (!channelData || !channelData.items || channelData.items.length === 0) {
      throw new Error(`Detalhes do canal "${trimmedInput}" não encontrados.`);
    }

    const channelItem = channelData.items[0];
    const uploadsPlaylistId = channelItem.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      return {
        youtube: channelId,
        channel: channelItem.snippet?.title || trimmedInput,
        lastVideo: "Nenhum vídeo recente encontrado",
        notifyGuild: "",
      };
    }

    // Obter o último vídeo da playlist de uploads
    const playlistItemsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=1&key=${config.youtubeApiKey}`,
      { method: "GET", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(10000) }
    ).catch(() => null);

    let latestVideo = "Nenhum vídeo publicado ainda";
    let lastPublish = null;

    if (playlistItemsResponse && playlistItemsResponse.ok) {
      const playlistItemsData = await playlistItemsResponse.json();
      if (playlistItemsData.items && playlistItemsData.items.length > 0) {
        const snippet = playlistItemsData.items[0].snippet;
        latestVideo = `${snippet.title} || https://www.youtube.com/watch?v=${snippet.resourceId?.videoId || ''}`;
        lastPublish = snippet.publishedAt || null;
      }
    }

    return {
      youtube: channelId,
      channel: channelItem.snippet?.title || trimmedInput,
      lastVideo: latestVideo,
      lastPublish: lastPublish,
      notifyGuild: "",
    };
  } catch (error) {
    console.error(`[YOUTUBE API] ${error.message}`);
    throw error;
  }
};
