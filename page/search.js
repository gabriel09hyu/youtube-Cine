document.addEventListener('DOMContentLoaded', () => {
    // --- Configuração da API ---
    const apiKey = 'd62492ee51bbba141d7a8f0c7daa6e30';
    const imageBaseUrl = 'https://image.tmdb.org/t/p/w500';

    const api = axios.create({
        baseURL: 'https://api.themoviedb.org/3/',
        params: { api_key: apiKey, language: 'pt-BR' }
    });

    // --- Seletores de Elementos ---
    const searchInput = document.getElementById('search-input');
    const searchTitle = document.getElementById('search-title');
    const resultsContainer = document.getElementById('search-results-container');

    // --- Funções ---

    const getSearchQuery = () => new URLSearchParams(window.location.search).get('query');

    const searchMovies = async (query) => {
        try {
            const { data } = await api.get('/search/movie', { params: { query } });
            return data.results;
        } catch (error) {
            console.error("Erro ao buscar filmes:", error);
            resultsContainer.innerHTML = '<p>Ocorreu um erro ao buscar os resultados.</p>';
            return [];
        }
    };

    const createSearchResultCard = (movie) => {
        const card = document.createElement('div');
        card.className = 'search-result-card';

        const thumbnailHtml = movie.backdrop_path
            ? `<div class="thumbnail" style="background-image: url('${imageBaseUrl}${movie.backdrop_path}'); background-size: cover; background-position: center;"></div>`
            : '<div class="thumbnail"></div>';

        card.innerHTML = `
            ${thumbnailHtml}
            <div class="info">
                <h3 class="title">${movie.title}</h3>
                <p class="meta">Nota: ${movie.vote_average.toFixed(1)} • ${new Date(movie.release_date).getFullYear() || 'N/A'}</p>
                <p class="description">${movie.overview || 'Sem descrição.'}</p>
            </div>
        `;

        card.addEventListener('click', () => {
            const mediaType = movie.media_type || 'movie'; // Garante que o tipo seja passado
            window.location.href = `video.html?id=${movie.id}&type=${mediaType}`;
        });

        return card;
    };

    // --- Execução Principal ---
    const init = async () => {
        // Carregar resultados da busca vindos da URL
        const query = getSearchQuery();
        if (query) {
            searchTitle.textContent = `Resultados para: "${decodeURIComponent(query)}"`;
            searchInput.value = decodeURIComponent(query);
            const movies = await searchMovies(query);
            resultsContainer.innerHTML = ''; // Limpa o container
            if (movies.length > 0) {
                movies.forEach(movie => resultsContainer.appendChild(createSearchResultCard(movie)));
            } else {
                resultsContainer.innerHTML = '<p>Nenhum resultado encontrado para sua busca.</p>';
            }
        } else {
            searchTitle.textContent = 'Por favor, digite um termo para buscar.';
        }
    };

    init();
});

// Importa a lógica compartilhada do menu e busca
import "./layout.js";
