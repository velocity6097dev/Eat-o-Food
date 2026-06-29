document.addEventListener('DOMContentLoaded', () => {
    // This path assumes the loader is used by html files in views/client/
    const componentBasePath = './components/';

    const loadComponent = (placeholderId, filePath) => {
        const placeholder = document.getElementById(placeholderId);
        if (placeholder) {
            fetch(componentBasePath + filePath)
                .then(response => {
                    if (!response.ok) {
                        console.error(`Failed to load ${filePath}: ${response.statusText}`);
                        return;
                    }
                    return response.text();
                })
                .then(data => {
                    if (data) {
                        placeholder.innerHTML = data;
                        // Execute any scripts within the loaded HTML
                        const scripts = placeholder.getElementsByTagName('script');
                        for (let i = 0; i < scripts.length; i++) {
                            eval(scripts[i].innerText);
                        }
                        if (window.lucide) {
                            window.lucide.createIcons();
                        }
                    }
                })
                .catch(error => console.error(`Error fetching ${filePath}:`, error));
        }
    };

    loadComponent('header-placeholder', 'header.html');
    loadComponent('footer-placeholder', 'footer.html');
    loadComponent('toast-placeholder', 'toast.html');
});
