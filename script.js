import { addVideoToHistory } from './videoManager.js';
import { TMDB_API_KEY } from './config.js';

const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w342'; 
let activeMediaType = 'movie'; 
const container = document.getElementById("video-container");
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


function createVideoCard(item, options = { addToHistoryOnClick: true, basePath: 'page/' }) {
  const { addToHistoryOnClick, basePath } = options;

  const video = document.createElement("div");
  video.classList.add("video");

  const title = item.title || item.name;
  const releaseDate = item.release_date || item.first_air_date;

  video.innerHTML = `
    <div class="thumbnail"></div>
    <div class="title">${title}</div>
    <div class="channel">Lançamento: ${releaseDate}</div>
  `;

  const thumbnailDiv = video.querySelector('.thumbnail');
  if (item.backdrop_path) {
    thumbnailDiv.style.background = `url('${imageBaseUrl}${item.backdrop_path}') center / cover no-repeat`;
  }

  if (addToHistoryOnClick) {
    video.addEventListener('click', () => {
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
        addVideoToHistory(item);
        window.location.href = `page/video.html?id=${item.id}&type=${mediaType}`;
    });

    return shortCard;
}

const api = axios.create({
    baseURL: 'https://api.themoviedb.org/3/',
    params: {
        api_key: TMDB_API_KEY,
        language: 'pt-BR',
    }
})

let currentPage = 1;
let isLoading = false;
let activeEndpoint = '/movie/popular'; 
let shortsCurrentPage = 1;
let isShortsLoading = false;

async function loadShortsForHomepage(isNewCategory = false) {
    if (isShortsLoading) return;
    isShortsLoading = true;

    if (isNewCategory) {
        shortsContainer.innerHTML = '';
        shortsCurrentPage = 1;
    }

    if (!isNewCategory) return;

    const shortsEndpoints = [
        api.get('/movie/popular', { params: { page: 1 } }),
        api.get('/tv/popular', { params: { page: 1 } }),
        api.get('/trending/all/week', { params: { page: 1 } }),
        api.get('/movie/top_rated', { params: { page: 1 } })
    ];

    try {
        const responses = await Promise.all(shortsEndpoints);

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

        const shuffledResults = allResults.sort(() => 0.5 - Math.random());

        shuffledResults.slice(0, 20).forEach(item => { 
            const shortCard = createHomepageShortCard(item);
            shortsContainer.appendChild(shortCard);
        });

        if (shuffledResults.length > 0) {
            shortsSection.style.display = 'block'; 
        }
    } catch (error) {
        console.error("Erro ao buscar shorts para a página inicial:", error);
        shortsSection.style.display = 'none'; 
    } finally {
        isShortsLoading = false;
    }
}

async function loadVideos() {
  if (isLoading) return; 
  isLoading = true;
  console.log(`Carregando página ${currentPage} de ${activeEndpoint}`);

  try {
    const { data: { results } } = await api.get(activeEndpoint, {
        params: { page: currentPage }
    });

    if (results.length > 0) {
        if (currentPage === 1) {
            const firstRowVideos = results.slice(0, 3);
            firstRowVideos.forEach(movie => {
                const videoCard = createVideoCard(movie);
                firstRowContainer.appendChild(videoCard);
            });

            await loadShortsForHomepage(true); 

            const remainingVideos = results.slice(3);
            remainingVideos.forEach(movie => {
                const videoCard = createVideoCard(movie);
                container.appendChild(videoCard);
            });
        } else {
            results.forEach(movie => {
                const videoCard = createVideoCard(movie);
                container.appendChild(videoCard);
            });
        }
        currentPage++; 
    }
  } catch (error) {
      console.error("Erro ao buscar filmes da API:", error);
  }

  isLoading = false; 
}

loadVideos();

window.addEventListener("scroll", () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 50) {
    loadVideos();
  }
});

menuToggle.addEventListener('click', () => {
  document.body.classList.toggle('sidebar-collapsed');
});

function handleSearch() {
    const query = searchInput.value.trim();
    if (query) {
        window.location.href = `page/search.html?query=${encodeURIComponent(query)}`;
    }
}

searchButton.addEventListener('click', (event) => {
    handleSearch();
});

searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') handleSearch();
});

mobileSearchIcon.addEventListener('click', () => {
    document.querySelector('.header').classList.add('search-active');
    searchInput.focus();
});

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    filterButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    activeEndpoint = button.dataset.endpoint;
    activeMediaType = button.dataset.type; 

    const videoCards = container.querySelectorAll('.video');
    videoCards.forEach(card => card.remove());
    firstRowContainer.innerHTML = ''; 
    
    shortsSection.style.display = 'none';
    shortsContainer.innerHTML = '';
    shortsCurrentPage = 1; 

    currentPage = 1; 
    window.scrollTo(0, 0); 
    loadVideos(); 
  });
});

shortsPrevBtn.addEventListener('click', () => {
    const scrollAmount = shortsContainer.clientWidth * 0.75;
    shortsContainer.scrollLeft -= scrollAmount;
});
shortsNextBtn.addEventListener('click', () => {
    const scrollAmount = shortsContainer.clientWidth * 0.75;
    shortsContainer.scrollLeft += scrollAmount;
});
