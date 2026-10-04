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

function getSavedTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (AVAILABLE_THEMES.includes(savedTheme)) {
        return savedTheme;
    }

    return "light-default";
}

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

function updateThemeSelection(theme) {
    document
        .querySelectorAll('input[name="theme"]')
        .forEach(input => {
            input.checked = input.value === theme;
        });
}

function initializeThemePage() {

    const inputs =
        document.querySelectorAll(
            'input[name="theme"]'
        );

    if (!inputs.length) {
        return;
    }

    const currentTheme = getSavedTheme();

    updateThemeSelection(currentTheme);

    inputs.forEach(input => {

        input.addEventListener("change", function () {

            if (this.checked) {
                applyTheme(this.value);
            }

        });

    });
}

function initializeSavedTheme() {

    const theme = getSavedTheme();

    document.documentElement.setAttribute(
        "data-theme",
        theme
    );
}

initializeSavedTheme();
initializeThemePage();

window.POSTheme = {
    get: getSavedTheme,
    set: applyTheme
};
