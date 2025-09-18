/**
 * layout.js
 *
 * Contém a lógica compartilhada entre as páginas, como o menu lateral e a barra de busca.
 * Importe este arquivo no final dos seus scripts de página (ex: historico.js, gostei.js, etc.).
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Lógica do Menu Lateral ---
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            document.body.classList.toggle('sidebar-collapsed');
        });
    }

    // --- Lógica da Barra de Busca ---
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');

    const handleSearch = () => {
        const query = searchInput.value.trim();
        if (query) {
            // Garante que o caminho para a página de busca está correto
            window.location.href = `search.html?query=${encodeURIComponent(query)}`;
        }
    };

    if (searchButton) searchButton.addEventListener('click', handleSearch);
    if (searchInput) searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') handleSearch();
    });

    // --- Lógica para Marcar Link Ativo na Sidebar ---
    // Pega o nome do arquivo (ex: "historico.html") e os parâmetros (ex: "?id=watch-later")
    const currentFile = window.location.pathname.split('/').pop();
    const currentQuery = window.location.search;
    const currentRelativeUrl = currentFile + currentQuery;

    const sidebarLinks = document.querySelectorAll('.sidebar a');
    sidebarLinks.forEach(link => {
        // Compara o href do link com a URL relativa completa da página atual.
        // Isso garante que "playlist.html" não seja confundido com "playlist.html?id=watch-later".
        if (link.getAttribute('href') === currentRelativeUrl) {
            link.classList.add('active');
        }
    });
});