document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            document.body.classList.toggle('sidebar-collapsed');
        });
    }

    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');

    const handleSearch = () => {
        const query = searchInput.value.trim();
        if (query) {
            window.location.href = `search.html?query=${encodeURIComponent(query)}`;
        }
    };

    if (searchButton) searchButton.addEventListener('click', handleSearch);
    if (searchInput) searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') handleSearch();
    });

    const currentFile = window.location.pathname.split('/').pop();
    const currentQuery = window.location.search;
    const currentRelativeUrl = currentFile + currentQuery;

    const sidebarLinks = document.querySelectorAll('.sidebar a');
    sidebarLinks.forEach(link => {
        if (link.getAttribute('href') === currentRelativeUrl) {
            link.classList.add('active');
        }
    });
});