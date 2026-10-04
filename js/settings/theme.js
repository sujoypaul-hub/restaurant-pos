/*
==================================================
RESTAURANT POS THEME MANAGER
==================================================

THEMES:

LIGHT
- light-default
- light-blue
- light-green
- light-red
- light-purple

DARK
- dark-default
- dark-blue
- dark-green
- dark-red
- dark-purple

==================================================
*/


const THEME_STORAGE_KEY =
    "restaurant_pos_theme";


const AVAILABLE_THEMES = [

    "light-default",
    "light-blue",
    "light-green",
    "light-red",
    "light-purple",

    "dark-default",
    "dark-blue",
    "dark-green",
    "dark-red",
    "dark-purple"

];


/*
==================================================
GET SAVED THEME
==================================================
*/

function getSavedTheme() {

    const savedTheme =
        localStorage.getItem(
            THEME_STORAGE_KEY
        );


    if (
        AVAILABLE_THEMES.includes(
            savedTheme
        )
    ) {

        return savedTheme;

    }


    return "light-default";

}


/*
==================================================
APPLY THEME
==================================================
*/

function applyTheme(theme) {

    if (
        !AVAILABLE_THEMES.includes(theme)
    ) {

        theme =
            "light-default";

    }


    document.documentElement.dataset.theme =
        theme;


    localStorage.setItem(
        THEME_STORAGE_KEY,
        theme
    );


    updateThemeSelection(
        theme
    );

}


/*
==================================================
UPDATE SELECTED THEME
==================================================
*/

function updateThemeSelection(theme) {

    const themeOptions =
        document.querySelectorAll(
            'input[name="theme"]'
        );


    themeOptions.forEach(
        option => {

            option.checked =
                option.value === theme;

        }
    );

}


/*
==================================================
INITIALIZE THEME PAGE
==================================================
*/

function initializeThemePage() {

    const themeOptions =
        document.querySelectorAll(
            'input[name="theme"]'
        );


    if (!themeOptions.length) {

        return;

    }


    const currentTheme =
        getSavedTheme();


    updateThemeSelection(
        currentTheme
    );


    themeOptions.forEach(
        option => {

            option.addEventListener(
                "change",
                () => {

                    applyTheme(
                        option.value
                    );

                }
            );

        }
    );

}


/*
==================================================
APPLY SAVED THEME ON APP START
==================================================
*/

function initializeSavedTheme() {

    const savedTheme =
        getSavedTheme();


    document.documentElement.dataset.theme =
        savedTheme;

}


/*
==================================================
START
==================================================
*/

initializeSavedTheme();

initializeThemePage();


/*
==================================================
PUBLIC THEME API
==================================================
*/

window.POSTheme = {

    get:
        getSavedTheme,

    set:
        applyTheme

};
