
import { getHistory } from '../videoManager.js'
import { createVideoCard } from './cards.js';

document.addEventListener('DOMContentLoaded', () => {
  const historyContainer = document.getElementById('history-container');
  const videos = getHistory();

  if (videos.length === 0) {
    historyContainer.innerHTML = '<p>Seu histórico está vazio.</p>';
    return;
  }

  videos.forEach(video => {
    const card = createVideoCard(video, { basePath: './' }); 
    historyContainer.appendChild(card);
  });
});
import "./layout.js";
