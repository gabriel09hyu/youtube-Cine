import { GoogleGenerativeAI } from "@google/generative-ai";
import { addVideoToLiked, addVideoToWatchLater, getUserPlaylists, createUserPlaylist, addVideoToPlaylist, removeVideoFromPlaylist, getVideoList } from "../videoManager.js";

// --- Configuração da API ---

    const apiKey = 'd62492ee51bbba141d7a8f0c7daa6e30';
    const imageBaseUrl = 'https://image.tmdb.org/t/p/w500'; // Para thumbnails
    const posterBaseUrl = 'https://image.tmdb.org/t/p/w780'; // Para o pôster
    const SHORTS_POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w342'; // Para posters dos shorts
    const backdropBaseUrl = 'https://image.tmdb.org/t/p/original'; // Para o fundo borrado

    const api = axios.create({
        baseURL: 'https://api.themoviedb.org/3/',
        params: { api_key: apiKey, language: 'pt-BR' }
    });

    // --- Seletores de Elementos do HTML ---
    const menuToggle = document.getElementById('menu-toggle');
    const searchInput = document.querySelector('.search-bar input');
    const searchButton = document.querySelector('.search-bar button');
    const mobileSearchIcon = document.querySelector('.mobile-search-icon');
    const fakePlayer = document.querySelector('.fake-player');
    const videoTitle = document.querySelector('.video-title');
    const videoMeta = document.querySelector('.video-meta .views');
    const videoDescription = document.querySelector('.video-description p');
    const recommendationsContainer = document.querySelector('.recommendations');
    const aiCommentsContainer = document.querySelector('.ai-comments-container');
    const commentInput = document.querySelector('.comment-input'); // Input de comentário
    const likeBtn = document.querySelector('.video-actions button:nth-child(1)');
    const dislikeBtn = document.querySelector('.video-actions button:nth-child(2)');
    const subscribeBtn = document.querySelector('.subscribe-btn');
    const saveBtn = document.querySelector('.save-btn');
    const saveMenu = document.querySelector('.save-playlist-menu');
    const newPlaylistBtn = document.querySelector('.new-playlist-btn');
    // Seletores do Modal
    const newPlaylistModal = document.getElementById('new-playlist-modal');
    const playlistNameInput = document.getElementById('playlist-name-input');
    const createPlaylistBtn = document.getElementById('create-playlist-btn');
    const cancelPlaylistBtn = document.getElementById('cancel-playlist-btn');

    let currentMediaDetails = null; // Variável para guardar os detalhes do vídeo/série atual

    // --- Funções ---

    // Pega o ID do filme da URL (ex: ?id=12345)
    const getMovieId = () => {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    };
    const getMediaType = () => new URLSearchParams(window.location.search).get('type') || 'movie';

    // Busca os detalhes de um filme específico
    const getMediaDetails = async (id, type) => {
        try {
            // Usa o endpoint dinâmico /movie/{id} ou /tv/{id}
            const { data } = await api.get(`/${type}/${id}`);
            return data;
        } catch (error) {
            console.error(`Erro ao buscar detalhes para type=${type}, id=${id}:`, error);
            return null;
        }
    };

    // Busca os filmes recomendados
    const getRecommendations = async (id, type) => {
        try {
            const { data } = await api.get(`/${type}/${id}/recommendations`);
            return data.results;
        } catch (error) {
            console.error("Erro ao buscar recomendações:", error);
            return [];
        }
    };

    // Preenche a página com os dados do filme
    const populateVideoDetails = (media) => {
        if (!media) return;

        // Pega o título e a data corretos para filme ou série
        const title = media.title || media.name;
        const releaseDateRaw = media.release_date || media.first_air_date;

        // Adiciona o backdrop como fundo borrado
        if (media.backdrop_path) {
            fakePlayer.style.backgroundImage = `url('${backdropBaseUrl}${media.backdrop_path}')`;
        }

        // Coloca o pôster no player (em cima do fundo)
        fakePlayer.innerHTML = media.poster_path
            ? `<img src="${posterBaseUrl}${media.poster_path}" alt="${title}">`
            : `Pôster não disponível`;

        // Preenche título, nota e descrição
        videoTitle.textContent = title;
        const releaseDate = new Date(releaseDateRaw).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
        videoMeta.textContent = `Nota: ${media.vote_average.toFixed(1)}/10 • Lançado em ${releaseDate}`;

        // --- Monta a nova descrição detalhada ---
        const genres = media.genres && media.genres.length > 0
            ? media.genres.map(g => g.name).join(', ')
            : 'Não informado';

        const companies = media.production_companies && media.production_companies.length > 0
            ? media.production_companies.map(c => c.name).join(', ')
            : 'Não informado';

        // Usamos innerHTML para formatar a descrição com mais detalhes
        videoDescription.parentElement.innerHTML = `
            <p>${media.overview || 'Nenhuma descrição disponível.'}</p>
            <br>
            <br>
            <br>
            <h4 style="margin-bottom: 10px;">Detalhes Adicionais</h4>
            <ul style="list-style-position: inside; padding-left: 5px; font-size: 14px; color: #ccc; line-height: 1.6;">
                <li><strong>Gêneros:</strong> ${genres}</li>
                <li><strong>Idioma Original:</strong> ${media.original_language ? media.original_language.toUpperCase() : 'N/A'}</li>
                <li><strong>Popularidade:</strong> ${media.popularity ? media.popularity.toFixed(2) : 'N/A'}</li>
                <li><strong>Avaliações:</strong> ${media.vote_count ? `${media.vote_count} votos` : 'N/A'}</li>
                <li><strong>Produzido por:</strong> ${companies}</li>
                <li><strong>Conteúdo Adulto:</strong> ${media.adult ? 'Sim' : 'Não'}</li>
                <br>
            </ul>
        `;
        // Guarda os detalhes do filme/série para uso posterior (ex: curtir)
        currentMediaDetails = media;

        generateAndDisplayComments(title);
    };

    // Gera um nome de usuário aleatório para os comentários
    const generateRandomUsername = () => {
        const adjectives = ['Cinefilo', 'AmanteDeFilmes', 'Critico', 'Pipoca', 'Tela', 'Maratonista'];
        const nouns = ['Amador', 'Expert', 'Curioso', 'Fanatico', 'Casual', 'Viciado'];
        const numbers = Math.floor(Math.random() * 1000);
        return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${numbers}`;
    };

    // Cria o card de comentário
    const createCommentCard = ({ username, text }) => {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment';
        const randomColor = `hsl(${Math.random() * 360}, 50%, 60%)`;

        commentDiv.innerHTML = `
            <div class="avatar" style="background-color: ${randomColor};">${username.charAt(0).toUpperCase()}</div>
            <div class="comment-content">
                <p class="username">@${username}</p>
                <p class="comment-text">${text}</p>
            </div>
        `;
        return commentDiv;
    };

    // Gera e exibe os comentários da IA
    const generateAndDisplayComments = async (movieTitle) => {
        if (!aiCommentsContainer) {
            console.error("Container para comentários de IA não encontrado. Adicione <div class='ai-comments-container'></div> ao seu HTML.");
            return;
        }
        aiCommentsContainer.innerHTML = '<h3 style="margin: 20px">Comentários da Comunidade (Gerados por IA)</h3><p>Gerando comentários...</p>';

        try {
            // ATENÇÃO: Mantenha sua chave de API segura e não a exponha no código do cliente em produção.
            const API_KEY = "AIzaSyBn8mLJXIaZgUX_NyOIkYqRXY9uGbL9LZI";
            const genAI = new GoogleGenerativeAI(API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompts = [
                `Gere um comentário para o filme "${movieTitle}". Aja como um fã super animado que acabou de assistir e adorou. O comentário deve ser informal, curto e direto, expressando pura empolgação. Não adicione seu nome de usuário no comentário.`,
                `Gere um comentário para o filme "${movieTitle}". Aja como um espectador que ficou um pouco decepcionado. Faça uma análise mais crítica, apontando poucos acertos e focando na parte que ele não gostou. O comentário deve ser informal, curto, direto e explicar brevemente o motivo da decepção sem ser agressivo. Não adicione seu nome de usuário no comentário.`,
                `Gere um comentário para o filme "${movieTitle}". Aja como um fã analisando um ponto específico, como a atuação de um ator, a fotografia ou a trilha sonora. O comentário deve ser informal e focado nesse detalhe. Não adicione seu nome de usuário no comentário.`,
                `Gere um comentário engraçado ou irônico sobre uma cena ou sobre o filme "${movieTitle}" como um todo. O tom deve ser leve, como um comentário rápido de internet. Não adicione seu nome de usuário no comentário.`,
                `Gere um comentário para o filme "${movieTitle}" que o compara com outro filme ou com o material original (livro, quadrinho, anime, mangá, etc.). O comentário deve ser casual e direto. Não adicione seu nome de usuário no comentário.`,
                `Gere um comentário para o filme "${movieTitle}" que termina com uma pergunta para engajar outros fãs na discussão (Ex: "Achei o final incrível, mas fiquei com uma dúvida..."). O comentário deve ser curto e informal. Não adicione seu nome de usuário no comentário.`
            ];

            const numberOfComments = Math.floor(Math.random() * 4) + 3; // Gera de 3 a 6 comentários
            const commentPromises = [];

            for (let i = 0; i < numberOfComments; i++) {
                const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
                commentPromises.push(model.generateContent(randomPrompt));
            }

            const results = await Promise.all(commentPromises);
            aiCommentsContainer.innerHTML = '<h3>Comentários da Comunidade (Gerados por IA)</h3>'; // Limpa o "carregando"
            results.forEach(result => {
                const commentCard = createCommentCard({ username: generateRandomUsername(), text: result.response.text() });
                aiCommentsContainer.appendChild(commentCard);
            });
        } catch (error) {
            console.error("Erro ao gerar comentários da IA:", error);
            showNotification('Os comentários não foram gerados');
            aiCommentsContainer.innerHTML = '<h3>Comentários da Comunidade (Gerados por IA)</h3><p>Não foi possível gerar os comentários da IA. Tente novamente mais tarde.</p>';
        }
    };

    // Cria um card de recomendação
    const createRecommendationCard = (media) => {
        const card = document.createElement('div');
        card.className = 'recommendation';
        const title = media.title || media.name;
        const releaseDate = media.release_date || media.first_air_date;

        card.innerHTML = `
            <div class="thumb"></div>
            <div class="rec-info">
                <p class="rec-title">${title}</p>
                <p class="rec-channel">Nota: ${media.vote_average.toFixed(1)}</p>
                <p class="rec-views">${new Date(releaseDate).getFullYear() || ''}</p>
            </div>`;
        
        const thumbDiv = card.querySelector('.thumb');
        if (media.backdrop_path) {
            // Correção Final: Força a propriedade correta para a imagem não esticar.
            // Garante que todas as propriedades do background sejam aplicadas para evitar que a imagem estique.
            thumbDiv.style.backgroundImage = `url('${imageBaseUrl}${media.backdrop_path}')`;
            thumbDiv.style.backgroundSize = 'cover';
            thumbDiv.style.backgroundPosition = 'center';
        }

        // Faz o card ser clicável para navegar para o novo filme
        card.addEventListener('click', () => {
            window.location.href = `video.html?id=${media.id}&type=${media.media_type || getMediaType()}`;
        });
        return card;
    };

    /**
     * Cria um card de "short" para a coluna de recomendações.
     */
    const createRecShortCard = (item) => {
        const shortCard = document.createElement('div');
        shortCard.className = 'rec-short-card';

        const title = item.title || item.name;
        const mediaType = item.media_type || (item.title ? 'movie' : 'tv');

        shortCard.innerHTML = `
            <img src="${SHORTS_POSTER_BASE_URL}${item.poster_path}" alt="${title}">
            <div class="short-title">${title}</div>
        `;

        shortCard.addEventListener('click', () => {
            addVideoToHistory(item);
            window.location.href = `video.html?id=${item.id}&type=${mediaType}`;
        });

        return shortCard;
    }

    /**
     * Carrega e exibe os shorts na coluna de recomendações.
     */
    const loadShortsForRecommendations = async () => {
        const shortsEndpoints = [
            api.get('/movie/popular', { params: { page: 1 } }),
            api.get('/tv/popular', { params: { page: 2 } }), // Página 2 para variar
            api.get('/trending/all/day', { params: { page: 1 } })
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

            const recShortsGrid = document.querySelector('.rec-shorts-grid');
            if (!recShortsGrid) return;

            shuffledResults.slice(0, 10).forEach(item => {
                recShortsGrid.appendChild(createRecShortCard(item));
            });

        } catch (error) {
            console.error("Erro ao buscar shorts para recomendações:", error);
            const shortsContainer = document.querySelector('.rec-shorts-container');
            if (shortsContainer) {
                shortsContainer.style.display = 'none';
            }
        }
    };


    // Adiciona as interações básicas nos botões
    const setupButtonInteractions = () => {
        if (likeBtn) {
            likeBtn.addEventListener('click', () => {
                likeBtn.style.backgroundColor = '#6d6d6d';
                if (dislikeBtn) dislikeBtn.style.backgroundColor = '#303030';
                if (currentMediaDetails) {
                    addVideoToLiked(currentMediaDetails);
                }

            });
        }

        if (dislikeBtn) {
            dislikeBtn.addEventListener('click', () => {
                dislikeBtn.style.backgroundColor = '#6d6d6d';
                if (likeBtn) likeBtn.style.backgroundColor = '#303030';
            });
        }

        if (subscribeBtn) {
            subscribeBtn.addEventListener('click', () => {
                subscribeBtn.classList.toggle('subscribed');
                if (subscribeBtn.classList.contains('subscribed')) {
                    subscribeBtn.textContent = 'Inscrito';
                    subscribeBtn.style.backgroundColor = '#555';
                } else {
                    subscribeBtn.textContent = 'Inscrever-se';
                    subscribeBtn.style.backgroundColor = 'red';
                }
            });
        }

        // Lógica para o botão Salvar
        if (saveBtn && saveMenu) {
            saveBtn.addEventListener('click', (event) => {
                event.stopPropagation(); // Impede que o clique feche o menu imediatamente
                saveMenu.classList.toggle('show');
                if (saveMenu.classList.contains('show')) {
                    loadUserPlaylists(); // Carrega as playlists quando o menu é aberto
                }
            });

            // Fecha o menu se clicar fora dele
            document.addEventListener('click', (event) => {
                if (!saveMenu.contains(event.target) && !saveBtn.contains(event.target)) {
                    saveMenu.classList.remove('show');
                }
            });

            // Lógica para o checkbox "Assistir mais tarde"
            const watchLaterCheckbox = saveMenu.querySelector('[data-playlist-id="watch-later"]');
            watchLaterCheckbox.addEventListener('change', () => {
                if (watchLaterCheckbox.checked) {
                    addVideoToWatchLater(currentMediaDetails);
                    showNotification('Adicionado a "Assistir mais tarde"');
                } else {
                    // A função para remover de "Assistir mais tarde" não existe no videoManager, então vamos usar a genérica
                    removeVideoFromPlaylist('watchLater', currentMediaDetails.id);
                    showNotification('Removido de "Assistir mais tarde"');
                }
            });

            // Lógica para o botão "+ Nova playlist"
            if (newPlaylistBtn) {
                newPlaylistBtn.addEventListener('click', () => {
                    saveMenu.classList.remove('show'); // Fecha o menu de salvar
                    newPlaylistModal.classList.add('show'); // Abre o modal
                    playlistNameInput.focus();
                });
            }

            // Lógica dos botões do Modal
            if (cancelPlaylistBtn) {
                cancelPlaylistBtn.addEventListener('click', () => {
                    newPlaylistModal.classList.remove('show');
                });
            }

            if (createPlaylistBtn) {
                createPlaylistBtn.addEventListener('click', () => {
                    const playlistName = playlistNameInput.value.trim();
                    if (playlistName) {
                        const newPlaylist = createUserPlaylist(playlistName);
                        
                        // Garante que 'currentMediaDetails' é válido antes de salvar
                        if (!currentMediaDetails) {
                            console.error("Erro: Detalhes do vídeo não estão disponíveis para salvar na playlist.");
                            return;
                        }

                        // Salva o vídeo na nova playlist
                        addVideoToPlaylist(newPlaylist.id, currentMediaDetails);

                        playlistNameInput.value = ''; // Limpa o input
                        newPlaylistModal.classList.remove('show'); // Fecha o modal

                        // Redireciona para a página da nova playlist
                        window.location.href = `playlist.html?id=${newPlaylist.id}`;
                    }
                });
            }
        }
    };

    // Função auxiliar para criar um item de lista de playlist
    const createPlaylistListItem = (playlist) => {
        const listItem = document.createElement('li');
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.dataset.playlistId = playlist.id;

        // Verifica se o vídeo atual já está nesta playlist
        if (currentMediaDetails) {
            const videosInPlaylist = getVideoList(playlist.id);
            const isVideoInPlaylist = videosInPlaylist.some(v => v.id === currentMediaDetails.id);
            if (isVideoInPlaylist) {
                checkbox.checked = true;
            }
        }

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(` ${playlist.name}`));
        listItem.appendChild(label);

        // Adiciona o evento de salvar/remover
        checkbox.addEventListener('change', () => {
            if (!currentMediaDetails) return; // Segurança
            if (checkbox.checked) {
                addVideoToPlaylist(playlist.id, currentMediaDetails);
                showNotification(`Salvo em "${playlist.name}"`);
            } else {
                removeVideoFromPlaylist(playlist.id, currentMediaDetails.id);
                showNotification(`Removido de "${playlist.name}"`);
            }
        });

        return listItem;
    };

    // Função para carregar as playlists do usuário no menu
    const loadUserPlaylists = () => {
        if (!saveMenu) return;
        const playlistList = saveMenu.querySelector('.playlist-list');
        // Limpa apenas as playlists customizadas, mantendo "Assistir mais tarde"
        playlistList.querySelectorAll('li:not(:first-child)').forEach(li => li.remove());

        // Verifica e marca "Assistir mais tarde" se o vídeo já estiver lá
        if (currentMediaDetails) {
            const watchLaterVideos = getVideoList('watchLater');
            const isVideoInWatchLater = watchLaterVideos.some(v => v.id === currentMediaDetails.id);
            const watchLaterCheckbox = playlistList.querySelector('[data-playlist-id="watch-later"]');
            if (watchLaterCheckbox) watchLaterCheckbox.checked = isVideoInWatchLater;
        }

        const userPlaylists = getUserPlaylists();
        userPlaylists.forEach(playlist => {
            const listItem = createPlaylistListItem(playlist);
            playlistList.appendChild(listItem);
        });
    };

    // Função para criar um card de comentário do usuário
    const createUserCommentCard = (text) => {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment user-comment'; // Adiciona classe 'user-comment'
        const username = 'Você'; // Nome de usuário fixo para o usuário
        const randomColor = `hsl(${Math.random() * 360}, 50%, 60%)`; // Cor aleatória

        commentDiv.innerHTML = `
            <div class="avatar" style="background-color: ${randomColor};">${username.charAt(0).toUpperCase()}</div>
            <div class="comment-content">
                <p class="username">@${username}</p>
                <p class="comment-text">${text}</p>
            </div>
        `;
        return commentDiv;
    };

    // Função para criar um card de resposta da IA
    const createAiResponseCard = (text) => {
        const responseDiv = document.createElement('div');
        responseDiv.className = 'comment ai-response'; // Adiciona classe 'ai-response'
        const username = 'IA'; // Nome de usuário fixo para a IA
        const randomColor = `hsl(${Math.random() * 360}, 50%, 60%)`; // Cor aleatória

        responseDiv.innerHTML = `
            <div class="avatar" style="background-color: ${randomColor};">${username.charAt(0).toUpperCase()}</div>
            <div class="comment-content">
                <p class="username">@${username}</p>
                <p class="comment-text">${text}</p>
            </div>
        `;
        return responseDiv;
    };

    // Função para exibir a notificação no topo
    const showNotification = (message) => {
        const notificationDiv = document.createElement('div');
        notificationDiv.className = 'notification';
        notificationDiv.textContent = message;
        document.body.appendChild(notificationDiv);

        // Remove a notificação após alguns segundos
        setTimeout(() => {
            notificationDiv.remove();
        }, 5000); // 5 segundos
    };

    // Lógica para adicionar o comentário do usuário e a resposta da IA
    if (commentInput) {
        commentInput.addEventListener('keydown', async (event) => {
            if (event.key === 'Enter') {
                event.preventDefault(); // Evita que o formulário seja enviado
                const commentText = commentInput.value.trim();
                if (commentText) {
                    // Adiciona o comentário do usuário na interface
                    const userCommentCard = createUserCommentCard(commentText);
                    // Adiciona o comentário do usuário no topo da lista (depois do título)
                    if (aiCommentsContainer) {
                        const titleElement = aiCommentsContainer.querySelector('h3');
                        titleElement.insertAdjacentElement('afterend', userCommentCard);
                    }
                    commentInput.value = ''; // Limpa o input

                    // Simula um atraso para a resposta da IA
                    setTimeout(async () => {
                        const aiResponse = await generateAiResponse(commentText);
                        showNotification('A IA respondeu ao seu comentário!');
                        if (aiCommentsContainer) {
                            // Insere a resposta da IA logo após o comentário do usuário
                            userCommentCard.insertAdjacentElement('afterend', createAiResponseCard(aiResponse));
                        }
                    }, 3000); // 3 segundos de atraso
                }
            }
        });
    }
    // Lógica para abrir/fechar o menu lateral
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            document.body.classList.toggle('sidebar-collapsed');
        });
    }

    // Lógica da barra de pesquisa
    const handleSearch = () => {
        const header = document.querySelector('.header');
        const query = searchInput.value.trim();

        // Em telas móveis, se a busca estiver ativa E o campo estiver VAZIO, o botão funciona como "voltar".
        if (window.innerWidth <= 768 && header.classList.contains('search-active') && !query) {
            header.classList.remove('search-active');
            event.preventDefault(); // Previne qualquer outra ação
            return; // Para a execução aqui para não pesquisar
        }

        // Se houver texto, executa a busca
        if (query) {
            // O caminho para a página de busca é relativo ao diretório 'page'
            window.location.href = `search.html?query=${encodeURIComponent(query)}`;
        }
    };

    searchButton.addEventListener('click', handleSearch); // O evento já é passado para a função
    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') handleSearch();
    });

    // Lógica para a busca em telas móveis
    if (mobileSearchIcon) {
        const header = document.querySelector('.header');
        mobileSearchIcon.addEventListener('click', () => {
            header.classList.add('search-active');
            searchInput.focus(); // Foca no input de busca
        });

    }

    const generateAiResponse = async (userComment) => {
      const API_KEY = "AIzaSyBn8mLJXIaZgUX_NyOIkYqRXY9uGbL9LZI";
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // 1. Construir um contexto detalhado sobre o filme/série atual
      let mediaContext = "Contexto sobre a obra sendo discutida:\n";
      if (currentMediaDetails) {
          mediaContext += `- Título: ${currentMediaDetails.title || currentMediaDetails.name}\n`;
          mediaContext += `- Sinopse: ${currentMediaDetails.overview}\n`;
          mediaContext += `- Gêneros: ${currentMediaDetails.genres.map(g => g.name).join(', ')}\n`;
          mediaContext += `- Nota Média: ${currentMediaDetails.vote_average.toFixed(1)}/10\n`;
      }

      // 2. Criar um prompt com instruções claras e o contexto
      const prompt = `
        ${mediaContext}

        Você é um participante de uma discussão online sobre filmes e séries. Sua tarefa é responder ao comentário de um usuário.
        Siga estas regras estritamente:
        1.  **Seja Conciso e Preciso:** Responda diretamente ao ponto do usuário.
        2.  **Não Faça Perguntas:** Forneça respostas, não mais perguntas.
        3.  **Use o Contexto:** Se a resposta puder ser enriquecida com os detalhes da obra (título, sinopse, etc.), use-os.
        4.  **Seja Direto:** Evite frases como "Isso é uma ótima pergunta!" ou "Interessante seu ponto de vista...". Vá direto para a resposta.
        5.  **Mantenha o Tom Informal:** A resposta deve soar como um comentário de um fórum, não de um robô.
        6. **Forneça respostas precisas, como alguém que viu o filme, não dê respostas genéricas. Formule uma opinião própria

        Comentário do usuário: "${userComment}"

        Sua resposta:
      `;

      const result = await model.generateContent(prompt);

      return result.response.text();
    }

    // --- Execução Principal ---
    const init = async () => {
        const movieId = getMovieId();
        const mediaType = getMediaType();
        if (!movieId) return;

        const mediaDetails = await getMediaDetails(movieId, mediaType);
        populateVideoDetails(mediaDetails);

        const recommendedMedia = await getRecommendations(movieId, mediaType);
        // Limpa apenas os vídeos estáticos e seções de shorts, preservando o título
        recommendationsContainer.querySelectorAll('.recommendation, .rec-shorts-container').forEach(el => el.remove());


        // Adiciona os 2 primeiros vídeos recomendados
        recommendedMedia.slice(0, 2).forEach(media => {
            recommendationsContainer.appendChild(createRecommendationCard(media));
        });

        // Cria e injeta a seção de Shorts
        const shortsSectionHtml = `
            <div class="rec-shorts-container">
                <h3>Shorts</h3>
                <div class="rec-shorts-wrapper">
                    <button class="rec-shorts-nav-btn prev">‹</button>
                    <div class="rec-shorts-grid"></div>
                    <button class="rec-shorts-nav-btn next">›</button>
                </div>
            </div>
        `;
        recommendationsContainer.insertAdjacentHTML('beforeend', shortsSectionHtml);

        // Adiciona o restante das recomendações
        recommendedMedia.slice(2, 15).forEach(media => {
            recommendationsContainer.appendChild(createRecommendationCard(media));
        });

        // Carrega o conteúdo dos shorts e adiciona a lógica dos botões
        await loadShortsForRecommendations();
        const shortsGrid = recommendationsContainer.querySelector('.rec-shorts-grid');
        recommendationsContainer.querySelector('.rec-shorts-nav-btn.prev').addEventListener('click', () => { shortsGrid.scrollLeft -= shortsGrid.clientWidth; });
        recommendationsContainer.querySelector('.rec-shorts-nav-btn.next').addEventListener('click', () => { shortsGrid.scrollLeft += shortsGrid.clientWidth; });

        setupButtonInteractions();
        loadUserPlaylists(); // Carrega as playlists do usuário no início
    };

    init();