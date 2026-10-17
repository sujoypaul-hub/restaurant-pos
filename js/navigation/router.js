
/* =====================================================
   APPLICATION ROUTER
   Handles routes, navigation, history and page information.
===================================================== */


/* =====================================================
   GET CURRENT ROUTE FROM URL
===================================================== */

function getRouteFromURL() {
    const route = new URLSearchParams(location.search).get("route");

    return route
        ? route.split("/").filter(Boolean)
        : ["billing"];
}


/* =====================================================
   FIND ROUTE CONFIGURATION
   Reads page information from pages.js.
===================================================== */

function findRoute(routeParts) {
    let routes = appRoutes;
    let config = null;

    for (const part of routeParts) {
        if (!routes[part]) return null;

        config = routes[part];
        routes = config.children || {};
    }

    return config;
}


/* =====================================================
   UPDATE LEFT MAIN MENU
   Highlights the active top-level navigation item.
===================================================== */

function updateMainMenu(topLevelRoute) {
    document.querySelectorAll(".nav-btn").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.route === topLevelRoute
        );
    });
}


/* =====================================================
   GLOBAL PAGE INFORMATION
   Available to scripts throughout the application.
===================================================== */

window.pageTitle = "";
window.pageDescription = "";


/* =====================================================
   NAVIGATE TO PAGE
===================================================== */

async function navigateTo(route, updateURL = true) {
    const parts = Array.isArray(route)
        ? route
        : route.split("/").filter(Boolean);

    const config = findRoute(parts);

    // Fall back to Billing if the route is invalid.
    if (!config) {
        return navigateTo(["billing"], false);
    }

    // Update global page information from pages.js.
    window.pageTitle = config.title || "";
    window.pageDescription = config.description || "";

    const routeString = parts.join("/");

    // Update the URL and browser history.
    if (updateURL) {
        const url = new URL(location.href);

        url.searchParams.delete("tab");
        url.searchParams.set("route", routeString);

        history.pushState(
            {
                posRoute: routeString,
                posInternal: true
            },
            "",
            url
        );
    }

    // Update the active item in the left main menu.
    updateMainMenu(parts[0]);

    // Find the main page content container.
    const container = document.getElementById("page-container");

    if (!container) return;

    await loadHTML(
    container,
    `html/pages/${config.page}.html`,
    {
        pageConfig: config
    }
);

// Update the header after the page and its components have loaded.
const title = document.querySelector(".page-title");
const description = document.querySelector(".page-description");

if (title) title.textContent = window.pageTitle;
if (description) description.textContent = window.pageDescription;
}


/* =====================================================
   GLOBAL CLICK HANDLING
   Supports dynamically loaded navigation elements.
===================================================== */

document.addEventListener("click", event => {

    // Application Back button.
    const backButton = event.target.closest("#app-back-button");

    if (backButton) {
        event.preventDefault();

        if (history.state?.posInternal) {
            history.back();
        } else {
            // Fall back to the parent route when possible.
            const parts = getRouteFromURL();

            navigateTo(
                parts.length > 1
                    ? parts.slice(0, -1)
                    : ["billing"]
            );
        }

        return;
    }

    // Main menu or other route navigation elements.
    const routeElement = event.target.closest("[data-route]");

    if (!routeElement) return;

    const route = routeElement.dataset.route;

    if (!route) return;

    if (routeElement.tagName === "A") {
        event.preventDefault();
    }

    navigateTo(route);
});


/* =====================================================
   BROWSER BACK / FORWARD
===================================================== */

window.addEventListener("popstate", () => {
    navigateTo(getRouteFromURL(), false);
});


/* =====================================================
   APPLICATION INITIALIZATION
===================================================== */

navigateTo(getRouteFromURL(), false);


/* =====================================================
   PUBLIC ROUTER API
===================================================== */

window.POSRouter = {
    navigate: navigateTo,
    getCurrentRoute: getRouteFromURL
};

window.addEventListener("pos:page-loaded", () => {
    const title = document.querySelector(".page-title");
    const description = document.querySelector(".page-description");

    if (title) title.textContent = window.pageTitle;
    if (description) description.textContent = window.pageDescription;
});
