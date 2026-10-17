
/* =====================================================
   APPLICATION ROUTER
   Handles routes, navigation and browser history.
===================================================== */


/* =====================================================
   GET CURRENT ROUTE FROM URL
===================================================== */

function getRouteFromURL() {
    const route = new URLSearchParams(location.search).get("route");

    return route ? route.split("/").filter(Boolean) : ["billing"];
}


/* =====================================================
   FIND ROUTE CONFIGURATION
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
===================================================== */

function updateMainMenu(topLevelRoute) {
    document.querySelectorAll(".nav-btn").forEach(button => {
        const isActive = button.dataset.route === topLevelRoute;
        button.classList.toggle("active", isActive);
    });
}


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

    // Update global page information.
    window.setPageVariables(config);

    const routeString = parts.join("/");

    // Update URL and browser history.
    if (updateURL) {
        const url = new URL(location.href);

        url.searchParams.delete("tab");
        url.searchParams.set("route", routeString);

        history.pushState(
            { posRoute: routeString, posInternal: true },
            "",
            url
        );
    }

    updateMainMenu(parts[0]);

    const container = document.getElementById("page-container");
    if (!container) return;

    // Load the selected page and its configured scripts.
    await loadHTML(container, `html/pages/${config.page}.html`, {
        pageConfig: config
    });

    // Print variables into the newly loaded page.
    window.printAppVariables(container);
}


/* =====================================================
   CLICK HANDLING
===================================================== */

document.addEventListener("click", event => {

    // Application Back button.
    const backButton = event.target.closest("#app-back-button");

    if (backButton) {
        event.preventDefault();

        if (history.state?.posInternal) {
            history.back();
        } else {
            const parts = getRouteFromURL();

            navigateTo(
                parts.length > 1 ? parts.slice(0, -1) : ["billing"]
            );
        }

        return;
    }

    // Navigation links and buttons.
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
   INITIALIZE APPLICATION
===================================================== */

window.POSRouter = {
    navigate: navigateTo,
    getCurrentRoute: getRouteFromURL
};

navigateTo(getRouteFromURL(), false);
