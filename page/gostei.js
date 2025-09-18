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
    const card = createVideoCard(video, { basePath: './' });
    likedContainer.appendChild(card);
  });
});

import "./layout.js";
