
/* =====================================================
   APPLICATION ROUTER
   Handles routes, navigation, history and Back button.
===================================================== */

function getRouteFromURL() {
    const route = new URLSearchParams(location.search).get("route");
    return route ? route.split("/").filter(Boolean) : ["billing"];
}

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

function updateSidebar(topLevelRoute) {
    document.querySelectorAll(".nav-btn").forEach(button => {
        button.classList.toggle("active", button.dataset.route === topLevelRoute);
    });
}

// Global information about the currently active page.
window.pageTitle = "";
window.pageDescription = "";

async function navigateTo(route, updateURL = true) {
    const parts = Array.isArray(route) ? route : route.split("/").filter(Boolean);
    const config = findRoute(parts);
   
   // Update global page information from pages.js.
   window.pageTitle = config.title || "";
   window.pageDescription = config.description || "";

    if (!config) {
        return navigateTo(["billing"], false);
    }

    const routeString = parts.join("/");

    if (updateURL) {
        const url = new URL(location.href);
        url.searchParams.delete("tab");
        url.searchParams.set("route", routeString);
        history.pushState({ posRoute: routeString, posInternal: true }, "", url);
    }


    updateSidebar(parts[0]);

    const container = document.getElementById("page-container");
    if (!container) return;

    await loadHTML(container, `html/pages/${config.page}.html`, {
        pageConfig: config
    });
}

// Delegated click handling also works for dynamically loaded elements.
document.addEventListener("click", event => {
    const backButton = event.target.closest("#app-back-button");

    if (backButton) {
        event.preventDefault();

        // Use browser history when this route was added by our router.
        if (history.state?.posInternal) {
            history.back();
        } else {
            // Useful fallback when the app was opened directly on a nested route.
            const parts = getRouteFromURL();

            navigateTo(parts.length > 1 ? parts.slice(0, -1) : ["billing"]);
        }

        return;
    }

    const routeElement = event.target.closest("[data-route]");
    if (!routeElement) return;

    const route = routeElement.dataset.route;
    if (!route) return;

    if (routeElement.tagName === "A") event.preventDefault();
    navigateTo(route);
});

// Restore the route when browser Back/Forward is used.
window.addEventListener("popstate", () => {
    navigateTo(getRouteFromURL(), false);
});

// Start the application on the URL's current route.
navigateTo(getRouteFromURL(), false);

window.POSRouter = {
    navigate: navigateTo,
    getCurrentRoute: getRouteFromURL
};
