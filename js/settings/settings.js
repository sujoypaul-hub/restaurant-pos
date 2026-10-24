
/* =====================================================
   GLOBAL APPLICATION SETTINGS
   Runs on every page.

   Responsibilities:
   - Apply and persist the selected theme
   - Handle theme changes from dynamically loaded UI
   - Handle application refresh
===================================================== */

(() => {
    "use strict";

    // Prevent duplicate global initialization.
    if (window.POSSettingsInitialized) return;
    window.POSSettingsInitialized = true;

    /* ==========================================
       THEME CONFIGURATION
    ========================================== */

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
        try {
            const saved = localStorage.getItem(THEME_STORAGE_KEY);

            return AVAILABLE_THEMES.includes(saved)
                ? saved
                : "light-default";
        } catch (error) {
            console.warn("Unable to read saved theme:", error);
            return "light-default";
        }
    }

    function updateThemeUI(theme) {
        document
            .querySelectorAll('input[name="theme"]')
            .forEach(input => {
                input.checked = input.value === theme;
            });

        const label = document.getElementById("theme-label");

        if (label) {
            label.textContent = theme;
        }
    }

    function setTheme(theme) {
        if (!AVAILABLE_THEMES.includes(theme)) {
            theme = "light-default";
        }

        document.documentElement.setAttribute("data-theme", theme);

        try {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch (error) {
            console.warn("Unable to save theme preference:", error);
        }

        updateThemeUI(theme);

        window.appVariables &&
            (window.appVariables.activeTheme = theme);

        return theme;
    }

    function initializeTheme() {
        const theme = getSavedTheme();

        document.documentElement.setAttribute("data-theme", theme);

        if (window.appVariables) {
            window.appVariables.activeTheme = theme;
        }

        updateThemeUI(theme);
    }

    // Delegate the event because Appearance controls may load later.
    document.addEventListener("change", event => {
        const input = event.target;

        if (
            input instanceof HTMLInputElement &&
            input.matches('input[name="theme"]') &&
            input.checked
        ) {
            setTheme(input.value);
        }
    });

    /* ==========================================
       APPLICATION REFRESH
    ========================================== */

    async function refreshApplication(button) {
        if (button?.disabled) return;

        const originalText = button?.textContent;

        if (button) {
            button.disabled = true;
            button.textContent = "Refreshing...";
        }

        try {
            // Preserve the current route, tab, and other URL parameters.
            const url = new URL(window.location.href);

            url.searchParams.set("refresh", Date.now().toString());

            // Replace the current history entry rather than adding one.
            window.location.replace(url.toString());
        } catch (error) {
            console.error("Unable to refresh application:", error);

            if (button) {
                button.disabled = false;
                button.textContent = originalText || "Refresh";
            }

            window.location.reload();
        }
    }

    // Delegate clicks so dynamically loaded Settings UI works too.
    document.addEventListener("click", event => {
        const button = event.target.closest(
            "#force-refresh-button, #force-refresh"
        );

        if (!button) return;

        event.preventDefault();
        refreshApplication(button);
    });

    /* ==========================================
       INITIALIZATION
    ========================================== */

    initializeTheme();

    /* ==========================================
       PUBLIC API
    ========================================== */

    window.POSSettings = {
        getTheme: getSavedTheme,
        setTheme,
        availableThemes: [...AVAILABLE_THEMES],
        refresh: () => refreshApplication()
    };

    // Temporary compatibility for existing theme.js callers.
    window.POSTheme = {
        get: getSavedTheme,
        set: setTheme
    };
})();
