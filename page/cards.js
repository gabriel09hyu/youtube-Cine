import { addVideoToHistory } from '../videoManager.js';

const imageBaseUrl = 'https://image.tmdb.org/t/p/w500';

/**
 * @param {object} movie - .
 * @param {object} [options] 
 * @param {boolean} [options.addToHistoryOnClick=false] 
 * @param {string} [options.basePath=''] 
 * @returns {HTMLElement} .
 */
export function createVideoCard(item, options = {}) {
  const { addToHistoryOnClick = false, basePath = '' } = options;

  const video = document.createElement("div");
  video.classList.add("video");

  const title = item.title || item.name;
  const releaseDate = item.release_date || item.first_air_date;

  video.innerHTML = `
    <div class="thumbnail"></div>
    <div class="title">${title}</div>
    <div class="channel">Lançamento: ${releaseDate || 'N/A'}</div>
  `;

  const thumbnailDiv = video.querySelector('.thumbnail');
  if (item.backdrop_path) {
    thumbnailDiv.style.backgroundImage = `url('${imageBaseUrl}${item.backdrop_path}')`;
    thumbnailDiv.style.backgroundSize = 'cover';
    thumbnailDiv.style.backgroundPosition = 'center';
  }

  video.addEventListener('click', () => {
    if (addToHistoryOnClick) {
      addVideoToHistory(item);
    }
    const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
    window.location.href = `${basePath}video.html?id=${item.id}&type=${mediaType}`;
  });

  return video;
}
