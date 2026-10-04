const THEME_STORAGE_KEY = "restaurant_pos_theme";

const AVAILABLE_THEMES = [
    // Light themes
    "light-default",
    "light-blue",
    "light-green",
    "light-red",
    "light-purple",
    "light-yellow",
    "light-orange",
    "light-pink",
    "light-gold",
    "light-brown",

    // Dark themes
    "dark-default",
    "dark-blue",
    "dark-green",
    "dark-red",
    "dark-purple",
    "dark-yellow",
    "dark-orange",
    "dark-pink",
    "dark-gold",
    "dark-brown"
];


// --------------------------------------------------
// Get saved theme
// --------------------------------------------------

function getSavedTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (savedTheme && AVAILABLE_THEMES.includes(savedTheme)) {
        return savedTheme;
    }

    return "light-default";
}


// --------------------------------------------------
// Apply theme
// --------------------------------------------------

function applyTheme(theme) {

    if (!AVAILABLE_THEMES.includes(theme)) {
        theme = "light-default";
    }

    document.documentElement.dataset.theme = theme;

    localStorage.setItem(
        THEME_STORAGE_KEY,
        theme
    );

    updateThemeSelection(theme);
}


// --------------------------------------------------
// Update radio selection
// --------------------------------------------------

function updateThemeSelection(theme) {

    const themeInputs =
        document.querySelectorAll(
            'input[name="theme"]'
        );

    themeInputs.forEach(input => {

        input.checked =
            input.value === theme;

    });
}


// --------------------------------------------------
// Initialize Theme page
// --------------------------------------------------

function initializeThemePage() {

    const themeInputs =
        document.querySelectorAll(
            'input[name="theme"]'
        );

    if (!themeInputs.length) {
        return;
    }

    const currentTheme =
        getSavedTheme();

    updateThemeSelection(
        currentTheme
    );

    themeInputs.forEach(input => {

        input.addEventListener(
            "change",
            () => {

                if (input.checked) {
                    applyTheme(
                        input.value
                    );
                }

            }
        );

    });
}


// --------------------------------------------------
// Initialize saved theme
// --------------------------------------------------

function initializeSavedTheme() {

    const savedTheme =
        getSavedTheme();

    document.documentElement.dataset.theme =
        savedTheme;
}


// --------------------------------------------------
// Start
// --------------------------------------------------

initializeSavedTheme();


// --------------------------------------------------
// Theme page initialization
// --------------------------------------------------

initializeThemePage();


// --------------------------------------------------
// Public API
// --------------------------------------------------

window.POSTheme = {

    get: getSavedTheme,

    set: applyTheme

};
