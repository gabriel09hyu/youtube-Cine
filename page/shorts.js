import { addVideoToHistory } from '../videoManager.js';
import { TMDB_API_KEY } from '../app-config.js';

document.addEventListener('DOMContentLoaded', () => {
    const posterBaseUrl = 'https://image.tmdb.org/t/p/w780';

    const api = axios.create({
        baseURL: 'https://api.themoviedb.org/3/',
        params: { api_key: TMDB_API_KEY, language: 'pt-BR' }
    });

    const feedContainer = document.getElementById('shorts-feed-container');

    let currentPage = 1;
    let isLoading = false;
    const endpoints = [
        { path: '/movie/popular', type: 'movie' },
        { path: '/tv/popular', type: 'tv' },
        { path: '/trending/all/week', type: 'all' },
        { path: '/tv/top_rated', type: 'tv' }
    ];

   
    const createShortCard = (item) => {
        const shortItem = document.createElement('div');
        shortItem.className = 'short-item';

        const title = item.title || item.name; 
        const description = item.overview || 'Sem descrição disponível.';
        const releaseYear = new Date(item.release_date || item.first_air_date).getFullYear() || 'N/A';

        shortItem.innerHTML = `
            <img src="${posterBaseUrl}${item.poster_path}" alt="${title}" class="poster">
            <div class="info-overlay">
                <h3 class="title">${title}</h3>
                <p class="description">${description}</p>
                <p class="meta">Nota: ${item.vote_average.toFixed(1)} • ${releaseYear}</p>
            </div>
            <button class="details-btn">Ver Detalhes</button>
        `;

        shortItem.querySelector('.details-btn').addEventListener('click', () => {
            addVideoToHistory(item);
            const mediaType = item.media_type || (item.title ? 'movie' : 'tv'); // Determina o tipo de mídia
            window.location.href = `video.html?id=${item.id}&type=${mediaType}`;
        });

        return shortItem;
    };

    const loadMoreShorts = async () => {
        if (isLoading) return;
        isLoading = true;

        const randomEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

        try {
            const { data: { results } } = await api.get(randomEndpoint.path, {
                params: { page: currentPage }
            });

            if (results.length > 0) {
                const shuffledResults = results.sort(() => 0.5 - Math.random());

                shuffledResults.forEach(item => {
                    if (item.poster_path) {
                        if (randomEndpoint.type !== 'all') item.media_type = randomEndpoint.type;
                        feedContainer.appendChild(createShortCard(item));
                    }
                });
                currentPage++;
            }
        } catch (error) {
            console.error("Erro ao buscar 'shorts':", error);
        }

        isLoading = false;
    };

    feedContainer.addEventListener('scroll', () => {
        if (feedContainer.scrollTop + feedContainer.clientHeight >= feedContainer.scrollHeight - 200) {
            loadMoreShorts();
        }
    });

    loadMoreShorts();
});

import "./layout.js";