import { addVideoToHistory } from './videoManager.js';

const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w342'; // URL para posters dos shorts
let activeMediaType = 'movie'; // Tipo de mídia inicial
const container = document.getElementById("video-container");
const apiKey = 'd62492ee51bbba141d7a8f0c7daa6e30';
const imageBaseUrl = 'https://image.tmdb.org/t/p/w500';
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.querySelector('.sidebar');
const content = document.querySelector('.content');
const searchInput = document.querySelector('.search-bar input');
const searchButton = document.querySelector('.search-bar button');
const shortsSection = document.getElementById('shorts-section');
const mobileSearchIcon = document.querySelector('.mobile-search-icon');
const firstRowContainer = document.getElementById('first-row-videos');
const shortsContainer = document.getElementById('shorts-grid-container');
const subHeader = document.querySelector('.sub-header');
const filterButtons = document.querySelectorAll('.filter-btn');
const shortsPrevBtn = document.getElementById('shorts-prev-btn');
const shortsNextBtn = document.getElementById('shorts-next-btn');


// Função para criar os cards de vídeo com base nos dados de um filme
function createVideoCard(item, options = { addToHistoryOnClick: true, basePath: 'page/' }) {
  const { addToHistoryOnClick, basePath } = options;

  const video = document.createElement("div");
  video.classList.add("video");

  // O endpoint de 'trending' pode retornar 'tv' ou 'movie', então o título pode ser 'title' ou 'name'
  const title = item.title || item.name;
  // A data de lançamento também pode variar
  const releaseDate = item.release_date || item.first_air_date;

  video.innerHTML = `
    <div class="thumbnail"></div>
    <div class="title">${title}</div>
    <div class="channel">Lançamento: ${releaseDate}</div>
  `;

  const thumbnailDiv = video.querySelector('.thumbnail');
  if (item.backdrop_path) {
    // Define todas as propriedades de uma vez usando o atalho 'background'.
    // Isso é mais robusto contra sobrescritas parciais de estilo.
    thumbnailDiv.style.background = `url('${imageBaseUrl}${item.backdrop_path}') center / cover no-repeat`;
  }

  // Clique no card
  if (addToHistoryOnClick) {
    video.addEventListener('click', () => {
      // Define o tipo de mídia. 'trending' tem 'media_type', outros herdam do filtro ativo.
      const mediaType = item.media_type || activeMediaType;
      addVideoToHistory(item);
      window.location.href = `${basePath}video.html?id=${item.id}&type=${mediaType}`;
    });
  } else {
    video.addEventListener('click', () => {
      const mediaType = item.media_type || activeMediaType;
      window.location.href = `${basePath}video.html?id=${item.id}&type=${mediaType}`;
    });
  }

  return video;
}

/**
 * Cria um card de "short" para a página inicial.
 * É uma versão simplificada do card da página de shorts.
 */
function createHomepageShortCard(item) {
    const shortCard = document.createElement('div');
    shortCard.className = 'short-card-homepage';

    const title = item.title || item.name;
    const mediaType = item.media_type || (item.title ? 'movie' : 'tv');

    shortCard.innerHTML = `
        <img src="${POSTER_BASE_URL}${item.poster_path}" alt="${title}">
        <div class="short-title">${title}</div>
    `;

    shortCard.addEventListener('click', () => {
        // Navega para a página de detalhes, como um short normal
        addVideoToHistory(item);
        window.location.href = `page/video.html?id=${item.id}&type=${mediaType}`;
    });

    return shortCard;
}

const api = axios.create({
    baseURL: 'https://api.themoviedb.org/3/',
    params: {
        api_key: apiKey,
        language: 'pt-BR',
    }
})

let currentPage = 1;
let isLoading = false;
let activeEndpoint = '/movie/popular'; // Endpoint inicial
let shortsCurrentPage = 1;
let isShortsLoading = false;

// Função para carregar os shorts para a página inicial
async function loadShortsForHomepage(isNewCategory = false) {
    if (isShortsLoading) return;
    isShortsLoading = true;

    // Se for uma nova categoria, reseta a paginação e limpa o container dos shorts
    if (isNewCategory) {
        shortsContainer.innerHTML = '';
        shortsCurrentPage = 1;
    }

    // Não faz nada se não for uma nova carga, já que vamos carregar um lote grande de uma vez.
    if (!isNewCategory) return;

    // Lista de endpoints para buscar um mix de conteúdo
    const shortsEndpoints = [
        api.get('/movie/popular', { params: { page: 1 } }),
        api.get('/tv/popular', { params: { page: 1 } }),
        api.get('/trending/all/week', { params: { page: 1 } }),
        api.get('/movie/top_rated', { params: { page: 1 } })
    ];

    try {
        // Busca todos os endpoints ao mesmo tempo
        const responses = await Promise.all(shortsEndpoints);

        // Junta todos os resultados em uma única lista, removendo duplicados
        const allResults = [];
        const seenIds = new Set();

        responses.forEach(response => {
            response.data.results.forEach(item => {
                if (item.poster_path && !seenIds.has(item.id)) {
                    allResults.push(item);
                    seenIds.add(item.id);
                }
            });
        });

        // Embaralha a lista de resultados para máxima aleatoriedade
        const shuffledResults = allResults.sort(() => 0.5 - Math.random());

        // Adiciona os cards embaralhados ao container
        shuffledResults.slice(0, 20).forEach(item => { // Pega os primeiros 20 resultados aleatórios
            const shortCard = createHomepageShortCard(item);
            shortsContainer.appendChild(shortCard);
        });

        if (shuffledResults.length > 0) {
            shortsSection.style.display = 'block'; // Mostra a seção de shorts
        }
    } catch (error) {
        console.error("Erro ao buscar shorts para a página inicial:", error);
        shortsSection.style.display = 'none'; // Esconde se der erro
    } finally {
        isShortsLoading = false;
    }
}

