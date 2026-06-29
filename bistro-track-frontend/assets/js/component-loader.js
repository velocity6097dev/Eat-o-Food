document.addEventListener('DOMContentLoaded', () => {
    /**
     * This path assumes the loader is used by html files in views/client/.
     * For example, from /views/client/index.html, it will look for components
     * in /views/client/components/
     */
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
                        // Execute any scripts within the loaded HTML.
                        // Using eval() is insecure, so we create and replace script elements to execute them.
                        const scripts = placeholder.getElementsByTagName('script');
                        Array.from(scripts).forEach(oldScript => {
                            const newScript = document.createElement('script');
                            newScript.textContent = oldScript.textContent;
                            oldScript.parentNode.replaceChild(newScript, oldScript);
                        });

                        if (window.lucide) {
                            window.lucide.createIcons();
                        }
                    }
                })
                .catch(error => console.error(`Error fetching ${filePath}:`, error));
        }
    };

    // Do not load header/footer on pages that have the 'no-chrome' class on the body.
    // This will be used for the welcome screen.
    if (!document.body.classList.contains('no-chrome')) {
        loadComponent('header-placeholder', 'header.html');
        loadComponent('footer-placeholder', 'footer.html');
    }
    loadComponent('toast-placeholder', 'toast.html');
});
