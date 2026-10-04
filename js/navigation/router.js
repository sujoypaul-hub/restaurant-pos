/*
==================================================
APPLICATION ROUTER
==================================================

This file is the ROUTING ENGINE.

It handles:

- URL navigation
- Nested pages
- Sidebar active state
- Page titles
- Browser Back / Forward
- Initial page loading
- Internal page navigation

Page information comes from routes.js.

This file should NOT contain individual page
definitions or page-specific logic.

==================================================
*/


/*
==================================================
GET ROUTE FROM URL
==================================================
*/

function getRouteFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const route =
        params.get("route");


    /*
    No route means Billing.
    */

    if (!route) {

        return ["billing"];

    }


    return route
        .split("/")
        .filter(Boolean);

}


/*
==================================================
FIND ROUTE CONFIGURATION
==================================================
*/

function findRoute(routeParts) {

    let currentRoutes =
        appRoutes;

    let routeConfig =
        null;


    for (
        const part
        of routeParts
    ) {

        /*
        Route does not exist.
        */

        if (
            !currentRoutes[part]
        ) {

            return null;

        }


        /*
        Get current route.
        */

        routeConfig =
            currentRoutes[part];


        /*
        Move into child routes.
        */

        currentRoutes =
            routeConfig.children || {};

    }


    return routeConfig;

}


/*
==================================================
UPDATE SIDEBAR
==================================================
*/

function updateSidebar(
    topLevelRoute
) {

    const navButtons =
        document.querySelectorAll(
            ".nav-btn"
        );


    navButtons.forEach(
        button => {

            button.classList.toggle(
                "active",

                button.dataset.route ===
                topLevelRoute
            );

        }
    );

}


/*
==================================================
NAVIGATE
==================================================
*/

async function navigateTo(
    route,
    updateURL = true
) {

    /*
    Convert string route into array.
    */

    const routeParts =
        Array.isArray(route)
            ? route
            : route
                .split("/")
                .filter(Boolean);


    /*
    Find route configuration.
    */

    const routeConfig =
        findRoute(routeParts);


    /*
    ==============================================
    INVALID ROUTE
    ==============================================
    */

    if (!routeConfig) {

        navigateTo(
            ["billing"],
            false
        );

        return;

    }


    /*
    ==============================================
    UPDATE URL
    ==============================================
    */

    if (updateURL) {

        const url =
            new URL(
                window.location.href
            );


        /*
        Remove old tab-based URL.
        */

        url.searchParams.delete(
            "tab"
        );


        /*
        Set new route.
        */

        url.searchParams.set(
            "route",
            routeParts.join("/")
        );


        /*
        Add browser history entry.
        */

        history.pushState(
            {
                route:
                    routeParts.join("/")
            },
            "",
            url
        );

    }


    /*
    ==============================================
    UPDATE HEADER
    ==============================================
    */

    const pageTitle =
        document.getElementById(
            "page-title"
        );

    const pageDescription =
        document.getElementById(
            "page-description"
        );


    if (pageTitle) {

        pageTitle.textContent =
            routeConfig.title;

    }


    if (pageDescription) {

        pageDescription.textContent =
            routeConfig.description;

    }


    /*
    ==============================================
    UPDATE SIDEBAR
    ==============================================
    */

    updateSidebar(
        routeParts[0]
    );


    /*
    ==============================================
    LOAD PAGE
    ==============================================
    */

    await loadPage(
        routeConfig
    );

}


/*
==================================================
ALL ROUTE LINKS
==================================================

Every element that contains:

data-route="..."

automatically becomes a navigation link.

Examples:

data-route="settings"

data-route="settings/theme"

data-route="marketing/ad"

data-route="marketing/ad/social-media-ad"

data-route="marketing/ad/social-media-ad/instagram"

No individual click handler is required.

==================================================
*/

document.addEventListener(
    "click",
    event => {

        const routeElement =
            event.target.closest(
                "[data-route]"
            );


        /*
        Click was not on a route element.
        */

        if (!routeElement) {

            return;

        }


        const route =
            routeElement.dataset.route;


        /*
        No route specified.
        */

        if (!route) {

            return;

        }


        /*
        Prevent normal link behavior
        if this is an <a> element.
        */

        if (
            routeElement.tagName === "A"
        ) {

            event.preventDefault();

        }


        /*
        Navigate.
        */

        navigateTo(
            route
        );

    }
);


/*
==================================================
BROWSER BACK / FORWARD
==================================================
*/

window.addEventListener(
    "popstate",
    () => {

        navigateTo(
            getRouteFromURL(),
            false
        );

    }
);


/*
==================================================
UNIVERSAL APPLICATION BACK BUTTON
==================================================

The application has one universal Back button.

It uses the browser history, so it works with:

Settings → Theme
Marketing → AD
Marketing → AD → Social Media AD
etc.

Individual pages do not need their own
Back button.

==================================================
*/

function initializeAppBackButton() {

    const backButton =
        document.getElementById(
            "app-back-button"
        );


    if (!backButton) {

        return;

    }


    backButton.addEventListener(
        "click",
        () => {

            history.back();

        }
    );

}


/*
==================================================
INITIALIZE UNIVERSAL BACK BUTTON
==================================================
*/

initializeAppBackButton();


/*
==================================================
INITIAL APPLICATION ROUTE
==================================================
*/

navigateTo(
    getRouteFromURL(),
    false
);


/*
==================================================
PUBLIC ROUTER API
==================================================
*/

window.POSRouter = {

    navigate:
        navigateTo,

    getCurrentRoute:
        getRouteFromURL

};
