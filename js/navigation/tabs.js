/*
==================================================
APPLICATION ROUTER
==================================================

This file handles:

- URL navigation
- Nested pages
- Sidebar active state
- Page titles
- Browser Back / Forward
- Initial page loading

Page information comes from routes.js.

DO NOT add individual page logic here.

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

    let routeConfig = null;


    for (
        const part
        of routeParts
    ) {

        if (
            !currentRoutes[part]
        ) {

            return null;

        }


        routeConfig =
            currentRoutes[part];


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

                button.dataset.tab ===
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
    Convert string to array if necessary.
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
    Invalid route.
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
        Remove old routing system.
        */

        url.searchParams.delete(
            "tab"
        );


        /*
        Add new route.
        */

        url.searchParams.set(
            "route",
            routeParts.join("/")
        );


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


    pageTitle.textContent =
        routeConfig.title;


    pageDescription.textContent =
        routeConfig.description;


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
SIDEBAR CLICK EVENTS
==================================================
*/

const navButtons =
    document.querySelectorAll(
        ".nav-btn"
    );


navButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                const route =
                    button.dataset.tab;


                navigateTo(
                    route
                );

            }
        );

    }
);


/*
==================================================
INTERNAL ROUTE LINKS
==================================================
*/

document.addEventListener(
    "click",
    event => {

        const routeElement =
            event.target.closest(
                "[data-route]"
            );

        if (!routeElement) {
            return;
        }


        const route =
            routeElement.dataset.route;


        if (!route) {
            return;
        }


        navigateTo(route);

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
INITIAL LOAD
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
