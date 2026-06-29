//
// Desc: This file contains the logic for storing and retrieving data from local storage.
//

const STORE_KEY = 'bistro-track-state';

/**
 * Retrieves the entire state from local storage.
 * @returns {object} The state object or an empty object if not found.
 */
const getFullStore = () => {
    try {
        const rawState = localStorage.getItem(STORE_KEY);
        return rawState ? JSON.parse(rawState) : {};
    } catch (e) {
        console.error('Failed to parse state from local storage', e);
        return {};
    }
};

/**
 * Saves the entire state to local storage.
 * @param {object} state The state object to save.
 */
const saveFullStore = (state) => {
    try {
        localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error('Failed to save state to local storage', e);
    }
};

/**
 * Gets a specific value from the store by key.
 * @param {string} key The key of the item to retrieve.
 * @returns {*} The value of the item or null if not found.
 */
const getItem = (key) => {
    const state = getFullStore();
    return key in state ? state[key] : null;
};

/**
 * Sets a specific value in the store by key.
 * @param {string} key The key of the item to set.
 * @param {*} value The value to set.
 */
const setItem = (key, value) => {
    const state = getFullStore();
    state[key] = value;
    saveFullStore(state);
};

/**
 * Removes a specific value from the store by key.
 * @param {string} key The key of the item to remove.
 */
const removeItem = (key) => {
    const state = getFullStore();
    if (key in state) {
        delete state[key];
        saveFullStore(state);
    }
};

/**
 * Clears the entire store.
 */
const clearStore = () => {
    localStorage.removeItem(STORE_KEY);
};

// Expose the store to the global window object
window.persistentStore = {
    getFullStore,
    saveFullStore,
    getItem,
    setItem,
    removeItem,
    clearStore,
};
