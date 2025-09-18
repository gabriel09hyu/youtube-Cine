import { getUserPlaylists, getWatchLaterVideos, getVideoList } from '../videoManager.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- Seletores de Elementos ---
    const playlistNameEl = document.getElementById('playlist-name');
    const playlistDetailsEl = document.getElementById('playlist-details');
    const playlistThumbnailEl = document.querySelector('.playlist-thumbnail-placeholder');
    const playlistHeaderEl = document.querySelector('.playlist-header');
    const videoListContainer = document.getElementById('video-list-container');
    const imageBaseUrl = 'https://image.tmdb.org/t/p/w500';

    // --- Funções ---

    /**
     * Pega o ID da playlist da URL.
     */
    const getPlaylistId = () => new URLSearchParams(window.location.search).get('id');

    /**
     * Busca os dados de uma playlist específica.
     */
    const getPlaylistData = (playlistId) => {
        if (playlistId === 'watch-later') {
            return { id: 'watch-later', name: 'Assistir mais tarde' };
        }
        const userPlaylists = getUserPlaylists();
        return userPlaylists.find(p => p.id === playlistId);
    };

    /**
     * Busca os vídeos de uma playlist no sessionStorage.
     */
    const getVideosFromPlaylist = (playlistId) => {
        // Correção: A chave para "Assistir mais tarde" no videoManager é "watchLater" (sem hífen).
        if (playlistId === 'watch-later') {
            return getVideoList('watchLater');
        }
        return getVideoList(playlistId); // Para as outras playlists, o ID é a chave correta.
    };

    /**
     * Cria um card de vídeo para a lista.
     */
    const createVideoListCard = (video) => {
        const card = document.createElement('div');
        card.className = 'search-result-card'; // Reutilizando o estilo da busca

        const title = video.title || video.name;
        const releaseYear = new Date(video.release_date || video.first_air_date).getFullYear() || 'N/A';

        const thumbnailHtml = video.backdrop_path
            ? `<div class="thumbnail" style="background-image: url('${imageBaseUrl}${video.backdrop_path}'); background-color: transparent;"></div>`
            : '<div class="thumbnail"></div>';

        card.innerHTML = `
            ${thumbnailHtml}
            <div class="info">
                <h3 class="title">${title}</h3>
                <p class="meta">Nota: ${video.vote_average.toFixed(1)} • ${releaseYear}</p>
                <p class="description">${video.overview || 'Sem descrição.'}</p>
            </div>
        `;

        card.addEventListener('click', () => {
            const mediaType = video.media_type || (video.title ? 'movie' : 'tv');
            window.location.href = `video.html?id=${video.id}&type=${mediaType}`;
        });

        return card;
    };

    /**
     * Cria um card para exibir na lista de playlists.
     */
    const createPlaylistCard = (playlist) => {
        const videos = getVideoList(playlist.id);
        const card = document.createElement('div');
        card.className = 'playlist-card'; // Estilo novo, adicionado ao CSS

        const thumbnailPath = videos.length > 0 ? videos[0].backdrop_path : null;
        const thumbnailHtml = thumbnailPath
            ? `<div class="thumbnail" style="background-image: url('${imageBaseUrl}${thumbnailPath}'); background-color: transparent;"></div>`
            : '<div class="thumbnail">▶</div>';

        card.innerHTML = `
            ${thumbnailHtml}
            <div class="info">
                <h3 class="title">${playlist.name}</h3>
                <p class="meta">${videos.length} vídeo${videos.length !== 1 ? 's' : ''}</p>
            </div>
        `;

        card.addEventListener('click', () => {
            window.location.href = `playlist.html?id=${playlist.id}`;
        });

        return card;
    };

    /**
     * Exibe a lista de todas as playlists do usuário.
     */
    const displayAllPlaylists = () => {
        console.log('[playlist.js] Nenhum ID de playlist encontrado. Exibindo todas as playlists.');
        
        // Reutiliza o cabeçalho para a página principal de playlists
        if (playlistHeaderEl) {
            playlistNameEl.textContent = 'Suas Playlists';
            playlistDetailsEl.textContent = 'Navegue e gerencie suas coleções de vídeos.';
            playlistThumbnailEl.textContent = '🗂️'; // Ícone genérico para playlists
            playlistThumbnailEl.style.fontSize = '5rem'; // Garante o tamanho do ícone
        }
        document.title = 'Suas Playlists'; // Atualiza o título da aba
        
        videoListContainer.innerHTML = '';
        videoListContainer.className = 'playlist-grid'; // Muda o layout para grid
        
        const userPlaylists = getUserPlaylists();
        if (userPlaylists.length > 0) {
            userPlaylists.forEach(playlist => {
                videoListContainer.appendChild(createPlaylistCard(playlist));
            });
        } else {
            // Mensagem para quando não há playlists criadas
            videoListContainer.innerHTML = '<p style="grid-column: 1 / -1;">Você ainda não criou nenhuma playlist. Salve um vídeo em uma nova playlist para começar!</p>';
        }
    };

    // --- Execução Principal ---
    const init = () => {
        const playlistId = getPlaylistId();
        console.log(`[playlist.js] ID da playlist na URL: "${playlistId}"`);

        if (!playlistId) {
            displayAllPlaylists();
            return;
        }

        const playlistData = getPlaylistData(playlistId);
        if (!playlistData) {
            console.error(`[playlist.js] Playlist com ID "${playlistId}" não foi encontrada.`);
            playlistNameEl.textContent = 'Playlist não encontrada';
            return;
        }

        const videos = getVideosFromPlaylist(playlistId);
        console.log('[playlist.js] Vídeos encontrados para esta playlist:', videos);

        // Preenche o cabeçalho da playlist
        playlistNameEl.textContent = playlistData.name;
        playlistDetailsEl.textContent = `${videos.length} vídeo${videos.length !== 1 ? 's' : ''}`;
        document.title = `Playlist: ${playlistData.name}`;

        // Define a thumbnail da playlist (a imagem do primeiro vídeo)
        if (videos.length > 0 && videos[0].backdrop_path) {
            playlistThumbnailEl.style.backgroundImage = `url('${imageBaseUrl}${videos[0].backdrop_path}')`;
        } else {
            playlistThumbnailEl.textContent = '▶';
        }

        // Limpa e preenche a lista de vídeos
        videoListContainer.innerHTML = '';
        if (videos.length > 0) {
            videos.forEach(video => {
                const card = createVideoListCard(video);
                videoListContainer.appendChild(card);
            });
        } else {
            videoListContainer.innerHTML = '<p>Esta playlist ainda não tem vídeos.</p>';
        }
    };

    init();
});
import "./layout.js"; // Importa a lógica do menu e busca