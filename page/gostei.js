// js/pages/gostei.js

import { getLikedVideos } from '../videoManager.js';
import { createVideoCard } from './cards.js';

document.addEventListener('DOMContentLoaded', () => {
  const likedContainer = document.getElementById('liked-videos-container');
  const videos = getLikedVideos();

  if (videos.length === 0) {
    likedContainer.innerHTML = '<p>Você ainda não curtiu nenhum vídeo.</p>';
    return;
  }

  videos.forEach(video => {
    // Passa o caminho base correto para a navegação funcionar
    const card = createVideoCard(video, { basePath: './' });
    likedContainer.appendChild(card);
  });
});

// Importa a lógica compartilhada do menu e busca
import "./layout.js";
