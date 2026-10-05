const THEME_STORAGE_KEY = "restaurant_pos_theme";

const AVAILABLE_THEMES = [
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


/* ==========================================
   GET SAVED THEME
   ========================================== */

function getSavedTheme() {

    const savedTheme =
        localStorage.getItem(THEME_STORAGE_KEY);

    if (AVAILABLE_THEMES.includes(savedTheme)) {
        return savedTheme;
    }

    return "light-default";
}


/* ==========================================
   APPLY THEME
   ========================================== */

function applyTheme(theme) {

    if (!AVAILABLE_THEMES.includes(theme)) {
        theme = "light-default";
    }

    document.documentElement.setAttribute(
        "data-theme",
        theme
    );

    localStorage.setItem(
        THEME_STORAGE_KEY,
        theme
    );

    updateThemeSelection(theme);
}


/* ==========================================
   UPDATE RADIO SELECTION
   ========================================== */

function updateThemeSelection(theme) {

    document
        .querySelectorAll('input[name="theme"]')
        .forEach(input => {

            input.checked =
                input.value === theme;
        });
}


/* ==========================================
   THEME PAGE INITIALIZER
   ========================================== */

function initializeThemePage() {

    updateThemeSelection(
        getSavedTheme()
    );
}


/* ==========================================
   GLOBAL THEME LISTENER
   ========================================== */

function initializeThemeListener() {

    if (window.POSThemeListenerInitialized) {
        return;
    }

    document.addEventListener(
        "change",
        function (event) {

            const input = event.target;

            if (
                input.matches(
                    'input[name="theme"]'
                )
            ) {

                if (input.checked) {
                    applyTheme(input.value);
                }
            }
        }
    );

    window.POSThemeListenerInitialized = true;
}


/* ==========================================
   INITIALIZE SAVED THEME
   ========================================== */

function initializeSavedTheme() {

    document.documentElement.setAttribute(
        "data-theme",
        getSavedTheme()
    );
}


/* ==========================================
   PAGE INITIALIZER REGISTRATION
   ========================================== */

window.POSPageInitializers =
    window.POSPageInitializers || {};

window.POSPageInitializers[
    "js/settings/theme.js"
] = initializeThemePage;


/* ==========================================
   START
   ========================================== */

initializeSavedTheme();

initializeThemeListener();


/* ==========================================
   PUBLIC API
   ========================================== */

window.POSTheme = {

    get: getSavedTheme,

    set: applyTheme

};
