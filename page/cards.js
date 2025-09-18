import { addVideoToHistory } from '../videoManager.js';

const imageBaseUrl = 'https://image.tmdb.org/t/p/w500';

/**
 * Cria um card de vídeo reutilizável.
 * @param {object} movie - O objeto do filme.
 * @param {object} [options] - Opções de configuração.
 * @param {boolean} [options.addToHistoryOnClick=false] - Se deve adicionar ao histórico ao clicar.
 * @param {string} [options.basePath=''] - Caminho base para a página de vídeo (ex: '../' ou './').
 * @returns {HTMLElement} O elemento do card de vídeo.
 */
export function createVideoCard(item, options = {}) {
  const { addToHistoryOnClick = false, basePath = '' } = options;

  const video = document.createElement("div");
  video.classList.add("video");

  // Lida com 'movie' (title, release_date) e 'tv' (name, first_air_date)
  const title = item.title || item.name;
  const releaseDate = item.release_date || item.first_air_date;

  video.innerHTML = `
    <div class="thumbnail"></div>
    <div class="title">${title}</div>
    <div class="channel">Lançamento: ${releaseDate || 'N/A'}</div>
  `;

  const thumbnailDiv = video.querySelector('.thumbnail');
  if (item.backdrop_path) {
    // Correção Final: Força a propriedade correta para a imagem não esticar.
    // Garante que todas as propriedades do background sejam aplicadas para evitar que a imagem estique.
    thumbnailDiv.style.backgroundImage = `url('${imageBaseUrl}${item.backdrop_path}')`;
    thumbnailDiv.style.backgroundSize = 'cover';
    thumbnailDiv.style.backgroundPosition = 'center';
  }

  video.addEventListener('click', () => {
    if (addToHistoryOnClick) {
      addVideoToHistory(item);
    }
    // O histórico salva o media_type, então podemos usá-lo aqui.
    const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
    window.location.href = `${basePath}video.html?id=${item.id}&type=${mediaType}`;
  });

  return video;
}