// Função para carregar vídeos da API
async function loadVideos() {
  if (isLoading) return; // Impede carregamentos múltiplos
  isLoading = true;
  console.log(`Carregando página ${currentPage} de ${activeEndpoint}`);

  try {
    const { data: { results } } = await api.get(activeEndpoint, {
        params: { page: currentPage }
    });

    if (results.length > 0) {
        // Se for a primeira página, organiza a estrutura: 1ª fileira, depois shorts, depois o resto.
        if (currentPage === 1) {
            // Pega os 3 primeiros para a primeira fileira (grid 3x3)
            const firstRowVideos = results.slice(0, 3);
            firstRowVideos.forEach(movie => {
                const videoCard = createVideoCard(movie);
                firstRowContainer.appendChild(videoCard);
            });

            // Carrega os shorts APÓS a primeira fileira
            await loadShortsForHomepage(true); // Passa 'true' para indicar que é uma nova carga

            // Adiciona o restante dos vídeos da primeira página ao container principal para o scroll
            const remainingVideos = results.slice(3);
            remainingVideos.forEach(movie => {
                const videoCard = createVideoCard(movie);
                container.appendChild(videoCard);
            });
        } else {
            // Para as páginas seguintes, apenas adiciona os vídeos ao container principal
            results.forEach(movie => {
                const videoCard = createVideoCard(movie);
                container.appendChild(videoCard);
            });
        }
        currentPage++; // Prepara para a próxima página
    }
  } catch (error) {
      console.error("Erro ao buscar filmes da API:", error);
  }

  isLoading = false; // Libera para o próximo carregamento
}

// Carrega os vídeos iniciais (removido activeEndpoint daqui, pois a função já o usa)
loadVideos();

// Scroll infinito (seu código original, agora chamando a nova loadVideos)
window.addEventListener("scroll", () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 50) {
    loadVideos();
  }
});

// Lógica para abrir/fechar o menu lateral
menuToggle.addEventListener('click', () => {
  document.body.classList.toggle('sidebar-collapsed');
});

// Lógica da barra de pesquisa
function handleSearch() {
    const query = searchInput.value.trim();
    if (query) {
        // Redireciona para a página de busca, passando o termo como parâmetro na URL
        window.location.href = `page/search.html?query=${encodeURIComponent(query)}`;
    }
}

searchButton.addEventListener('click', (event) => {
    // A função handleSearch agora decide o que fazer
    handleSearch();
});

searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') handleSearch();
});

mobileSearchIcon.addEventListener('click', () => {
    document.querySelector('.header').classList.add('search-active');
    searchInput.focus();
});

// Lógica para os botões de filtro
filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    // Remove a classe 'active' de todos os botões
    filterButtons.forEach(btn => btn.classList.remove('active'));
    // Adiciona a classe 'active' ao botão clicado
    button.classList.add('active');

    // Atualiza o endpoint ativo
    activeEndpoint = button.dataset.endpoint;
    activeMediaType = button.dataset.type; // Atualiza o tipo de mídia ativo

    // Limpa o container de vídeos, reseta a página e carrega os novos vídeos
    // Seleciona e remove apenas os cards de vídeo, preservando o sub-header
    const videoCards = container.querySelectorAll('.video');
    videoCards.forEach(card => card.remove());
    firstRowContainer.innerHTML = ''; // Limpa também a primeira fileira
    
    // Esconde e limpa a seção de shorts para ser recarregada
    shortsSection.style.display = 'none';
    shortsContainer.innerHTML = '';
    shortsCurrentPage = 1; // Reseta a paginação dos shorts também

    currentPage = 1; // Reseta a paginação
    window.scrollTo(0, 0); // Rola para o topo da página
    loadVideos(); // Carrega os vídeos e os shorts aleatórios da nova categoria
  });
});

// Lógica para os botões de navegação dos Shorts
shortsPrevBtn.addEventListener('click', () => {
    // Rola para a esquerda a largura de 3 cards
    const scrollAmount = shortsContainer.clientWidth * 0.75;
    shortsContainer.scrollLeft -= scrollAmount;
});
shortsNextBtn.addEventListener('click', () => {
    // Rola para a direita a largura de 3 cards
    const scrollAmount = shortsContainer.clientWidth * 0.75;
    shortsContainer.scrollLeft += scrollAmount;
});
