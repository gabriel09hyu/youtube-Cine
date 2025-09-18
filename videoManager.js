
const HISTORY_KEY = 'videoHistory';
const LIKED_VIDEOS_KEY = 'likedVideos';
const WATCH_LATER_KEY = 'watchLater';
const USER_PLAYLISTS_KEY = 'userPlaylists';

/**
 * @param {string} key 
 * @returns {Array}
 */
export function getVideoList(key) {
  const storedList = sessionStorage.getItem(key);
  console.log(`[videoManager] Buscando chave: "${key}". Valor encontrado:`, storedList ? JSON.parse(storedList) : 'nada');
  return storedList ? JSON.parse(storedList) : [];
}

/**
 * @param {string} key 
 * @param {Array} list 
 */
function saveVideoList(key, list) {
  sessionStorage.setItem(key, JSON.stringify(list));
}


/**
 * @param {object} video 
 */
export function addVideoToHistory(video) {
  let history = getVideoList(HISTORY_KEY);
  history = history.filter(v => v.id !== video.id);
  history.unshift(video);
  saveVideoList(HISTORY_KEY, history);
}

/**
 * @returns {Array}
 */
export function getHistory() {
  return getVideoList(HISTORY_KEY);
}


/**
 * @param {object} video 
 */
export function addVideoToLiked(video) {
  const likedVideos = getVideoList(LIKED_VIDEOS_KEY);
  const isAlreadyLiked = likedVideos.some(v => v.id === video.id);
  if (!isAlreadyLiked) {
    likedVideos.unshift(video); 
    saveVideoList(LIKED_VIDEOS_KEY, likedVideos);
    console.log('Vídeo adicionado aos Gostei:', video.title);
  } else {
    console.log('Vídeo já está na lista de Gostei:', video.title);
  }
}

/**
 * @returns {Array}
 */
export function getLikedVideos() {
  return getVideoList(LIKED_VIDEOS_KEY);
}


/**
 * @param {object} video 
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
 * @returns {Array}
 */
export function getWatchLaterVideos() {
  return getVideoList(WATCH_LATER_KEY);
}


/**
 * @returns {Array<{id: string, name: string}>}
 */
export function getUserPlaylists() {
  return getVideoList(USER_PLAYLISTS_KEY);
}

/**
 * @param {string} playlistName 
 * @returns {{id: string, name: string}} 
 */
export function createUserPlaylist(playlistName) {
  const playlists = getUserPlaylists();
  const newPlaylist = {
    id: `playlist_${Date.now()}`, 
    name: playlistName,
  };
  playlists.push(newPlaylist);
  saveVideoList(USER_PLAYLISTS_KEY, playlists);
  return newPlaylist;
}

/**
 * @param {string} playlistId 
 * @param {object} video 
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
 * @param {string} playlistId 
 * @param {number} videoId 
 */
export function removeVideoFromPlaylist(playlistId, videoId) {
  let videoList = getVideoList(playlistId);
  videoList = videoList.filter(v => v.id !== videoId);
  saveVideoList(playlistId, videoList);
}
