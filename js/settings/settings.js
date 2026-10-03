/*
==================================================
SETTINGS
==================================================

Currently handles:

- Light theme
- Dark theme
- Theme persistence

The selected theme is stored locally in the
browser so it remains after refresh.

==================================================
*/


/*
==================================================
THEME
==================================================
*/

function setTheme(theme) {

    document.documentElement.dataset.theme =
        theme;


    /*
    Save user's preference.

    localStorage works even when the internet
    is unavailable.
    */

    localStorage.setItem(
        "restaurant_pos_theme",
        theme
    );


    updateThemeSwitch(theme);

}


/*
==================================================
GET SAVED THEME
==================================================
*/

function getSavedTheme() {

    return localStorage.getItem(
        "restaurant_pos_theme"
    ) || "light";

}


/*
==================================================
UPDATE SWITCH UI
==================================================
*/

function updateThemeSwitch(theme) {

    const toggle =
        document.getElementById(
            "theme-toggle"
        );

    const label =
        document.getElementById(
            "theme-label"
        );


    if (!toggle) {
        return;
    }


    toggle.checked =
        theme === "dark";


    if (label) {

        label.textContent =
            theme === "dark"
                ? "Dark Mode"
                : "Light Mode";

    }

}


/*
==================================================
INITIALIZE THEME
==================================================
*/

function initializeTheme() {

    const savedTheme =
        getSavedTheme();

    setTheme(savedTheme);


    const toggle =
        document.getElementById(
            "theme-toggle"
        );


    if (!toggle) {
        return;
    }


    toggle.addEventListener(
        "change",
        () => {

            setTheme(
                toggle.checked
                    ? "dark"
                    : "light"
            );

        }
    );

}


initializeTheme();
