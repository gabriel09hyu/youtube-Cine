// js/managers/videoManager.js

const HISTORY_KEY = 'videoHistory';
const LIKED_VIDEOS_KEY = 'likedVideos';
const WATCH_LATER_KEY = 'watchLater';
const USER_PLAYLISTS_KEY = 'userPlaylists';

/**
 * Busca uma lista de vídeos do sessionStorage.
 * @param {string} key A chave para buscar no sessionStorage.
 * @returns {Array} A lista de vídeos ou um array vazio.
 */
export function getVideoList(key) {
  const storedList = sessionStorage.getItem(key);
  console.log(`[videoManager] Buscando chave: "${key}". Valor encontrado:`, storedList ? JSON.parse(storedList) : 'nada');
  return storedList ? JSON.parse(storedList) : [];
}

/**
 * Salva uma lista de vídeos no sessionStorage.
 * @param {string} key A chave para salvar no sessionStorage.
 * @param {Array} list A lista de vídeos a ser salva.
 */
function saveVideoList(key, list) {
  sessionStorage.setItem(key, JSON.stringify(list));
}

// --- Funções do Histórico ---

/**
 * Adiciona um vídeo ao histórico.
 * Se o vídeo já existir, ele é movido para o topo (mais recente).
 * @param {object} video O objeto do vídeo a ser adicionado.
 */
export function addVideoToHistory(video) {
  let history = getVideoList(HISTORY_KEY);
  // Remove o vídeo se ele já existir para evitar duplicatas e movê-lo para o topo
  history = history.filter(v => v.id !== video.id);
  // Adiciona o vídeo no início da lista (mais recente)
  history.unshift(video);
  saveVideoList(HISTORY_KEY, history);
}

/**
 * Retorna todos os vídeos do histórico.
 * @returns {Array}
 */
export function getHistory() {
  return getVideoList(HISTORY_KEY);
}

// --- Funções dos Vídeos Curtidos ---

/**
 * Adiciona um vídeo à lista de curtidos.
 * Se o vídeo já estiver na lista, ele não será adicionado novamente.
 * @param {object} video O objeto do vídeo a ser adicionado.
 */
export function addVideoToLiked(video) {
  const likedVideos = getVideoList(LIKED_VIDEOS_KEY);
  // Verifica se o vídeo já foi curtido para não duplicar
  const isAlreadyLiked = likedVideos.some(v => v.id === video.id);
  if (!isAlreadyLiked) {
    likedVideos.unshift(video); // Adiciona no início
    saveVideoList(LIKED_VIDEOS_KEY, likedVideos);
    console.log('Vídeo adicionado aos Gostei:', video.title);
  } else {
    console.log('Vídeo já está na lista de Gostei:', video.title);
  }
}

/**
 * Retorna todos os vídeos curtidos.
 * @returns {Array}
 */
export function getLikedVideos() {
  return getVideoList(LIKED_VIDEOS_KEY);
}

// --- Funções de Assistir Mais Tarde ---

/**
 * Adiciona um vídeo à lista "Assistir mais tarde".
 * @param {object} video O objeto do vídeo a ser adicionado.
 */
export function addVideoToWatchLater(video) {
  const watchLaterList = getVideoList(WATCH_LATER_KEY);
  const isAlreadyInList = watchLaterList.some(v => v.id === video.id);
  if (!isAlreadyInList) {
    watchLaterList.unshift(video);
    saveVideoList(WATCH_LATER_KEY, watchLaterList);
  }
}

/**
 * Retorna todos os vídeos da lista "Assistir mais tarde".
 * @returns {Array}
 */
export function getWatchLaterVideos() {
  return getVideoList(WATCH_LATER_KEY);
}

// --- Funções de Playlists do Usuário ---

/**
 * Retorna a lista de playlists criadas pelo usuário.
 * @returns {Array<{id: string, name: string}>}
 */
export function getUserPlaylists() {
  return getVideoList(USER_PLAYLISTS_KEY);
}

/**
 * Cria uma nova playlist e a salva.
 * @param {string} playlistName O nome da nova playlist.
 * @returns {{id: string, name: string}} O objeto da nova playlist.
 */
export function createUserPlaylist(playlistName) {
  const playlists = getUserPlaylists();
  const newPlaylist = {
    id: `playlist_${Date.now()}`, // ID único baseado no tempo
    name: playlistName,
  };
  playlists.push(newPlaylist);
  saveVideoList(USER_PLAYLISTS_KEY, playlists);
  return newPlaylist;
}

/**
 * Adiciona um vídeo a uma playlist específica.
 * @param {string} playlistId O ID da playlist.
 * @param {object} video O objeto do vídeo.
 */
export function addVideoToPlaylist(playlistId, video) {
  const videoList = getVideoList(playlistId);
  const isAlreadyInList = videoList.some(v => v.id === video.id);
  if (!isAlreadyInList) {
    videoList.unshift(video);
    saveVideoList(playlistId, videoList);
  }
}

/**
 * Remove um vídeo de uma playlist específica.
 * @param {string} playlistId O ID da playlist.
 * @param {number} videoId O ID do vídeo a ser removido.
 */
export function removeVideoFromPlaylist(playlistId, videoId) {
  let videoList = getVideoList(playlistId);
  videoList = videoList.filter(v => v.id !== videoId);
  saveVideoList(playlistId, videoList);
}
