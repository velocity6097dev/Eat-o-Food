document.addEventListener('DOMContentLoaded', () => {
    // This script should be included on the welcome page where users select a table.
    const tableForm = document.getElementById('table-selection-form');
    const tableNumberInput = document.getElementById('table-number-input');
    const menuUrl = './menu.html'; // Adjust this path if your menu page is located elsewhere.
    const loader = document.getElementById('global-loader');
    const loaderMsg = document.getElementById('loader-msg');

    // Helper function to show the global loader with a message
    const showLoader = (message) => {
        if (loader && loaderMsg) {
            loaderMsg.textContent = message;
            loader.style.display = 'flex';
        }
    };

    // Check if a table number is already stored (e.g., user hit the back button).
    // If so, redirect them directly to the menu to avoid re-selecting a table.
    if (window.persistentStore && window.persistentStore.getItem('tableNumber')) {
        showLoader('Table already selected. Redirecting to menu...');
        setTimeout(() => {
            window.location.href = menuUrl;
        }, 1500); // A small delay to allow the user to read the message.
        return; // Stop further execution
    }

    // Ensure the form and input elements exist before adding listeners.
    if (!tableForm) {
        console.error('Error: The form with ID "table-selection-form" was not found in your HTML.');
        return;
    }
    if (!tableNumberInput) {
        console.error('Error: The input with ID "table-number-input" was not found in your HTML.');
        return;
    }

    tableForm.addEventListener('submit', (event) => {
        // ALWAYS prevent the default form submission behavior which causes a page reload.
        event.preventDefault();

        const tableNumber = tableNumberInput.value.trim();

        if (!tableNumber) {
            alert('Please enter a table number.');
            return;
        }

        if (!window.persistentStore) {
            console.error('Persistent store (store.js) is not available. Make sure it is loaded before welcome.js.');
            alert('An error occurred. Could not save table selection.');
            return;
        }

        showLoader(`Welcome, Table ${tableNumber}! Taking you to the menu...`);
        window.persistentStore.setItem('tableNumber', tableNumber);
        // Redirect to the menu page.
        window.location.href = menuUrl;
    });
});