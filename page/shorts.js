import { addVideoToHistory } from '../videoManager.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- Configuração da API ---
    const apiKey = 'd62492ee51bbba141d7a8f0c7daa6e30';
    // Usaremos o poster, que é vertical e ideal para o formato "shorts"
    const posterBaseUrl = 'https://image.tmdb.org/t/p/w780';

    const api = axios.create({
        baseURL: 'https://api.themoviedb.org/3/',
        params: { api_key: apiKey, language: 'pt-BR' }
    });

    // --- Seletores de Elementos ---
    const feedContainer = document.getElementById('shorts-feed-container');

    // --- Estado da Aplicação ---
    let currentPage = 1;
    let isLoading = false;
    // Lista de endpoints para buscar conteúdo variado
    const endpoints = [
        { path: '/movie/popular', type: 'movie' },
        { path: '/tv/popular', type: 'tv' },
        { path: '/trending/all/week', type: 'all' },
        { path: '/tv/top_rated', type: 'tv' }
    ];

    // --- Funções ---

    /**
     * Cria um card de "short" para o feed.
     */
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

        // Adiciona evento de clique para ir para a página do vídeo
        shortItem.querySelector('.details-btn').addEventListener('click', () => {
            addVideoToHistory(item);
            const mediaType = item.media_type || (item.title ? 'movie' : 'tv'); // Determina o tipo de mídia
            // O caminho é relativo à pasta 'page'
            window.location.href = `video.html?id=${item.id}&type=${mediaType}`;
        });

        return shortItem;
    };

    /**
     * Carrega mais itens para o feed.
     */
    const loadMoreShorts = async () => {
        if (isLoading) return;
        isLoading = true;

        // Escolhe um endpoint aleatório da nossa lista
        const randomEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

        try {
            const { data: { results } } = await api.get(randomEndpoint.path, {
                params: { page: currentPage }
            });

            if (results.length > 0) {
                // Embaralha os resultados para aumentar a aleatoriedade
                const shuffledResults = results.sort(() => 0.5 - Math.random());

                shuffledResults.forEach(item => {
                    // Apenas adiciona itens que tenham um poster
                    if (item.poster_path) {
                        // Se o endpoint não for 'trending', o tipo não vem no item. Nós adicionamos.
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

    // Scroll infinito: carrega mais quando o usuário chega perto do final
    feedContainer.addEventListener('scroll', () => {
        if (feedContainer.scrollTop + feedContainer.clientHeight >= feedContainer.scrollHeight - 200) {
            loadMoreShorts();
        }
    });

    // Carrega os primeiros shorts
    loadMoreShorts();
});

// Importa a lógica compartilhada do menu e busca
import "./layout.js";