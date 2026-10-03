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

/*
==================================================
FORCE REFRESH
==================================================

This refresh system:

1. Clears Cache Storage
2. Removes old Service Workers
3. Keeps the current tab
4. Adds a cache-busting URL parameter
5. Reloads the application

It does NOT erase:
- Theme preference
- Customer data
- Orders
- Products
- Local application data

==================================================
*/


/*
==================================================
CLEAR CACHE STORAGE
==================================================
*/

async function clearAppCaches() {

    if (!("caches" in window)) {

        return;

    }


    try {

        const cacheNames =
            await caches.keys();


        await Promise.all(

            cacheNames.map(
                cacheName =>
                    caches.delete(
                        cacheName
                    )
            )

        );

    } catch (error) {

        console.warn(
            "Unable to clear Cache Storage:",
            error
        );

    }

}


/*
==================================================
REMOVE SERVICE WORKERS
==================================================

We are not using an offline service worker yet,
but this makes the refresh button ready for
the offline system we will add later.
==================================================
*/

async function removeServiceWorkers() {

    if (!("serviceWorker" in navigator)) {

        return;

    }


    try {

        const registrations =
            await navigator
                .serviceWorker
                .getRegistrations();


        await Promise.all(

            registrations.map(
                registration =>
                    registration.unregister()
            )

        );

    } catch (error) {

        console.warn(
            "Unable to remove Service Workers:",
            error
        );

    }

}


/*
==================================================
FORCE REFRESH APPLICATION
==================================================
*/

async function forceRefreshApplication() {

    const button =
        document.getElementById(
            "force-refresh"
        );


    /*
    Prevent multiple clicks.
    */

    if (button) {

        button.disabled = true;

        button.textContent =
            "Refreshing...";

    }


    /*
    Remember current URL.

    This preserves:

    ?tab=billing
    ?tab=orders
    ?tab=marketing

    etc.
    */

    const url =
        new URL(
            window.location.href
        );


    /*
    Clear application caches.
    */

    await clearAppCaches();


    /*
    Remove service workers.
    */

    await removeServiceWorkers();


    /*
    Add a unique refresh value.

    Example:

    ?tab=marketing&refresh=1791041234567

    Every click creates a new URL, making the
    browser request a fresh document.
    */

    url.searchParams.set(
        "refresh",
        Date.now().toString()
    );


    /*
    Replace the current history entry.

    We don't want every refresh click to create
    another browser-history entry.
    */

    window.location.replace(
        url.toString()
    );

}


/*
==================================================
INITIALIZE FORCE REFRESH BUTTON
==================================================
*/

function initializeForceRefresh() {

    const button =
        document.getElementById(
            "force-refresh"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        forceRefreshApplication
    );

}


initializeForceRefresh();
