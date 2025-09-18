import { getUserPlaylists, getWatchLaterVideos, getVideoList } from '../videoManager.js';

document.addEventListener('DOMContentLoaded', () => {
    const playlistNameEl = document.getElementById('playlist-name');
    const playlistDetailsEl = document.getElementById('playlist-details');
    const playlistThumbnailEl = document.querySelector('.playlist-thumbnail-placeholder');
    const playlistHeaderEl = document.querySelector('.playlist-header');
    const videoListContainer = document.getElementById('video-list-container');
    const imageBaseUrl = 'https://image.tmdb.org/t/p/w500';


    const getPlaylistId = () => new URLSearchParams(window.location.search).get('id');

    const getPlaylistData = (playlistId) => {
        if (playlistId === 'watch-later') {
            return { id: 'watch-later', name: 'Assistir mais tarde' };
        }
        const userPlaylists = getUserPlaylists();
        return userPlaylists.find(p => p.id === playlistId);
    };

    const getVideosFromPlaylist = (playlistId) => {
        if (playlistId === 'watch-later') {
            return getVideoList('watchLater');
        }
        return getVideoList(playlistId); 
    };

    const createVideoListCard = (video) => {
        const card = document.createElement('div');
        card.className = 'search-result-card'; 

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

  
    const createPlaylistCard = (playlist) => {
        const videos = getVideoList(playlist.id);
        const card = document.createElement('div');
        card.className = 'playlist-card'; 

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

   
    const displayAllPlaylists = () => {
        console.log('[playlist.js] Nenhum ID de playlist encontrado. Exibindo todas as playlists.');
        
        if (playlistHeaderEl) {
            playlistNameEl.textContent = 'Suas Playlists';
            playlistDetailsEl.textContent = 'Navegue e gerencie suas coleções de vídeos.';
            playlistThumbnailEl.textContent = '🗂️'; 
            playlistThumbnailEl.style.fontSize = '5rem'; 
        }
        document.title = 'Suas Playlists'; 
        
        videoListContainer.innerHTML = '';
        videoListContainer.className = 'playlist-grid'; 
        
        const userPlaylists = getUserPlaylists();
        if (userPlaylists.length > 0) {
            userPlaylists.forEach(playlist => {
                videoListContainer.appendChild(createPlaylistCard(playlist));
            });
        } else {
            videoListContainer.innerHTML = '<p style="grid-column: 1 / -1;">Você ainda não criou nenhuma playlist. Salve um vídeo em uma nova playlist para começar!</p>';
        }
    };

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

        playlistNameEl.textContent = playlistData.name;
        playlistDetailsEl.textContent = `${videos.length} vídeo${videos.length !== 1 ? 's' : ''}`;
        document.title = `Playlist: ${playlistData.name}`;

        if (videos.length > 0 && videos[0].backdrop_path) {
            playlistThumbnailEl.style.backgroundImage = `url('${imageBaseUrl}${videos[0].backdrop_path}')`;
        } else {
            playlistThumbnailEl.textContent = '▶';
        }

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
import "./layout.js"; 